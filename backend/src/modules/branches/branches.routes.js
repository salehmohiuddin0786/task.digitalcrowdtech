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

const branchSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Branch name must be at least 2 characters'),
    code: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default('India'),
    pincode: z.string().optional(),
    address: z.string().optional(),
  }),
});

const updateBranchSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
    address: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

// 1. List branches
router.get('/', async (req, res, next) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { tenantId: req.tenant.id },
      include: {
        _count: {
          select: { members: true, tasks: true, teams: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return apiSuccess(res, branches, 'Branches retrieved.');
  } catch (error) {
    next(error);
  }
});

// 2. Get single branch
router.get('/:id', async (req, res, next) => {
  try {
    const branch = await prisma.branch.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: {
        teams: true,
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true } },
            role: { select: { id: true, name: true, label: true } },
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!branch) {
      return apiError(res, 'Branch not found', 404);
    }

    return apiSuccess(res, branch, 'Branch details retrieved.');
  } catch (error) {
    next(error);
  }
});

// 3. Create branch (enforces plan limit)
router.post('/', requirePermission('branches.manage'), validate(branchSchema), async (req, res, next) => {
  try {
    const { name, code, city, state, country, pincode, address } = req.body;

    const currentBranchCount = await prisma.branch.count({
      where: { tenantId: req.tenant.id, isActive: true },
    });

    if (currentBranchCount >= req.tenant.maxBranches) {
      return apiError(
        res,
        `Branch limit reached (${req.tenant.maxBranches} branches on ${req.tenant.planTier} tier). Please upgrade your subscription plan to add more branches.`,
        403
      );
    }

    const branch = await prisma.branch.create({
      data: {
        tenantId: req.tenant.id,
        name: name.trim(),
        code: code?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || 'India',
        pincode: pincode?.trim() || null,
        address: address?.trim() || null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: req.tenant.id,
        userId: req.user.id,
        action: 'BRANCH_CREATED',
        resourceType: 'branch',
        resourceId: branch.id,
        details: JSON.stringify({ name: branch.name, code: branch.code }),
      },
    });

    return apiSuccess(res, branch, 'Branch created successfully.', 201);
  } catch (error) {
    next(error);
  }
});

// 4. Update branch
router.patch('/:id', requirePermission('branches.manage'), validate(updateBranchSchema), async (req, res, next) => {
  try {
    const existing = await prisma.branch.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });

    if (!existing) {
      return apiError(res, 'Branch not found', 404);
    }

    const updated = await prisma.branch.update({
      where: { id: req.params.id },
      data: req.body,
    });

    return apiSuccess(res, updated, 'Branch updated successfully.');
  } catch (error) {
    next(error);
  }
});

// 5. Delete or deactivate branch
router.delete('/:id', requirePermission('branches.manage'), async (req, res, next) => {
  try {
    const existing = await prisma.branch.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: {
        _count: { select: { tasks: true, members: true } },
      },
    });

    if (!existing) {
      return apiError(res, 'Branch not found', 404);
    }

    // If branch has tasks or members, safely soft-deactivate instead of hard deleting
    if (existing._count.tasks > 0 || existing._count.members > 0) {
      await prisma.branch.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      return apiSuccess(res, null, 'Branch has active dependencies and has been deactivated.');
    }

    await prisma.branch.delete({
      where: { id: req.params.id },
    });

    return apiSuccess(res, null, 'Branch deleted successfully.');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
