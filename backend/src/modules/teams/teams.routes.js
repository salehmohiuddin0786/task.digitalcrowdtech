const express = require('express');
const prisma = require('../../config/prisma');
const { apiSuccess, apiError } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { resolveTenant, requirePermission } = require('../../middleware/tenant');

const router = express.Router();

router.use(authenticate);
router.use(resolveTenant);

// List teams
router.get('/', async (req, res, next) => {
  try {
    const teams = await prisma.team.findMany({
      where: { tenantId: req.tenant.id },
      include: {
        branch: { select: { id: true, name: true } },
        _count: {
          select: { members: true, tasks: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return apiSuccess(res, teams, 'Teams retrieved.');
  } catch (error) {
    next(error);
  }
});

// Create team
router.post('/', requirePermission('teams.manage'), async (req, res, next) => {
  try {
    const { name, branchId, description } = req.body;
    if (!name) return apiError(res, 'Team name is required', 400);

    const team = await prisma.team.create({
      data: {
        tenantId: req.tenant.id,
        name: name.trim(),
        branchId: branchId || null,
        description: description?.trim() || null,
      },
    });

    return apiSuccess(res, team, 'Team created successfully.', 201);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
