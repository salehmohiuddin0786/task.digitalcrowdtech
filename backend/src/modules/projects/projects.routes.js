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

const PROJECT_STATUSES = [
  'PLANNING',
  'NOT_STARTED',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
  'ARCHIVED',
  'ACTIVE', // backward compatibility alias for IN_PROGRESS
];

const PROJECT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Project title must be at least 2 characters'),
    code: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    branchId: z.string().optional().nullable(),
    leadId: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    targetEndDate: z.string().optional().nullable(),
    priority: z.enum(PROJECT_PRIORITIES).default('MEDIUM'),
    status: z.enum(PROJECT_STATUSES).default('IN_PROGRESS'),
  }),
});

const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    branchId: z.string().optional().nullable(),
    leadId: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    targetEndDate: z.string().optional().nullable(),
    priority: z.enum(PROJECT_PRIORITIES).optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
  }),
});

// Helper to compute project task metrics
function computeProjectStats(tasks = [], now = new Date()) {
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

// Helper to safely generate the next authoritative project code
async function generateNextProjectCode(tenantId) {
  const currentYear = new Date().getFullYear();
  const prefix = `PRJ-${currentYear}-`;

  const existing = await prisma.project.findMany({
    where: {
      tenantId,
      code: { startsWith: prefix },
    },
    select: { code: true },
  });

  let maxSeq = 0;
  for (const p of existing) {
    if (p.code) {
      const match = p.code.match(/PRJ-\d{4}-(\d+)/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return `${prefix}${nextSeq}`;
}

// 0a. Generate Next Project Code (Preview endpoint)
router.get('/preview-code', requirePermission('branches.view'), async (req, res, next) => {
  try {
    const nextCode = await generateNextProjectCode(req.tenant.id);
    return apiSuccess(res, { code: nextCode }, 'Preview project code generated.');
  } catch (error) {
    next(error);
  }
});

// 0b. Get Eligible Project Leads for current organization
router.get('/eligible-leads', requirePermission('branches.view'), async (req, res, next) => {
  try {
    const { branchId } = req.query;

    const members = await prisma.tenantMember.findMany({
      where: {
        tenantId: req.tenant.id,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
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
            code: true,
          },
        },
      },
      orderBy: { user: { fullName: 'asc' } },
    });

    const eligible = members.map((m) => ({
      userId: m.user.id,
      fullName: m.user.fullName,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      roleName: m.role.name,
      roleLabel: m.role.label,
      designation: m.designation || m.role.label,
      branchId: m.branchId,
      branchName: m.branch?.name || null,
      branchCode: m.branch?.code || null,
      isOrgWide: !m.branchId || ['OWNER', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(m.role.name),
    }));

    return apiSuccess(res, eligible, 'Eligible project leads retrieved.');
  } catch (error) {
    next(error);
  }
});

// 1. List Projects with Dynamic Task Progress, Lead, and Priority
router.get('/', requirePermission('branches.view'), async (req, res, next) => {
  try {
    const { branchId, status, priority, search, leadId } = req.query;
    const where = { tenantId: req.tenant.id };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (leadId) {
      where.leadId = leadId;
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
        lead: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
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
        lead: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
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

// 3. Create Project with Auto Code Generation, Lead Assignment & Priority
router.post('/', requirePermission('branches.manage'), validate(createProjectSchema), async (req, res, next) => {
  try {
    const { name, code, description, branchId, leadId, startDate, targetEndDate, priority, status } = req.body;

    // Validate that branch belongs to the same tenant if provided
    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, tenantId: req.tenant.id },
      });
      if (!branch) {
        return apiError(res, 'Specified branch does not exist or belongs to another organization.', 400);
      }
    }

    // Validate Project Lead if provided
    if (leadId) {
      const leadMember = await prisma.tenantMember.findFirst({
        where: {
          userId: leadId,
          tenantId: req.tenant.id,
          status: 'ACTIVE',
        },
        include: { role: true },
      });

      if (!leadMember) {
        return apiError(res, 'The selected project lead is not an active member of this organization.', 400);
      }

      // Branch authorization check for lead
      if (branchId && leadMember.branchId && leadMember.branchId !== branchId) {
        // Only allow if lead has an organization-wide leadership role
        const isOrgLeader = ['OWNER', 'COMPANY_ADMIN', 'SUPER_ADMIN'].includes(leadMember.role.name);
        if (!isOrgLeader) {
          return apiError(
            res,
            'The selected project lead is restricted to a different branch and cannot lead projects for this branch.',
            400
          );
        }
      }
    }

    // Determine Project Code with concurrency safety
    let project = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!project && attempts < maxAttempts) {
      attempts++;
      let candidateCode = code?.trim();
      if (!candidateCode) {
        candidateCode = await generateNextProjectCode(req.tenant.id);
      }

      try {
        project = await prisma.project.create({
          data: {
            tenantId: req.tenant.id,
            branchId: branchId || null,
            leadId: leadId || null,
            name: name.trim(),
            code: candidateCode,
            description: description?.trim() || null,
            priority: priority || 'MEDIUM',
            status: status === 'ACTIVE' ? 'IN_PROGRESS' : (status || 'IN_PROGRESS'),
            startDate: startDate ? new Date(startDate) : null,
            targetEndDate: targetEndDate ? new Date(targetEndDate) : null,
            createdById: req.user.id,
          },
          include: {
            branch: { select: { id: true, name: true, code: true } },
            createdBy: { select: { id: true, fullName: true } },
            lead: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          },
        });
      } catch (err) {
        // If unique constraint error on code, retry with a fresh generated code
        if (err.code === 'P2002' && attempts < maxAttempts) {
          // Retry loop will generate fresh sequence
          continue;
        }
        throw err;
      }
    }

    if (!project) {
      return apiError(res, 'Could not generate a unique project code. Please try again.', 500);
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: req.tenant.id,
        userId: req.user.id,
        action: 'PROJECT_CREATED',
        resourceType: 'project',
        resourceId: project.id,
        details: JSON.stringify({
          name: project.name,
          code: project.code,
          priority: project.priority,
          branchId,
          leadId,
        }),
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

    const { name, code, description, branchId, leadId, startDate, targetEndDate, priority, status } = req.body;

    if (branchId !== undefined && branchId !== null) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, tenantId: req.tenant.id },
      });
      if (!branch) {
        return apiError(res, 'Specified branch does not exist or belongs to another organization.', 400);
      }
    }

    if (leadId !== undefined && leadId !== null) {
      const leadMember = await prisma.tenantMember.findFirst({
        where: {
          userId: leadId,
          tenantId: req.tenant.id,
          status: 'ACTIVE',
        },
        include: { role: true },
      });

      if (!leadMember) {
        return apiError(res, 'The selected project lead is not an active member of this organization.', 400);
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (code !== undefined) updateData.code = code ? code.trim() : null;
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (branchId !== undefined) updateData.branchId = branchId || null;
    if (leadId !== undefined) updateData.leadId = leadId || null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (targetEndDate !== undefined) updateData.targetEndDate = targetEndDate ? new Date(targetEndDate) : null;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      updateData.status = status === 'ACTIVE' ? 'IN_PROGRESS' : status;
      if (status === 'COMPLETED') updateData.completedAt = new Date();
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true } },
        lead: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
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
