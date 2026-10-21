const prisma = require('../config/prisma');
const { apiError } = require('../utils/response');

async function resolveTenant(req, res, next) {
  try {
    if (!req.user) {
      return apiError(res, 'User not authenticated', 401);
    }

    const requestedTenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    let memberQuery = {
      userId: req.user.id,
      status: 'ACTIVE',
    };

    if (requestedTenantId) {
      memberQuery.tenantId = requestedTenantId;
    }

    // Find the user's membership
    const membership = await prisma.tenantMember.findFirst({
      where: memberQuery,
      include: {
        tenant: true,
        branch: true,
        teamMemberships: {
          include: {
            team: true,
          },
        },
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
    });

    if (!membership) {
      // If platform super admin, grant tenant context if requested or resolve default platform access
      if (req.user.isPlatformAdmin) {
        let targetTenantId = requestedTenantId;
        if (!targetTenantId) {
          const userMem = await prisma.tenantMember.findFirst({
            where: { userId: req.user.id, status: 'ACTIVE' },
            include: { tenant: true },
          });
          if (userMem) {
            targetTenantId = userMem.tenantId;
          } else {
            const firstTenant = await prisma.tenant.findFirst({ where: { isSuspended: false } });
            if (firstTenant) targetTenantId = firstTenant.id;
          }
        }

        if (targetTenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: targetTenantId },
          });
          if (tenant) {
            req.tenant = tenant;
            req.membership = null;
            req.role = 'SUPER_ADMIN';
            req.permissions = ['*'];
            req.teams = [];
            req.teamIds = [];
            return next();
          }
        }

        // Safe fallback for platform requests without existing tenant
        req.tenant = { id: null, name: 'Platform Global Scope' };
        req.membership = null;
        req.role = 'SUPER_ADMIN';
        req.permissions = ['*'];
        req.teams = [];
        req.teamIds = [];
        return next();
      }

      return apiError(res, 'Access denied. You are not a member of this tenant workspace.', 403);
    }

    if (membership.tenant.isSuspended && !req.user.isPlatformAdmin) {
      return apiError(res, 'This organization account has been suspended. Please contact billing support.', 403);
    }

    req.tenant = membership.tenant;
    req.membership = membership;
    req.role = req.user.isPlatformAdmin ? 'SUPER_ADMIN' : membership.role.name;
    req.branch = membership.branch;
    req.branchId = membership.branchId;
    req.teams = membership.teamMemberships ? membership.teamMemberships.map((tm) => tm.team) : [];
    req.teamIds = membership.teamMemberships ? membership.teamMemberships.map((tm) => tm.teamId) : [];
    req.permissions = req.user.isPlatformAdmin
      ? ['*']
      : membership.role.permissions.map((rp) => rp.permission.slug);

    next();
  } catch (error) {
    console.error('[Tenant Middleware Error]', error);
    return apiError(res, 'Failed to resolve tenant context', 500);
  }
}

function requirePermission(requiredPermission) {
  return (req, res, next) => {
    if (req.user?.isPlatformAdmin || req.role === 'SUPER_ADMIN' || req.role === 'OWNER') {
      return next();
    }

    if (!req.permissions || !req.permissions.includes(requiredPermission)) {
      return apiError(
        res,
        `Access denied. You lack the '${requiredPermission}' permission required for this action.`,
        403
      );
    }

    next();
  };
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (req.user?.isPlatformAdmin || req.role === 'OWNER') {
      return next();
    }

    if (!allowedRoles.includes(req.role)) {
      return apiError(res, 'Access denied. Your role is not authorized for this resource.', 403);
    }

    next();
  };
}

module.exports = {
  resolveTenant,
  requirePermission,
  requireRole,
};
