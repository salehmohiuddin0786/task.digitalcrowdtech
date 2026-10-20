const prisma = require('../../config/prisma');

class TasksService {
  async getTasks(tenantId, user, role, query = {}) {
    const {
      status,
      priority,
      branchId,
      teamId,
      assigneeId,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = query;

    const where = {
      tenantId,
    };

    // Role-based restrictions: EMPLOYEE only sees assigned tasks
    if (role === 'EMPLOYEE') {
      where.assignments = {
        some: {
          userId: user.id,
        },
      };
    } else if (assigneeId) {
      where.assignments = {
        some: {
          userId: assigneeId,
        },
      };
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (teamId) {
      where.teamId = teamId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: order },
        include: {
          branch: { select: { id: true, name: true, code: true } },
          team: { select: { id: true, name: true } },
          createdBy: { select: { id: true, fullName: true, email: true } },
          assignments: {
            include: {
              user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
            },
          },
          checklists: {
            select: { id: true, isCompleted: true },
          },
          _count: {
            select: { comments: true, evidence: true, prerequisites: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getTaskById(taskId, tenantId, user, role) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId,
      },
      include: {
        branch: true,
        team: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true } },
          },
        },
        checklists: {
          orderBy: { sortOrder: 'asc' },
        },
        prerequisites: {
          include: {
            prerequisiteTask: {
              select: { id: true, taskNumber: true, title: true, status: true, priority: true },
            },
          },
        },
        dependents: {
          include: {
            task: {
              select: { id: true, taskNumber: true, title: true, status: true },
            },
          },
        },
        evidence: {
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          include: {
            reviewer: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        activityLogs: {
          include: {
            user: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    if (role === 'EMPLOYEE') {
      const isAssigned = task.assignments.some((a) => a.userId === user.id);
      if (!isAssigned && task.createdById !== user.id) {
        const error = new Error('Access denied. You are not assigned to this task.');
        error.statusCode = 403;
        throw error;
      }
    }

    return task;
  }

  async createTask(tenantId, userId, data) {
    const {
      title,
      description,
      priority = 'NORMAL',
      category,
      branchId,
      teamId,
      dueDate,
      startDate,
      requiresProof = false,
      proofType,
      assigneeIds = [],
      checklistItems = [],
    } = data;

    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          tenantId,
          title: title.trim(),
          description: description?.trim() || null,
          priority,
          category: category?.trim() || null,
          branchId: branchId || null,
          teamId: teamId || null,
          createdById: userId,
          dueDate: dueDate ? new Date(dueDate) : null,
          startDate: startDate ? new Date(startDate) : null,
          requiresProof: Boolean(requiresProof),
          proofType: proofType || null,
          status: 'PENDING',
        },
      });

      // Add assignees
      if (assigneeIds && assigneeIds.length > 0) {
        const assignmentData = assigneeIds.map((uid) => ({
          taskId: newTask.id,
          userId: uid,
        }));
        await tx.taskAssignment.createMany({ data: assignmentData });

        // Add notifications for assigned users
        for (const uid of assigneeIds) {
          if (uid !== userId) {
            await tx.notification.create({
              data: {
                tenantId,
                userId: uid,
                title: `New Task Assigned: ${newTask.title}`,
                message: `You have been assigned to task "${newTask.title}".`,
                type: 'TASK_ASSIGNED',
                entityType: 'task',
                entityId: newTask.id,
              },
            });
          }
        }
      }

      // Add checklist items
      if (checklistItems && checklistItems.length > 0) {
        const checklistData = checklistItems.map((item, index) => ({
          taskId: newTask.id,
          title: typeof item === 'string' ? item : item.title,
          isCompleted: false,
          sortOrder: index,
        }));
        await tx.taskChecklistItem.createMany({ data: checklistData });
      }

      // Log activity
      await tx.taskActivityLog.create({
        data: {
          taskId: newTask.id,
          userId,
          action: 'CREATED',
          metadata: JSON.stringify({ priority, dueDate, assigneeCount: assigneeIds.length }),
        },
      });

      return newTask;
    });

    return this.getTaskById(task.id, tenantId, { id: userId }, 'OWNER');
  }

  async updateTaskStatus(taskId, tenantId, user, role, newStatus) {
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'CHANGES_REQUESTED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(newStatus)) {
      const error = new Error(`Invalid task status: ${newStatus}`);
      error.statusCode = 400;
      throw error;
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
      include: {
        prerequisites: {
          include: {
            prerequisiteTask: true,
          },
        },
      },
    });

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    // Role check: Only managers/owners can approve/complete or cancel
    if (['COMPLETED', 'CANCELLED'].includes(newStatus) && role === 'EMPLOYEE') {
      const error = new Error('Employees can only submit tasks for review. Approval requires a Manager or Owner.');
      error.statusCode = 403;
      throw error;
    }

    // Check prerequisites if moving into IN_PROGRESS or COMPLETED
    if (['IN_PROGRESS', 'COMPLETED'].includes(newStatus)) {
      const incompletePrereqs = task.prerequisites.filter(
        (p) => !p.isOverridden && p.prerequisiteTask.status !== 'COMPLETED'
      );

      if (incompletePrereqs.length > 0) {
        const prereqTitles = incompletePrereqs.map((p) => p.prerequisiteTask.title).join(', ');
        const error = new Error(
          `Cannot proceed. Blocked by incomplete prerequisite task(s): ${prereqTitles}`
        );
        error.statusCode = 422;
        throw error;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: {
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date() : null,
        },
      });

      await tx.taskActivityLog.create({
        data: {
          taskId,
          userId: user.id,
          action: 'STATUS_CHANGED',
          metadata: JSON.stringify({ from: task.status, to: newStatus }),
        },
      });

      return updatedTask;
    });

    return updated;
  }
}

module.exports = new TasksService();
