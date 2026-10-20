const express = require('express');
const prisma = require('../../config/prisma');
const { apiSuccess, apiError } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { resolveTenant, requirePermission } = require('../../middleware/tenant');

const router = express.Router();

router.use(authenticate);
router.use(resolveTenant);

// List branches
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

// Create branch
router.post('/', requirePermission('branches.manage'), async (req, res, next) => {
  try {
    const { name, code, city, state, country, pincode, address } = req.body;
    if (!name) return apiError(res, 'Branch name is required', 400);

    // Enforce tenant branch limits
    const currentBranchCount = await prisma.branch.count({
      where: { tenantId: req.tenant.id },
    });

    if (currentBranchCount >= req.tenant.maxBranches) {
      return apiError(
        res,
        `Branch limit reached (${req.tenant.maxBranches} branches). Please upgrade your subscription plan to add more branches.`,
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

    return apiSuccess(res, branch, 'Branch created successfully.', 201);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
