const prisma = require('../../config/prisma');
const { emitToTenant, emitToUser } = require('../../sockets/socketHandler');

class RecurrenceService {
  calculateNextRun(frequency, intervalDays = 1, fromDate = new Date()) {
    const next = new Date(fromDate);
    switch (frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + (intervalDays || 1));
        break;
      case 'WEEKDAYS': {
        const day = next.getDay();
        if (day === 5) {
          // Friday -> Monday (+3 days)
          next.setDate(next.getDate() + 3);
        } else if (day === 6) {
          // Saturday -> Monday (+2 days)
          next.setDate(next.getDate() + 2);
        } else {
          next.setDate(next.getDate() + 1);
        }
        break;
      }
      case 'WEEKLY':
        next.setDate(next.getDate() + 7 * (intervalDays || 1));
        break;
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        next.setDate(next.getDate() + (intervalDays || 1));
        break;
    }
    return next;
  }

  async createRule(tenantId, userId, data) {
    const {
      frequency,
      intervalDays = 1,
      daysOfWeek,
      dayOfMonth,
      startDate = new Date(),
      endDate,
      titleTemplate,
      description,
      priority = 'NORMAL',
      branchId,
      teamId,
    } = data;

    const start = new Date(startDate);
    const nextRun = start;

    const rule = await prisma.recurrenceRule.create({
      data: {
        tenantId,
        frequency,
        intervalDays: parseInt(intervalDays, 10) || 1,
        daysOfWeek: daysOfWeek || null,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth, 10) : null,
        startDate: start,
        endDate: endDate ? new Date(endDate) : null,
        titleTemplate: titleTemplate.trim(),
        description: description?.trim() || null,
        priority,
        branchId: branchId || null,
        teamId: teamId || null,
        isActive: true,
        nextRunAt: nextRun,
      },
    });

    return rule;
  }

  async getRules(tenantId) {
    return prisma.recurrenceRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });
  }

  async updateRule(ruleId, tenantId, data) {
    const rule = await prisma.recurrenceRule.findFirst({
      where: { id: ruleId, tenantId },
    });
    if (!rule) {
      const error = new Error('Recurrence rule not found');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.recurrenceRule.update({
      where: { id: ruleId },
      data: {
        ...(data.titleTemplate && { titleTemplate: data.titleTemplate.trim() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority && { priority: data.priority }),
        ...(data.frequency && { frequency: data.frequency }),
        ...(data.intervalDays && { intervalDays: parseInt(data.intervalDays, 10) }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
      },
    });

    return updated;
  }

  async deleteRule(ruleId, tenantId) {
    const rule = await prisma.recurrenceRule.findFirst({
      where: { id: ruleId, tenantId },
    });
    if (!rule) {
      const error = new Error('Recurrence rule not found');
      error.statusCode = 404;
      throw error;
    }

    await prisma.recurrenceRule.delete({ where: { id: ruleId } });
    return true;
  }

  async generateDueTasks(tenantId, options = {}) {
    const { forceAll = false } = options;
    const now = new Date();

    const where = {
      tenantId,
      isActive: true,
    };

    if (!forceAll) {
      where.nextRunAt = { lte: now };
    }

    const rules = await prisma.recurrenceRule.findMany({ where });
    const generatedTasks = [];

    for (const rule of rules) {
      // Check if past endDate
      if (rule.endDate && rule.endDate < now) {
        await prisma.recurrenceRule.update({
          where: { id: rule.id },
          data: { isActive: false },
        });
        continue;
      }

      const todayStr = new Date().toLocaleDateString();
      const taskTitle = `${rule.titleTemplate} (${todayStr})`;

      // Find tenant owner for createdById foreign key relation
      const ownerMember = await prisma.tenantMember.findFirst({
        where: { tenantId: rule.tenantId, role: { name: 'OWNER' } },
        select: { userId: true },
      });
      const creatorUserId = ownerMember?.userId || options.userId;

      // Create recurring task instance
      const newTask = await prisma.$transaction(async (tx) => {
        const createdTask = await tx.task.create({
          data: {
            tenantId: rule.tenantId,
            title: taskTitle,
            description: rule.description,
            priority: rule.priority,
            branchId: rule.branchId,
            teamId: rule.teamId,
            createdById: creatorUserId,
            recurrenceId: rule.id,
            status: 'PENDING',
            dueDate: new Date(Date.now() + 86400000), // Due in 24 hours
          },
        });

        // Compute next run
        const nextRun = this.calculateNextRun(rule.frequency, rule.intervalDays, now);

        await tx.recurrenceRule.update({
          where: { id: rule.id },
          data: {
            lastRunAt: now,
            nextRunAt: nextRun,
          },
        });

        await tx.taskActivityLog.create({
          data: {
            taskId: createdTask.id,
            action: 'CREATED_BY_SCHEDULE',
            metadata: JSON.stringify({ recurrenceRuleId: rule.id, frequency: rule.frequency }),
          },
        });

        return createdTask;
      });

      generatedTasks.push(newTask);
      emitToTenant(rule.tenantId, 'task:created', newTask);
    }

    return {
      rulesProcessed: rules.length,
      tasksGenerated: generatedTasks.length,
      tasks: generatedTasks,
    };
  }
}

module.exports = new RecurrenceService();
