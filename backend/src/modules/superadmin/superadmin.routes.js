const express = require('express');
const { z } = require('zod');
const prisma = require('../../config/prisma');
const { apiSuccess, apiError } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(authenticate);

// Superadmin Authorization Guard
const requireSuperAdmin = (req, res, next) => {
  if (req.user?.isPlatformAdmin || req.role === 'SUPER_ADMIN') {
    return next();
  }
  return apiError(res, 'Access denied. Only Platform Superadmins can access this administrative module.', 403);
};

router.use(requireSuperAdmin);

// Validation Schemas
const companyStatusSchema = z.object({
  body: z.object({
    isSuspended: z.boolean(),
    reason: z.string().min(3, 'Suspension reason is required').optional(),
  }),
});

const extendTrialSchema = z.object({
  body: z.object({
    days: z.number().int().min(1, 'Days must be at least 1').max(90, 'Maximum trial extension is 90 days'),
    reason: z.string().min(3, 'Reason for trial extension is required').optional(),
  }),
});

const portalAccessSchema = z.object({
  body: z.object({
    enabledPortals: z.array(z.string()),
    reason: z.string().optional(),
  }),
});

// 1. List all companies with subscription and trial details
router.get('/companies', async (req, res, next) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { members: true, branches: true, teams: true, tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    const companies = tenants.map((t) => {
      const sub = t.subscriptions[0] || null;
      const isPaidTier = ['business', 'growth', 'enterprise'].includes(t.planTier?.toLowerCase());

      // Free Trial calculation
      let trialStatus = 'N/A';
      let trialExpiry = null;
      let remainingDays = 0;

      if (!isPaidTier) {
        if (sub?.trialEndsAt) {
          trialExpiry = new Date(sub.trialEndsAt);
        } else {
          // Default 14 days trial from creation
          const created = new Date(t.createdAt);
          trialExpiry = new Date(created.getTime() + 14 * 24 * 60 * 60 * 1000);
        }

        if (sub?.status === 'EXPIRED' || trialExpiry < now) {
          trialStatus = 'EXPIRED';
          remainingDays = 0;
        } else {
          trialStatus = 'TRIALING';
          remainingDays = Math.max(0, Math.ceil((trialExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        }
      } else {
        trialStatus = 'CONVERTED_PAID';
      }

      // Subscription status
      let subStatus = 'ACTIVE';
      if (t.isSuspended) {
        subStatus = 'SUSPENDED';
      } else if (sub) {
        subStatus = sub.status;
      } else if (trialStatus === 'EXPIRED') {
        subStatus = 'EXPIRED';
      }

      // Enabled portals
      let portals = ['owner', 'company_admin', 'manager', 'hr', 'lead', 'employee', 'client'];
      if (t.enabledPortals) {
        try {
          portals = JSON.parse(t.enabledPortals);
        } catch (e) {
          // fallback
        }
      }

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        isSuspended: t.isSuspended,
        suspendedAt: t.suspendedAt,
        suspensionReason: t.suspensionReason,
        planTier: t.planTier,
        subscriptionPlan: sub?.plan?.name || `${t.planTier.toUpperCase()} Plan`,
        subscriptionStatus: subStatus,
        subscriptionStartDate: sub?.startDate || t.createdAt,
        subscriptionExpiryDate: sub?.endDate || trialExpiry,
        freeTrialStatus: trialStatus,
        freeTrialExpiryDate: trialExpiry,
        remainingTrialDays: remainingDays,
        isTrialExtended: sub?.isTrialExtended || false,
        trialExtendedDays: sub?.trialExtendedDays || 0,
        enabledPortals: portals,
        counts: t._count,
        createdAt: t.createdAt,
      };
    });

    return apiSuccess(res, companies, 'Companies and subscription directory retrieved.');
  } catch (error) {
    next(error);
  }
});

// 2. Activate or Suspend Company
router.patch('/companies/:id/status', validate(companyStatusSchema), async (req, res, next) => {
  try {
    const { isSuspended, reason } = req.body;
    const tenantId = req.params.id;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return apiError(res, 'Company not found', 404);
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        isSuspended,
        suspendedAt: isSuspended ? new Date() : null,
        suspensionReason: isSuspended ? (reason?.trim() || 'Suspended by Superadmin') : null,
        suspendedById: isSuspended ? req.user.id : null,
      },
    });

    // Immutable Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: req.user.id,
        action: isSuspended ? 'TENANT_SUSPENDED' : 'TENANT_REACTIVATED',
        resourceType: 'tenant',
        resourceId: tenantId,
        details: JSON.stringify({
          companyName: tenant.name,
          previousStatus: tenant.isSuspended ? 'SUSPENDED' : 'ACTIVE',
          newStatus: isSuspended ? 'SUSPENDED' : 'ACTIVE',
          reason: reason || (isSuspended ? 'Administrative suspension' : 'Administrative reactivation'),
          adminEmail: req.user.email,
        }),
      },
    });

    return apiSuccess(
      res,
      updated,
      isSuspended ? `Company "${tenant.name}" has been suspended.` : `Company "${tenant.name}" has been reactivated.`
    );
  } catch (error) {
    next(error);
  }
});

