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

const updateTenantSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Company name must be at least 2 characters').optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
  }),
});

// GET current tenant details & limits
router.get('/current', async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenant.id },
      include: {
        _count: {
          select: {
            members: { where: { status: 'ACTIVE' } },
            branches: { where: { isActive: true } },
            teams: true,
            tasks: true,
          },
        },
      },
    });

    return apiSuccess(res, tenant, 'Tenant workspace details retrieved.');
  } catch (error) {
    next(error);
  }
});

// GET tenant usage stats vs subscription limits
router.get('/usage', async (req, res, next) => {
  try {
    const [activeMembers, activeBranches, totalTasks, activeTeams] = await Promise.all([
      prisma.tenantMember.count({ where: { tenantId: req.tenant.id, status: 'ACTIVE' } }),
      prisma.branch.count({ where: { tenantId: req.tenant.id, isActive: true } }),
      prisma.task.count({ where: { tenantId: req.tenant.id } }),
      prisma.team.count({ where: { tenantId: req.tenant.id } }),
    ]);

    const usage = {
      planTier: req.tenant.planTier,
      users: {
        current: activeMembers,
        max: req.tenant.maxUsers,
        remaining: Math.max(0, req.tenant.maxUsers - activeMembers),
        isLimitReached: activeMembers >= req.tenant.maxUsers,
      },
      branches: {
        current: activeBranches,
        max: req.tenant.maxBranches,
        remaining: Math.max(0, req.tenant.maxBranches - activeBranches),
        isLimitReached: activeBranches >= req.tenant.maxBranches,
      },
      tasks: {
        total: totalTasks,
      },
      teams: {
        total: activeTeams,
      },
    };

    return apiSuccess(res, usage, 'Tenant usage metrics calculated.');
  } catch (error) {
    next(error);
  }
});

// PATCH update company settings
router.patch('/current', requirePermission('settings.manage'), validate(updateTenantSchema), async (req, res, next) => {
  try {
    const { name, timezone, currency, logoUrl } = req.body;
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (timezone) updateData.timezone = timezone.trim();
    if (currency) updateData.currency = currency.trim();
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

    const updated = await prisma.tenant.update({
      where: { id: req.tenant.id },
      data: updateData,
    });

    return apiSuccess(res, updated, 'Company settings updated successfully.');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
