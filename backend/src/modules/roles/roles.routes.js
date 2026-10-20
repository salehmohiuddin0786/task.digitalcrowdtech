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

// List all roles with member count in this tenant
router.get('/', async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            members: {
              where: { tenantId: req.tenant.id, status: 'ACTIVE' },
            },
            permissions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = roles.map((r) => ({
      id: r.id,
      name: r.name,
      label: r.label,
      description: r.description,
      isSystem: r.isSystem,
      memberCount: r._count.members,
      permissionCount: r._count.permissions,
    }));

    return apiSuccess(res, formatted, 'Roles retrieved.');
  } catch (error) {
    next(error);
  }
});

// List all available permissions grouped by module
router.get('/permissions/all', async (req, res, next) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { slug: 'asc' }],
    });

    // Group by module
    const grouped = {};
    for (const p of permissions) {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }
      grouped[p.module].push(p);
    }

    return apiSuccess(res, { permissions, grouped }, 'Permissions retrieved.');
  } catch (error) {
    next(error);
  }
});

// Get permissions for a specific role
router.get('/:roleId/permissions', async (req, res, next) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: req.params.roleId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) {
      return apiError(res, 'Role not found', 404);
    }

    const permissionSlugs = role.permissions.map((rp) => rp.permission.slug);
    return apiSuccess(res, { role, permissions: permissionSlugs }, 'Role permissions retrieved.');
  } catch (error) {
    next(error);
  }
});

const updateRolePermissionsSchema = z.object({
  body: z.object({
    permissionSlugs: z.array(z.string()),
  }),
});

// Update permissions assigned to a role (OWNER only)
router.put(
  '/:roleId/permissions',
  requirePermission('settings.manage'),
  validate(updateRolePermissionsSchema),
  async (req, res, next) => {
    try {
      // Only Business Owner or Super Admin can edit permissions
      if (req.role !== 'OWNER' && !req.user.isPlatformAdmin) {
        return apiError(res, 'Access denied. Only Business Owners can modify role permission matrices.', 403);
      }

      const role = await prisma.role.findUnique({
        where: { id: req.params.roleId },
      });

      if (!role) {
        return apiError(res, 'Role not found', 404);
      }

      // Prevent locking oneself out: OWNER role must retain essential permissions
      if (role.name === 'OWNER') {
        const requiredOwnerPerms = ['settings.manage', 'members.manage', 'tasks.view', 'tasks.create'];
        const missing = requiredOwnerPerms.filter((p) => !req.body.permissionSlugs.includes(p));
        if (missing.length > 0) {
          return apiError(
            res,
            `Cannot remove critical owner permissions: ${missing.join(', ')}`,
            400
          );
        }
      }

      // Fetch matching permissions by slugs
      const matchedPermissions = await prisma.permission.findMany({
        where: {
          slug: { in: req.body.permissionSlugs },
        },
      });

      // Atomic replace
      await prisma.$transaction(async (tx) => {
        // Delete current mappings for role
        await tx.rolePermission.deleteMany({
          where: { roleId: role.id },
        });

        // Insert new mappings
        if (matchedPermissions.length > 0) {
          const insertData = matchedPermissions.map((p) => ({
            roleId: role.id,
            permissionId: p.id,
          }));
          await tx.rolePermission.createMany({
            data: insertData,
          });
        }
      });

      return apiSuccess(
        res,
        { roleId: role.id, assignedCount: matchedPermissions.length },
        `Permissions for ${role.label} updated successfully.`
      );
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
