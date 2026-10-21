const prisma = require('../../config/prisma');
const { emitToTenant, emitToUser } = require('../../sockets/socketHandler');

class TasksService {
  async getTasks(tenantId, user, role, query = {}, membership = null) {
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

    // Branch Manager: strictly scoped to assigned branch
    if (role === 'BRANCH_MANAGER' && membership?.branchId) {
      if (branchId && branchId !== membership.branchId) {
        const error = new Error('Access denied. You can only view tasks from your assigned branch.');
        error.statusCode = 403;
        throw error;
      }
      where.branchId = membership.branchId;
    } else if (branchId) {
      where.branchId = branchId;
    }

    // Team Leader: strictly scoped to assigned teams
    if (role === 'TEAM_LEADER' && membership?.teamMemberships && membership.teamMemberships.length > 0) {
      const leadTeamIds = membership.teamMemberships.map((tm) => tm.teamId);
      if (teamId) {
        if (!leadTeamIds.includes(teamId)) {
          const error = new Error('Access denied. You can only view tasks from your assigned teams.');
          error.statusCode = 403;
          throw error;
        }
        where.teamId = teamId;
      } else {
        where.teamId = { in: leadTeamIds };
      }
    } else if (teamId) {
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

  async getTaskById(taskId, tenantId, user, role, membership = null) {
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

    // Branch restriction for Branch Manager
    if (role === 'BRANCH_MANAGER' && membership?.branchId) {
      if (task.branchId && task.branchId !== membership.branchId) {
        const error = new Error('Access denied. You can only access tasks within your assigned branch.');
        error.statusCode = 403;
        throw error;
      }
    }

    // Team restriction for Team Leader
    if (role === 'TEAM_LEADER' && membership?.teamMemberships && membership.teamMemberships.length > 0) {
      const leadTeamIds = membership.teamMemberships.map((tm) => tm.teamId);
      const isAssigned = task.assignments.some((a) => a.userId === user.id);
      if (task.teamId && !leadTeamIds.includes(task.teamId) && !isAssigned && task.createdById !== user.id) {
        const error = new Error('Access denied. You can only access tasks within your authorized teams.');
        error.statusCode = 403;
        throw error;
      }
    }

    return task;
  }

  async createTask(tenantId, userId, data, role = null, membership = null) {
    if (role === 'VIEWER' || role === 'CLIENT') {
      const error = new Error('Access denied. Viewers have read-only access and cannot create tasks.');
      error.statusCode = 403;
      throw error;
    }

    const {
      title,
      description,
      priority = 'NORMAL',
      category,
      dueDate,
      startDate,
      requiresProof = false,
      proofType,
      assigneeIds = [],
      checklistItems = [],
    } = data;

    let targetBranchId = data.branchId || null;
    let targetTeamId = data.teamId || null;

    if (role === 'BRANCH_MANAGER' && membership?.branchId) {
      if (targetBranchId && targetBranchId !== membership.branchId) {
        const error = new Error('Access denied. You cannot create tasks for a branch other than your own.');
        error.statusCode = 403;
        throw error;
      }
      targetBranchId = membership.branchId;
    }

    if (role === 'TEAM_LEADER' && membership?.teamMemberships && membership.teamMemberships.length > 0) {
      const leadTeamIds = membership.teamMemberships.map((tm) => tm.teamId);
      if (targetTeamId && !leadTeamIds.includes(targetTeamId)) {
        const error = new Error('Access denied. You can only create tasks for teams you coordinate.');
        error.statusCode = 403;
        throw error;
      }
    }

    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          tenantId,
          title: title.trim(),
          description: description?.trim() || null,
          priority,
          category: category?.trim() || null,
          branchId: targetBranchId,
          teamId: targetTeamId,
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
            const notif = await tx.notification.create({
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
            emitToUser(uid, 'notification:new', notif);
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

    emitToTenant(tenantId, 'task:created', task);
    return this.getTaskById(task.id, tenantId, { id: userId }, 'OWNER');
  }

  async updateTaskStatus(taskId, tenantId, user, role, newStatus) {
    if (role === 'VIEWER' || role === 'CLIENT') {
      const error = new Error('Access denied. Viewers have read-only access.');
      error.statusCode = 403;
      throw error;
    }

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
        evidence: true,
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

    // Proof of Execution check if submitting or completing a task that requires proof
    if (['SUBMITTED', 'COMPLETED'].includes(newStatus) && task.requiresProof) {
      const evidence = task.evidence || [];
      if (evidence.length === 0) {
        const error = new Error(
          'Proof of execution is required. Please upload required evidence before submitting or completing this task.'
        );
        error.statusCode = 422;
        throw error;
      }

      if (task.proofType === 'PHOTO') {
        const hasPhoto = evidence.some((e) => e.fileType === 'PHOTO');
        if (!hasPhoto) {
          const error = new Error('Photo proof of execution is required before this task can be submitted.');
          error.statusCode = 422;
          throw error;
        }
      } else if (task.proofType === 'VIDEO') {
        const hasVideo = evidence.some((e) => e.fileType === 'VIDEO');
        if (!hasVideo) {
          const error = new Error('Video proof of execution is required before this task can be submitted.');
          error.statusCode = 422;
          throw error;
        }
      } else if (task.proofType === 'BOTH') {
        const hasPhoto = evidence.some((e) => e.fileType === 'PHOTO');
        const hasVideo = evidence.some((e) => e.fileType === 'VIDEO');
        if (!hasPhoto || !hasVideo) {
          const error = new Error(
            'Both photo and video proof of execution are required before this task can be submitted.'
          );
          error.statusCode = 422;
          throw error;
        }
      }
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

    emitToTenant(tenantId, 'task:status_changed', { taskId, from: task.status, to: newStatus });
    return updated;
  }

  async updateTask(taskId, tenantId, userId, data) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const {
      title,
      description,
      priority,
      category,
      branchId,
      teamId,
      dueDate,
      startDate,
      requiresProof,
      proofType,
    } = data;

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (priority) updateData.priority = priority;
    if (category !== undefined) updateData.category = category ? category.trim() : null;
    if (branchId !== undefined) updateData.branchId = branchId || null;
    if (teamId !== undefined) updateData.teamId = teamId || null;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (requiresProof !== undefined) updateData.requiresProof = Boolean(requiresProof);
    if (proofType !== undefined) updateData.proofType = proofType;

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.task.update({
        where: { id: taskId },
        data: updateData,
      });

      await tx.taskActivityLog.create({
        data: {
          taskId,
          userId,
          action: 'UPDATED',
          metadata: JSON.stringify({ fieldsUpdated: Object.keys(updateData) }),
        },
      });

      return res;
    });

    return updated;
  }

  async deleteTask(taskId, tenantId, userId, role) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    if (role === 'EMPLOYEE' && task.createdById !== userId) {
      const error = new Error('Employees can only delete tasks they personally created.');
      error.statusCode = 403;
      throw error;
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return true;
  }

  async getMyTasks(tenantId, userId, query = {}) {
    const { status, priority, limit = 50 } = query;
    const where = {
      tenantId,
      assignments: {
        some: { userId },
      },
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    const tasks = await prisma.task.findMany({
      where,
      take: Math.min(100, parseInt(limit, 10)),
      orderBy: { dueDate: 'asc' },
      include: {
        branch: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        checklists: { select: { id: true, isCompleted: true } },
        _count: { select: { comments: true, evidence: true } },
      },
    });

    return tasks;
  }

  async assignUser(taskId, tenantId, assignerId, targetUserId) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const assignment = await prisma.taskAssignment.upsert({
      where: {
        taskId_userId: { taskId, userId: targetUserId },
      },
      update: {},
      create: { taskId, userId: targetUserId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    await prisma.taskActivityLog.create({
      data: {
        taskId,
        userId: assignerId,
        action: 'ASSIGNED',
        metadata: JSON.stringify({ assignedUser: assignment.user.fullName }),
      },
    });

    // Notify user
    if (assignerId !== targetUserId) {
      const notif = await prisma.notification.create({
        data: {
          tenantId,
          userId: targetUserId,
          title: `Assigned to Task: ${task.title}`,
          message: `You have been assigned to task "${task.title}".`,
          type: 'TASK_ASSIGNED',
          entityType: 'task',
          entityId: taskId,
        },
      });
      emitToUser(targetUserId, 'notification:new', notif);
    }

    emitToTenant(tenantId, 'task:assigned', { taskId, targetUserId });
    return assignment;
  }

  async unassignUser(taskId, tenantId, unassignerId, targetUserId) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    await prisma.taskAssignment.deleteMany({
      where: { taskId, userId: targetUserId },
    });

    await prisma.taskActivityLog.create({
      data: {
        taskId,
        userId: unassignerId,
        action: 'UNASSIGNED',
        metadata: JSON.stringify({ unassignedUserId: targetUserId }),
      },
    });

    return true;
  }

  async addChecklistItem(taskId, tenantId, userId, title) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const count = await prisma.taskChecklistItem.count({ where: { taskId } });

    const item = await prisma.taskChecklistItem.create({
      data: {
        taskId,
        title: title.trim(),
        sortOrder: count,
      },
    });

    return item;
  }

  async toggleChecklistItem(taskId, tenantId, userId, itemId, isCompleted) {
    const item = await prisma.taskChecklistItem.findFirst({
      where: { id: itemId, taskId },
    });
    if (!item) {
      const error = new Error('Checklist item not found');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: {
        isCompleted: Boolean(isCompleted),
        completedById: isCompleted ? userId : null,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    return updated;
  }

  async deleteChecklistItem(taskId, tenantId, userId, itemId) {
    const item = await prisma.taskChecklistItem.findFirst({
      where: { id: itemId, taskId },
    });
    if (!item) {
      const error = new Error('Checklist item not found');
      error.statusCode = 404;
      throw error;
    }

    await prisma.taskChecklistItem.delete({ where: { id: itemId } });
    return true;
  }

  async addComment(taskId, tenantId, userId, content) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
      include: {
        assignments: true,
      },
    });

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.taskComment.create({
        data: {
          taskId,
          userId,
          content: content.trim(),
        },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      });

      await tx.taskActivityLog.create({
        data: {
          taskId,
          userId,
          action: 'COMMENTED',
          metadata: JSON.stringify({ snippet: content.trim().substring(0, 50) }),
        },
      });

      return newComment;
    });

    emitToTenant(tenantId, 'task:commented', { taskId, comment });
    return comment;
  }

