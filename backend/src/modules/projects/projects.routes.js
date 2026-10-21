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

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters'),
    code: z.string().optional(),
    description: z.string().optional().nullable(),
    branchId: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    targetEndDate: z.string().optional().nullable(),
    status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).default('ACTIVE'),
  }),
});

const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    branchId: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    targetEndDate: z.string().optional().nullable(),
    status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional(),
  }),
});

// Helper to compute project task metrics
function computeProjectStats(tasks, now = new Date()) {
  const eligibleTasks = tasks.filter((t) => t.status !== 'CANCELLED');
  const totalEligible = eligibleTasks.length;
  const completed = eligibleTasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgress = eligibleTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const pending = eligibleTasks.filter((t) => ['PENDING', 'CHANGES_REQUESTED', 'SUBMITTED'].includes(t.status)).length;
  const overdue = eligibleTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED'
  ).length;

  const completionPercentage = totalEligible > 0 ? Math.round((completed / totalEligible) * 100) : 0;

  return {
    totalTasks: tasks.length,
    eligibleTasks: totalEligible,
    completedTasks: completed,
    inProgressTasks: inProgress,
    pendingTasks: pending,
    overdueTasks: overdue,
    completionPercentage,
    hasTasks: totalEligible > 0,
  };
}

// 1. List Projects with Dynamic Task Progress
router.get('/', requirePermission('branches.view'), async (req, res, next) => {
  try {
    const { branchId, status, search } = req.query;
    const where = { tenantId: req.tenant.id };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    // Role-based restrictions
    if (req.role === 'BRANCH_MANAGER' && req.membership?.branchId) {
      where.OR = [
        { branchId: req.membership.branchId },
        { branchId: null },
      ];
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
            { description: { contains: search } },
          ],
        },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
        tasks: {
          select: {
            id: true,
            status: true,
            dueDate: true,
            title: true,
            priority: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const formatted = projects.map((p) => {
      const stats = computeProjectStats(p.tasks, now);
      const { tasks, ...rest } = p;
      return {
        ...rest,
        stats,
        taskPreview: tasks.slice(0, 5),
      };
    });

    return apiSuccess(res, formatted, 'Projects retrieved successfully.');
  } catch (error) {
    next(error);
  }
});

// 2. Get Single Project
router.get('/:id', requirePermission('branches.view'), async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: {
        branch: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
        tasks: {
          include: {
            assignments: {
              include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return apiError(res, 'Project not found', 404);
    }

    const stats = computeProjectStats(project.tasks);

    return apiSuccess(res, { ...project, stats }, 'Project details retrieved.');
  } catch (error) {
    next(error);
  }
});

// 3. Create Project
router.post('/', requirePermission('branches.manage'), validate(createProjectSchema), async (req, res, next) => {
  try {
    const { name, code, description, branchId, startDate, targetEndDate, status } = req.body;

    // Validate that branch belongs to the same tenant if provided
    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, tenantId: req.tenant.id },
      });
      if (!branch) {
        return apiError(res, 'Specified branch does not exist or belongs to another organization.', 400);
      }
    }

    const project = await prisma.project.create({
      data: {
        tenantId: req.tenant.id,
        branchId: branchId || null,
        name: name.trim(),
        code: code?.trim() || null,
        description: description?.trim() || null,
        status: status || 'ACTIVE',
        startDate: startDate ? new Date(startDate) : null,
        targetEndDate: targetEndDate ? new Date(targetEndDate) : null,
        createdById: req.user.id,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: req.tenant.id,
        userId: req.user.id,
        action: 'PROJECT_CREATED',
        resourceType: 'project',
        resourceId: project.id,
        details: JSON.stringify({ name: project.name, code: project.code, branchId }),
      },
    });

    return apiSuccess(
      res,
      {
        ...project,
        stats: {
          totalTasks: 0,
          eligibleTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0,
          completionPercentage: 0,
          hasTasks: false,
        },
      },
      'Project created successfully.',
      201
    );
  } catch (error) {
    next(error);
  }
});

// 4. Update Project
router.patch('/:id', requirePermission('branches.manage'), validate(updateProjectSchema), async (req, res, next) => {
  try {
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });

    if (!existing) {
      return apiError(res, 'Project not found', 404);
    }

    const { name, code, description, branchId, startDate, targetEndDate, status } = req.body;

    if (branchId !== undefined && branchId !== null) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, tenantId: req.tenant.id },
      });
      if (!branch) {
        return apiError(res, 'Specified branch does not exist or belongs to another organization.', 400);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (code !== undefined) updateData.code = code ? code.trim() : null;
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (branchId !== undefined) updateData.branchId = branchId || null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (targetEndDate !== undefined) updateData.targetEndDate = targetEndDate ? new Date(targetEndDate) : null;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'COMPLETED') updateData.completedAt = new Date();
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    return apiSuccess(res, updated, 'Project updated successfully.');
  } catch (error) {
    next(error);
  }
});

// 5. Archive or Delete Project
router.delete('/:id', requirePermission('branches.manage'), async (req, res, next) => {
  try {
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
      include: { _count: { select: { tasks: true } } },
    });

    if (!existing) {
      return apiError(res, 'Project not found', 404);
    }

    if (existing._count.tasks > 0) {
      // Soft-archive project to preserve linked task data
      await prisma.project.update({
        where: { id: req.params.id },
        data: { status: 'ARCHIVED' },
      });
      return apiSuccess(res, null, 'Project contains linked tasks and has been safely archived.');
    }

    await prisma.project.delete({
      where: { id: req.params.id },
    });

    return apiSuccess(res, null, 'Project deleted successfully.');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
