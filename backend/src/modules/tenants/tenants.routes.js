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

const planSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Plan code is required'),
    name: z.string().min(2, 'Plan name is required'),
    priceMonthly: z.number().int().nonnegative().default(0),
    maxUsers: z.number().int().positive().default(5),
    maxBranches: z.number().int().positive().default(1),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

const updatePlanSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    priceMonthly: z.number().int().nonnegative().optional(),
    maxUsers: z.number().int().positive().optional(),
    maxBranches: z.number().int().positive().optional(),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
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

// GET available subscription plans
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { priceMonthly: 'asc' },
    });
    const parsedPlans = plans.map((p) => ({
      ...p,
      features: p.featuresJson ? JSON.parse(p.featuresJson) : [],
    }));
    return apiSuccess(res, parsedPlans, 'Subscription plans retrieved.');
  } catch (error) {
    next(error);
  }
});

// POST create plan (Superadmin only)
router.post('/plans', validate(planSchema), async (req, res, next) => {
  try {
    if (!req.user.isPlatformAdmin && req.role !== 'SUPER_ADMIN') {
      return apiError(res, 'Access denied. Only Platform Superadmins can create subscription plans.', 403);
    }

    const { code, name, priceMonthly, maxUsers, maxBranches, features, isActive = true } = req.body;
    const existing = await prisma.plan.findUnique({ where: { code } });
    if (existing) {
      return apiError(res, `A plan with code "${code}" already exists.`, 400);
    }

    const plan = await prisma.plan.create({
      data: {
        code: code.toLowerCase().trim(),
        name: name.trim(),
        priceMonthly,
        maxUsers,
        maxBranches,
        featuresJson: features ? JSON.stringify(features) : JSON.stringify([]),
        isActive,
      },
    });

    return apiSuccess(res, { ...plan, features: features || [] }, 'Subscription plan created.', 201);
  } catch (error) {
    next(error);
  }
});

// PATCH update plan (Superadmin only)
router.patch('/plans/:id', validate(updatePlanSchema), async (req, res, next) => {
  try {
    if (!req.user.isPlatformAdmin && req.role !== 'SUPER_ADMIN') {
      return apiError(res, 'Access denied. Only Platform Superadmins can edit subscription plans.', 403);
    }

    const { name, priceMonthly, maxUsers, maxBranches, features, isActive } = req.body;
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (priceMonthly !== undefined) updateData.priceMonthly = priceMonthly;
    if (maxUsers !== undefined) updateData.maxUsers = maxUsers;
    if (maxBranches !== undefined) updateData.maxBranches = maxBranches;
    if (features !== undefined) updateData.featuresJson = JSON.stringify(features);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.plan.update({
      where: { id: req.params.id },
      data: updateData,
    });

    return apiSuccess(
      res,
      { ...updated, features: updated.featuresJson ? JSON.parse(updated.featuresJson) : [] },
      'Subscription plan updated.'
    );
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