// 3. Extend Free Trial
router.post('/companies/:id/extend-trial', validate(extendTrialSchema), async (req, res, next) => {
  try {
    const { days, reason } = req.body;
    const tenantId = req.params.id;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return apiError(res, 'Company not found', 404);
    }

    if (tenant.isSuspended) {
      return apiError(
        res,
        'Cannot extend free trial while company is suspended. Reactivate the company before extending trial.',
        400
      );
    }

    const isPaidTier = ['business', 'growth', 'enterprise'].includes(tenant.planTier?.toLowerCase());
    if (isPaidTier) {
      return apiError(
        res,
        `Company "${tenant.name}" already has an active paid subscription (${tenant.planTier.toUpperCase()}). Trial extension is not applicable.`,
        400
      );
    }

    const now = new Date();
    const existingSub = tenant.subscriptions[0] || null;

    // Determine current trial expiry
    let currentExpiry = null;
    if (existingSub?.trialEndsAt) {
      currentExpiry = new Date(existingSub.trialEndsAt);
    } else {
      currentExpiry = new Date(new Date(tenant.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000);
    }

    // Proposed new expiry date: from current expiry if not yet expired, or from now
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    // Find starter plan for subscription linkage
    let starterPlan = await prisma.plan.findUnique({ where: { code: 'starter' } });
    if (!starterPlan) {
      starterPlan = await prisma.plan.findFirst();
    }

    let updatedSub;
    if (existingSub) {
      updatedSub = await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          status: 'TRIALING',
          trialEndsAt: newExpiry,
          endDate: newExpiry,
          isTrialExtended: true,
          trialExtendedDays: (existingSub.trialExtendedDays || 0) + days,
        },
      });
    } else {
      updatedSub = await prisma.subscription.create({
        data: {
          tenantId,
          planId: starterPlan.id,
          status: 'TRIALING',
          startDate: now,
          endDate: newExpiry,
          trialEndsAt: newExpiry,
          isTrialExtended: true,
          trialExtendedDays: days,
        },
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: req.user.id,
        action: 'TRIAL_EXTENDED',
        resourceType: 'subscription',
        resourceId: updatedSub.id,
        details: JSON.stringify({
          companyName: tenant.name,
          daysAdded: days,
          previousExpiryDate: currentExpiry.toISOString(),
          newExpiryDate: newExpiry.toISOString(),
          reason: reason || 'Trial extension granted by Superadmin',
          adminEmail: req.user.email,
        }),
      },
    });

    const remainingDays = Math.max(0, Math.ceil((newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return apiSuccess(
      res,
      {
        trialEndsAt: newExpiry,
        remainingDays,
        trialStatus: 'TRIALING',
        isTrialExtended: true,
      },
      `Free trial for "${tenant.name}" extended by ${days} days until ${newExpiry.toLocaleDateString()}.`
    );
  } catch (error) {
    next(error);
  }
});

// 4. Update Organization Portal Access (RBAC)
router.patch('/companies/:id/portals', validate(portalAccessSchema), async (req, res, next) => {
  try {
    const { enabledPortals, reason } = req.body;
    const tenantId = req.params.id;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return apiError(res, 'Company not found', 404);
    }

    const previousPortals = tenant.enabledPortals
      ? JSON.parse(tenant.enabledPortals)
      : ['owner', 'company_admin', 'manager', 'hr', 'lead', 'employee', 'client'];

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        enabledPortals: JSON.stringify(enabledPortals),
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: req.user.id,
        action: 'PORTAL_ACCESS_UPDATED',
        resourceType: 'tenant_rbac',
        resourceId: tenantId,
        details: JSON.stringify({
          companyName: tenant.name,
          previousPortals,
          newPortals: enabledPortals,
          reason: reason || 'Portals updated by Superadmin',
          adminEmail: req.user.email,
        }),
      },
    });

    return apiSuccess(
      res,
      { enabledPortals },
      `Portal access configuration saved for "${tenant.name}".`
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