  async getComments(taskId, tenantId) {
    return prisma.taskComment.findMany({
      where: {
        taskId,
        task: { tenantId },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  async getActivityLogs(taskId, tenantId) {
    return prisma.taskActivityLog.findMany({
      where: {
        taskId,
        task: { tenantId },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, fullName: true } },
      },
    });
  }

  async addEvidence(taskId, tenantId, userId, data) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const { fileType = 'PHOTO', fileName, fileUrl, fileSize = 0, mimeType = 'image/jpeg', caption } = data;

    const evidence = await prisma.$transaction(async (tx) => {
      const item = await tx.taskEvidence.create({
        data: {
          taskId,
          uploadedById: userId,
          fileType,
          fileName,
          fileUrl,
          fileSize: parseInt(fileSize, 10) || 0,
          mimeType,
          caption: caption?.trim() || null,
        },
      });

      await tx.taskActivityLog.create({
        data: {
          taskId,
          userId,
          action: 'EVIDENCE_UPLOADED',
          metadata: JSON.stringify({ fileName, fileType, caption }),
        },
      });

      return item;
    });

    return evidence;
  }

  async getEvidence(taskId, tenantId) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.taskEvidence.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteEvidence(taskId, tenantId, userId, role, evidenceId) {
    const evidence = await prisma.taskEvidence.findFirst({
      where: { id: evidenceId, taskId, task: { tenantId } },
    });

    if (!evidence) {
      const error = new Error('Evidence item not found');
      error.statusCode = 404;
      throw error;
    }

    if (role === 'EMPLOYEE' && evidence.uploadedById !== userId) {
      const error = new Error('You can only delete evidence uploaded by yourself.');
      error.statusCode = 403;
      throw error;
    }

    await prisma.$transaction(async (tx) => {
      await tx.taskEvidence.delete({ where: { id: evidenceId } });

      await tx.taskActivityLog.create({
        data: {
          taskId,
          userId,
          action: 'EVIDENCE_DELETED',
          metadata: JSON.stringify({ fileName: evidence.fileName }),
        },
      });
    });

    return true;
  }

  async submitReview(taskId, tenantId, reviewerUser, role, data, membership = null) {
    if (role === 'EMPLOYEE' || role === 'VIEWER' || role === 'CLIENT') {
      const error = new Error('Employees, Clients, and Viewers cannot review or approve tasks. A Manager or Owner is required.');
      error.statusCode = 403;
      throw error;
    }

    const { decision, feedback } = data;
    if (!['APPROVED', 'CHANGES_REQUESTED'].includes(decision)) {
      const error = new Error('Review decision must be either APPROVED or CHANGES_REQUESTED.');
      error.statusCode = 400;
      throw error;
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    // Branch Manager restriction: must be in their assigned branch
    if (role === 'BRANCH_MANAGER' && membership?.branchId) {
      if (task.branchId && task.branchId !== membership.branchId) {
        const error = new Error('Access denied. You can only review tasks within your assigned branch.');
        error.statusCode = 403;
        throw error;
      }
    }

    // Self-approval guard: Prevent employees and supervisors from self-approving their own assigned tasks
    const isAssignee = task.assignments.some((a) => a.userId === reviewerUser.id);
    if (isAssignee && role !== 'OWNER' && !reviewerUser.isPlatformAdmin) {
      const error = new Error('Self-approval violation: You cannot approve or review a task assigned to yourself.');
      error.statusCode = 403;
      throw error;
    }

    const newStatus = decision === 'APPROVED' ? 'COMPLETED' : 'CHANGES_REQUESTED';

    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.taskReview.create({
        data: {
          taskId,
          reviewerId: reviewerUser.id,
          decision,
          feedback: feedback?.trim() || null,
        },
        include: {
          reviewer: { select: { id: true, fullName: true, email: true } },
        },
      });

      await tx.task.update({
        where: { id: taskId },
        data: {
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date() : null,
        },
      });

      await tx.taskActivityLog.create({
        data: {
          taskId,
          userId: reviewerUser.id,
          action: decision === 'APPROVED' ? 'APPROVED' : 'CHANGES_REQUESTED',
          metadata: JSON.stringify({ decision, feedback }),
        },
      });

      // Send notifications to assignees
      for (const a of task.assignments) {
        if (a.userId !== reviewerUser.id) {
          const notif = await tx.notification.create({
            data: {
              tenantId,
              userId: a.userId,
              title:
                decision === 'APPROVED'
                  ? `Task Approved: ${task.title}`
                  : `Changes Requested: ${task.title}`,
              message:
                decision === 'APPROVED'
                  ? `Your task "${task.title}" has been approved by ${reviewerUser.fullName}.`
                  : `Changes requested on "${task.title}": ${feedback || 'Please review supervisor comments.'}`,
              type: decision === 'APPROVED' ? 'TASK_COMPLETED' : 'TASK_CHANGES_REQUESTED',
              entityType: 'task',
              entityId: taskId,
            },
          });
          emitToUser(a.userId, 'notification:new', notif);
        }
      }

      return createdReview;
    });

    emitToTenant(tenantId, 'task:reviewed', { taskId, decision, status: newStatus });
    return review;
  }

