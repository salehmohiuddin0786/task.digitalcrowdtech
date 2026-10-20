const express = require('express');
const prisma = require('../../config/prisma');
const { apiSuccess } = require('../../utils/response');
const { authenticate } = require('../../middleware/auth');
const { resolveTenant } = require('../../middleware/tenant');

const router = express.Router();

router.use(authenticate);
router.use(resolveTenant);

// List active employees/members in current tenant
router.get('/', async (req, res, next) => {
  try {
    const members = await prisma.tenantMember.findMany({
      where: {
        tenantId: req.tenant.id,
      },
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
          },
        },
        _count: {
          select: {
            teamMemberships: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return apiSuccess(res, members, 'Team members retrieved.');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
