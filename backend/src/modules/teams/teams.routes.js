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

const teamSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Team name must be at least 2 characters'),
    branchId: z.string().optional().nullable(),
    description: z.string().optional(),
  }),
});

const teamMemberSchema = z.object({
  body: z.object({
    memberId: z.string().min(1, 'Member ID is required'),
    isLeader: z.boolean().default(false),
  }),
});

// 1. List teams
router.get('/', async (req, res, next) => {
  try {
    const teams = await prisma.team.findMany({
      where: { tenantId: req.tenant.id },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        members: {
          include: {
            member: {
              include: {
                user: { select: { id: true, fullName: true, email: true } },
                role: { select: { id: true, name: true, label: true } },
              },
            },
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formatted = teams.map((t) => ({
      ...t,
      memberCount: t.members.length,
      taskCount: t._count.tasks,
    }));

    return apiSuccess(res, formatted, 'Teams retrieved.');
  } catch (error) {
    next(error);
  }
});

// 2. Get single team
router.get('/:id', async (req, res, next) => {
  try {
    const team = await prisma.team.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: {
        branch: true,
        members: {
          include: {
            member: {
              include: {
                user: { select: { id: true, fullName: true, email: true, phone: true } },
                role: { select: { id: true, name: true, label: true } },
              },
            },
          },
        },
        _count: { select: { tasks: true } },
      },
    });

    if (!team) {
      return apiError(res, 'Team not found', 404);
    }

    return apiSuccess(res, team, 'Team details retrieved.');
  } catch (error) {
    next(error);
  }
});

// 3. Create team
router.post('/', requirePermission('teams.manage'), validate(teamSchema), async (req, res, next) => {
  try {
    const { name, branchId, description } = req.body;

    // If branchId is supplied, ensure it belongs to this tenant
    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, tenantId: req.tenant.id },
      });
      if (!branch) {
        return apiError(res, 'Branch not found or belongs to another organization', 400);
      }
    }

    const team = await prisma.team.create({
      data: {
        tenantId: req.tenant.id,
        name: name.trim(),
        branchId: branchId || null,
        description: description?.trim() || null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: req.tenant.id,
        userId: req.user.id,
        action: 'TEAM_CREATED',
        resourceType: 'team',
        resourceId: team.id,
        details: JSON.stringify({ name: team.name, branchId }),
      },
    });

    return apiSuccess(res, team, 'Team created successfully.', 201);
  } catch (error) {
    next(error);
  }
});

// 4. Update team
router.patch('/:id', requirePermission('teams.manage'), async (req, res, next) => {
  try {
    const { name, branchId, description } = req.body;
    const existing = await prisma.team.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });

    if (!existing) {
      return apiError(res, 'Team not found', 404);
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (branchId !== undefined) updateData.branchId = branchId || null;

    const updated = await prisma.team.update({
      where: { id: req.params.id },
      data: updateData,
    });

    return apiSuccess(res, updated, 'Team updated successfully.');
  } catch (error) {
    next(error);
  }
});

// 5. Delete team
router.delete('/:id', requirePermission('teams.manage'), async (req, res, next) => {
  try {
    const existing = await prisma.team.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });

    if (!existing) {
      return apiError(res, 'Team not found', 404);
    }

    await prisma.team.delete({
      where: { id: req.params.id },
    });

    return apiSuccess(res, null, 'Team deleted successfully.');
  } catch (error) {
    next(error);
  }
});

// 6. Assign member to team
router.post('/:id/members', requirePermission('teams.manage'), validate(teamMemberSchema), async (req, res, next) => {
  try {
    const { memberId, isLeader } = req.body;

    const [team, member] = await Promise.all([
      prisma.team.findFirst({ where: { id: req.params.id, tenantId: req.tenant.id } }),
      prisma.tenantMember.findFirst({ where: { id: memberId, tenantId: req.tenant.id } }),
    ]);

    if (!team) return apiError(res, 'Team not found', 404);
    if (!member) return apiError(res, 'Member not found in this organization', 404);

    const teamMember = await prisma.teamMember.upsert({
      where: {
        teamId_memberId: {
          teamId: team.id,
          memberId: member.id,
        },
      },
      update: { isLeader: Boolean(isLeader) },
      create: {
        teamId: team.id,
        memberId: member.id,
        isLeader: Boolean(isLeader),
      },
    });

    return apiSuccess(res, teamMember, 'Staff member assigned to team.');
  } catch (error) {
    next(error);
  }
});

// 7. Remove member from team
router.delete('/:id/members/:memberId', requirePermission('teams.manage'), async (req, res, next) => {
  try {
    const team = await prisma.team.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });
    if (!team) return apiError(res, 'Team not found', 404);

    await prisma.teamMember.deleteMany({
      where: {
        teamId: req.params.id,
        memberId: req.params.memberId,
      },
    });

    return apiSuccess(res, null, 'Member removed from team.');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
