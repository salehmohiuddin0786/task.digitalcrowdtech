const express = require('express');
const { z } = require('zod');
const prisma = require('../../config/prisma');
const { apiSuccess, apiError } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { resolveTenant, requirePermission } = require('../../middleware/tenant');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(authenticate);
router.use(resolveTenant);

const updateMemberSchema = z.object({
  body: z.object({
    roleId: z.string().optional(),
    branchId: z.string().optional().nullable(),
    designation: z.string().optional().nullable(),
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  }),
});

// 1. List all members in tenant
router.get('/', requirePermission('members.view'), async (req, res, next) => {
  try {
    const { branchId, status = 'ACTIVE' } = req.query;
    const where = {
      tenantId: req.tenant.id,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    const members = await prisma.tenantMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            label: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        teamMemberships: {
          include: {
            team: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return apiSuccess(res, members, 'Staff members retrieved.');
  } catch (error) {
    next(error);
  }
});

// 2. Get single member details
router.get('/:id', requirePermission('members.view'), async (req, res, next) => {
  try {
    const member = await prisma.tenantMember.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        role: true,
        branch: true,
        teamMemberships: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!member) {
      return apiError(res, 'Member not found', 404);
    }

    return apiSuccess(res, member, 'Member details retrieved.');
  } catch (error) {
    next(error);
  }
});

// 3. Update member's role, branch, designation, or status
router.patch('/:id', requirePermission('members.manage'), validate(updateMemberSchema), async (req, res, next) => {
  try {
    const { roleId, branchId, designation, status } = req.body;

    const existingMember = await prisma.tenantMember.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: { role: true },
    });

    if (!existingMember) {
      return apiError(res, 'Member not found', 404);
    }

    // Protection rule: Cannot suspend or demote the owner if they are the only owner
    if (existingMember.role.name === 'OWNER' && (status === 'SUSPENDED' || (roleId && roleId !== existingMember.roleId))) {
      const ownerCount = await prisma.tenantMember.count({
        where: {
          tenantId: req.tenant.id,
          role: { name: 'OWNER' },
          status: 'ACTIVE',
        },
      });

      if (ownerCount <= 1) {
        return apiError(res, 'Cannot demote or suspend the sole active Business Owner of this company.', 400);
      }
    }

    // If roleId provided, verify role exists
    if (roleId) {
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) return apiError(res, 'Specified role does not exist', 400);
      
      // Platform administrator privilege escalation guard
      if (role.name === 'SUPER_ADMIN') {
        return apiError(res, 'Privilege escalation: SUPER_ADMIN role cannot be assigned within a tenant workspace.', 403);
      }
      if (role.name === 'OWNER' && req.role !== 'OWNER' && !req.user.isPlatformAdmin) {
        return apiError(res, 'Privilege escalation: You cannot assign the Owner role.', 403);
      }
    }

    // If branchId provided, verify branch belongs to this tenant
    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, tenantId: req.tenant.id },
      });
      if (!branch) return apiError(res, 'Branch not found or belongs to another organization', 400);
    }

    const updateData = {};
    if (roleId) updateData.roleId = roleId;
    if (branchId !== undefined) updateData.branchId = branchId || null;
    if (designation !== undefined) updateData.designation = designation ? designation.trim() : null;
    if (status) updateData.status = status;

    const updated = await prisma.tenantMember.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        role: true,
        branch: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: req.tenant.id,
        userId: req.user.id,
        action: 'MEMBER_UPDATED',
        resourceType: 'tenant_member',
        resourceId: updated.id,
        details: JSON.stringify({ updatedMember: updated.user.email, changes: updateData }),
      },
    });

    return apiSuccess(res, updated, 'Member updated successfully.');
  } catch (error) {
    next(error);
  }
});

// 4. Deactivate / remove member
router.delete('/:id', requirePermission('members.manage'), async (req, res, next) => {
  try {
    const existing = await prisma.tenantMember.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: { role: true },
    });

    if (!existing) {
      return apiError(res, 'Member not found', 404);
    }

    if (existing.role.name === 'OWNER') {
      return apiError(res, 'Cannot remove a Business Owner. Transfer ownership first.', 400);
    }

    // Soft suspend membership to preserve audit logs and historical assignments
    await prisma.tenantMember.update({
      where: { id: req.params.id },
      data: { status: 'SUSPENDED' },
    });

    // Remove from active teams
    await prisma.teamMember.deleteMany({
      where: { memberId: req.params.id },
    });

    return apiSuccess(res, null, 'Member account suspended and removed from active teams.');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