  async getReviews(taskId, tenantId) {
    return prisma.taskReview.findMany({
      where: {
        taskId,
        task: { tenantId },
      },
      include: {
        reviewer: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Dependencies Management
  async addDependency(taskId, tenantId, userId, prerequisiteTaskId) {
    if (taskId === prerequisiteTaskId) {
      const error = new Error('A task cannot depend on itself.');
      error.statusCode = 400;
      throw error;
    }

    const [task, prereqTask] = await Promise.all([
      prisma.task.findFirst({ where: { id: taskId, tenantId } }),
      prisma.task.findFirst({ where: { id: prerequisiteTaskId, tenantId } }),
    ]);

    if (!task || !prereqTask) {
      const error = new Error('One or both tasks not found in tenant.');
      error.statusCode = 404;
      throw error;
    }

    const circular = await prisma.taskDependency.findFirst({
      where: {
        taskId: prerequisiteTaskId,
        prerequisiteTaskId: taskId,
      },
    });

    if (circular) {
      const error = new Error('Circular dependency detected. Cannot create dependency loop.');
      error.statusCode = 400;
      throw error;
    }

    const dependency = await prisma.$transaction(async (tx) => {
      const dep = await tx.taskDependency.create({
        data: {
          taskId,
          prerequisiteTaskId,
        },
        include: {
          prerequisiteTask: {
            select: { id: true, taskNumber: true, title: true, status: true },
          },
        },
      });

      await tx.taskActivityLog.create({
        data: {
          taskId,
          userId,
          action: 'DEPENDENCY_ADDED',
          metadata: JSON.stringify({
            prerequisiteTaskId,
            prerequisiteTitle: prereqTask.title,
          }),
        },
      });

      return dep;
    });

    return dependency;
  }

  async removeDependency(taskId, tenantId, userId, prerequisiteTaskId) {
    const dep = await prisma.taskDependency.findFirst({
      where: {
        taskId,
        prerequisiteTaskId,
        task: { tenantId },
      },
    });

    if (!dep) {
      const error = new Error('Dependency relationship not found.');
      error.statusCode = 404;
      throw error;
    }

    await prisma.$transaction(async (tx) => {
      await tx.taskDependency.delete({
        where: { id: dep.id },
      });

      await tx.taskActivityLog.create({
        data: {
          taskId,
          userId,
          action: 'DEPENDENCY_REMOVED',
          metadata: JSON.stringify({ prerequisiteTaskId }),
        },
      });
    });

    return true;
  }

  async overrideDependency(taskId, tenantId, userId, role, prerequisiteTaskId, overrideReason) {
    if (role === 'EMPLOYEE' || role === 'VIEWER' || role === 'CLIENT') {
      const error = new Error('Only Managers or Owners can override task prerequisites.');
      error.statusCode = 403;
      throw error;
    }

    if (!overrideReason || !overrideReason.trim()) {
      const error = new Error('An override justification reason is required.');
      error.statusCode = 400;
      throw error;
    }

    const dep = await prisma.taskDependency.findFirst({
      where: {
        taskId,
        prerequisiteTaskId,
        task: { tenantId },
      },
    });

    if (!dep) {
      const error = new Error('Dependency relationship not found.');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.taskDependency.update({
        where: { id: dep.id },
        data: {
          isOverridden: true,
          overrideReason: overrideReason.trim(),
          overriddenById: userId,
        },
      });

      await tx.taskActivityLog.create({
        data: {
          taskId,
          userId,
          action: 'DEPENDENCY_OVERRIDDEN',
          metadata: JSON.stringify({ prerequisiteTaskId, overrideReason }),
        },
      });

      return res;
    });

    return updated;
  }
}

module.exports = new TasksService();
