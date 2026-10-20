const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../../config/prisma');
const { apiSuccess, apiError } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { resolveTenant, requirePermission } = require('../../middleware/tenant');
const validate = require('../../middleware/validate');
const { generateAccessToken, generateRefreshToken, hashToken } = require('../../utils/jwt');

const router = express.Router();

const createInvitationSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    roleId: z.string().min(1, 'Role is required'),
    branchId: z.string().optional(),
    designation: z.string().optional(),
  }),
});

const acceptInvitationSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Invitation token is required'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    phone: z.string().optional(),
  }),
});

// 1. PUBLIC: Verify invitation token
router.get('/verify/:token', async (req, res, next) => {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token: req.params.token },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!invitation) {
      return apiError(res, 'Invalid invitation token.', 404);
    }

    if (invitation.acceptedAt) {
      return apiError(res, 'This invitation has already been accepted.', 410);
    }

    if (invitation.expiresAt < new Date()) {
      return apiError(res, 'This invitation link has expired. Please request a new invitation.', 410);
    }

    const role = await prisma.role.findUnique({
      where: { id: invitation.roleId },
      select: { id: true, name: true, label: true },
    });

    return apiSuccess(
      res,
      {
        email: invitation.email,
        tenant: invitation.tenant,
        role,
      },
      'Invitation is valid.'
    );
  } catch (error) {
    next(error);
  }
});

// 2. PUBLIC: Accept invitation & complete onboarding
router.post('/accept', validate(acceptInvitationSchema), async (req, res, next) => {
  try {
    const { token, fullName, password, phone } = req.body;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { tenant: true },
    });

    if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      return apiError(res, 'Invitation is invalid, already used, or expired.', 400);
    }

    // Check user limit before accepting
    const currentMemberCount = await prisma.tenantMember.count({
      where: { tenantId: invitation.tenantId, status: 'ACTIVE' },
    });

    if (currentMemberCount >= invitation.tenant.maxUsers) {
      return apiError(
        res,
        'This organization has reached its maximum licensed user capacity. Please contact your company administrator.',
        403
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // Find or create user
      let user = await tx.user.findUnique({
        where: { email: invitation.email.toLowerCase() },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: invitation.email.toLowerCase(),
            passwordHash,
            fullName: fullName.trim(),
            phone: phone ? phone.trim() : null,
            emailVerifiedAt: new Date(),
          },
        });
      }

      // Check if already a member
      const existingMember = await tx.tenantMember.findUnique({
        where: {
          tenantId_userId: {
            tenantId: invitation.tenantId,
            userId: user.id,
          },
        },
      });

      if (existingMember) {
        throw new Error('User is already an active member of this organization.');
      }

      // Create membership
      const member = await tx.tenantMember.create({
        data: {
          tenantId: invitation.tenantId,
          userId: user.id,
          roleId: invitation.roleId,
          branchId: invitation.branchId,
          status: 'ACTIVE',
        },
      });

      // Mark invitation accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      // Welcome Notification
      await tx.notification.create({
        data: {
          tenantId: invitation.tenantId,
          userId: user.id,
          title: `Welcome to ${invitation.tenant.name}`,
          message: `Your membership has been activated successfully. You can now view and manage your assigned tasks.`,
          type: 'SYSTEM',
        },
      });

      return { user, member };
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: result.user.id,
      tenantId: invitation.tenantId,
    });
    const refreshToken = generateRefreshToken({ userId: result.user.id });

    await prisma.refreshSession.create({
      data: {
        userId: result.user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return apiSuccess(
      res,
      {
        user: { id: result.user.id, email: result.user.email, fullName: result.user.fullName },
        tenant: invitation.tenant,
        accessToken,
        refreshToken,
      },
      'Invitation accepted. Welcome to the organization!'
    );
  } catch (error) {
    next(error);
  }
});

// --- PROTECTED TENANT ROUTES ---
router.use(authenticate);
router.use(resolveTenant);

// 3. List active pending invitations for tenant
router.get('/', requirePermission('members.view'), async (req, res, next) => {
  try {
    const invitations = await prisma.invitation.findMany({
      where: {
        tenantId: req.tenant.id,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Populate role info
    const roles = await prisma.role.findMany();
    const roleMap = Object.fromEntries(roles.map((r) => [r.id, r]));

    const formatted = invitations.map((inv) => ({
      ...inv,
      role: roleMap[inv.roleId] || { name: 'EMPLOYEE', label: 'Employee' },
    }));

    return apiSuccess(res, formatted, 'Invitations retrieved.');
  } catch (error) {
    next(error);
  }
});

// 4. Create new employee invitation (checks subscription limit)
router.post('/', requirePermission('members.invite'), validate(createInvitationSchema), async (req, res, next) => {
  try {
    const { email, roleId, branchId, designation } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // Check user capacity limit
    const activeMemberCount = await prisma.tenantMember.count({
      where: { tenantId: req.tenant.id, status: 'ACTIVE' },
    });

    if (activeMemberCount >= req.tenant.maxUsers) {
      return apiError(
        res,
        `User capacity reached (${req.tenant.maxUsers} users maximum on ${req.tenant.planTier} tier). Upgrade your plan to invite more team members.`,
        403
      );
    }

    // Privilege escalation guard on invitation roles
    const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
    if (!targetRole) return apiError(res, 'Specified role does not exist', 400);
    if (targetRole.name === 'SUPER_ADMIN') {
      return apiError(res, 'Privilege escalation: SUPER_ADMIN role cannot be assigned or invited within a tenant workspace.', 403);
    }
    if (targetRole.name === 'OWNER' && req.role !== 'OWNER' && !req.user.isPlatformAdmin) {
      return apiError(res, 'Privilege escalation: You cannot invite Owner users.', 403);
    }

    // Check if already an active member in this tenant
    const existingMember = await prisma.tenantMember.findFirst({
      where: {
        tenantId: req.tenant.id,
        user: { email: cleanEmail },
      },
    });

    if (existingMember) {
      return apiError(res, 'This user is already an active member of your organization.', 409);
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        tenantId: req.tenant.id,
        email: cleanEmail,
        roleId,
        branchId: branchId || null,
        token,
        expiresAt,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: req.tenant.id,
        userId: req.user.id,
        action: 'INVITATION_CREATED',
        resourceType: 'invitation',
        resourceId: invitation.id,
        details: JSON.stringify({ email: cleanEmail, roleId }),
      },
    });

    return apiSuccess(
      res,
      {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        inviteUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/register?token=${token}`,
        expiresAt: invitation.expiresAt,
      },
      'Invitation created successfully.',
      201
    );
  } catch (error) {
    next(error);
  }
});

// 5. Revoke an invitation
router.delete('/:id', requirePermission('members.invite'), async (req, res, next) => {
  try {
    const invitation = await prisma.invitation.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });

    if (!invitation) {
      return apiError(res, 'Invitation not found', 404);
    }

    await prisma.invitation.delete({
      where: { id: req.params.id },
    });

    return apiSuccess(res, null, 'Invitation revoked successfully.');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
