const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');
const { generateAccessToken, generateRefreshToken, hashToken, verifyRefreshToken } = require('../../utils/jwt');

class AuthService {
  async register({ companyName, fullName, email, password, phone }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      const error = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }

    // Generate clean slug for tenant
    const baseSlug = companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const tenantSlug = `${baseSlug || 'company'}-${randomSuffix}`;

    const passwordHash = await bcrypt.hash(password, 10);

    const ownerRole = await prisma.role.findUnique({
      where: { name: 'OWNER' },
    });

    if (!ownerRole) {
      throw new Error('System initialization error: OWNER role not found in database.');
    }

    // Transaction for atomic company onboarding
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: companyName.trim(),
          slug: tenantSlug,
          planTier: 'starter',
          maxUsers: 5,
          maxBranches: 1,
        },
      });

      // 2. Create Default Branch
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: 'Headquarters',
          code: 'HQ',
          city: 'Main Office',
          country: 'India',
        },
      });

      // 3. Create Default Team
      const team = await tx.team.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          name: 'Operations Team',
          description: 'Primary operations and task management team',
        },
      });

      // 4. Create User
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          fullName: fullName.trim(),
          phone: phone ? phone.trim() : null,
          emailVerifiedAt: new Date(),
        },
      });

      // 5. Create Tenant Membership
      const member = await tx.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          roleId: ownerRole.id,
          branchId: branch.id,
          designation: 'Business Owner & Admin',
          status: 'ACTIVE',
        },
      });

      // 6. Add to Team
      await tx.teamMember.create({
        data: {
          teamId: team.id,
          memberId: member.id,
          isLeader: true,
        },
      });

      // 7. Welcome Notification
      await tx.notification.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          title: `Welcome to TaskDigitalCrowd!`,
          message: `Your company workspace for ${tenant.name} is ready. Start by adding branches, inviting team members, or creating tasks.`,
          type: 'SYSTEM',
        },
      });

      return { tenant, user, member, branch };
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: result.user.id,
      tenantId: result.tenant.id,
    });
    const refreshToken = generateRefreshToken({
      userId: result.user.id,
    });

    // Store refresh session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshSession.create({
      data: {
        userId: result.user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt,
      },
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        phone: result.user.phone,
        isPlatformAdmin: result.user.isPlatformAdmin,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        planTier: result.tenant.planTier,
      },
      role: 'OWNER',
      accessToken,
      refreshToken,
    };
  }

  async login({ email, password, userAgent, ipAddress }) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            tenant: true,
            branch: true,
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Your user account has been deactivated. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    if (user.memberships.length === 0 && !user.isPlatformAdmin) {
      const error = new Error('No active company memberships found for this account.');
      error.statusCode = 403;
      throw error;
    }

    // Default to first active membership
    const primaryMembership = user.memberships[0] || null;
    const activeTenant = primaryMembership ? primaryMembership.tenant : null;
    const activeRole = primaryMembership ? primaryMembership.role.name : (user.isPlatformAdmin ? 'SUPER_ADMIN' : 'VIEWER');
    const permissions = primaryMembership
      ? primaryMembership.role.permissions.map((rp) => rp.permission.slug)
      : (user.isPlatformAdmin ? ['*'] : []);

    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: activeTenant ? activeTenant.id : null,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    // Save refresh session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt,
      },
    });

    const tenantsList = user.memberships.map((m) => ({
      id: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      role: m.role.name,
      designation: m.designation,
      branch: m.branch ? { id: m.branch.id, name: m.branch.name } : null,
    }));

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isPlatformAdmin: user.isPlatformAdmin,
      },
      tenant: activeTenant
        ? {
            id: activeTenant.id,
            name: activeTenant.name,
            slug: activeTenant.slug,
            planTier: activeTenant.planTier,
            timezone: activeTenant.timezone,
          }
        : null,
      tenants: tenantsList,
      role: activeRole,
      permissions,
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken) {
    if (!refreshToken) {
      const error = new Error('Refresh token is required');
      error.statusCode = 401;
      throw error;
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.userId) {
      const error = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      throw error;
    }

    const hashed = hashToken(refreshToken);
    const session = await prisma.refreshSession.findUnique({
      where: { tokenHash: hashed },
      include: { user: true },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      const error = new Error('Session has been revoked or expired');
      error.statusCode = 401;
      throw error;
    }

    // Revoke old session and issue new rotation
    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    const newAccessToken = generateAccessToken({ userId: session.userId });
    const newRefreshToken = generateRefreshToken({ userId: session.userId });

    await prisma.refreshSession.create({
      data: {
        userId: session.userId,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken) {
    if (!refreshToken) return true;
    const hashed = hashToken(refreshToken);
    await prisma.refreshSession.updateMany({
      where: { tokenHash: hashed },
      data: { isRevoked: true },
    });
    return true;
  }

  async getCurrentSession(userId, requestedTenantId = null) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            tenant: true,
            branch: true,
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    let activeMembership = null;
    if (requestedTenantId) {
      activeMembership = user.memberships.find((m) => m.tenantId === requestedTenantId);
    }
    if (!activeMembership && user.memberships.length > 0) {
      activeMembership = user.memberships[0];
    }

    const activeTenant = activeMembership ? activeMembership.tenant : null;
    const activeRole = activeMembership ? activeMembership.role.name : (user.isPlatformAdmin ? 'SUPER_ADMIN' : 'VIEWER');
    const permissions = activeMembership
      ? activeMembership.role.permissions.map((rp) => rp.permission.slug)
      : (user.isPlatformAdmin ? ['*'] : []);

    const tenantsList = user.memberships.map((m) => ({
      id: m.tenant.id,
      name: m.tenant.name,
      slug: m.tenant.slug,
      role: m.role.name,
      designation: m.designation,
      branch: m.branch ? { id: m.branch.id, name: m.branch.name } : null,
    }));

    // Fetch unread notification count
    let unreadCount = 0;
    if (activeTenant) {
      unreadCount = await prisma.notification.count({
        where: {
          tenantId: activeTenant.id,
          userId: user.id,
          isRead: false,
        },
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isPlatformAdmin: user.isPlatformAdmin,
      },
      tenant: activeTenant
        ? {
            id: activeTenant.id,
            name: activeTenant.name,
            slug: activeTenant.slug,
            planTier: activeTenant.planTier,
            timezone: activeTenant.timezone,
            currency: activeTenant.currency,
          }
        : null,
      branch: activeMembership?.branch || null,
      tenants: tenantsList,
      role: activeRole,
      permissions,
      unreadNotificationCount: unreadCount,
    };
  }
}

module.exports = new AuthService();
