const prisma = require('../../config/prisma');

class ReportsService {
  async getOverviewReport(tenantId, query = {}) {
    const { branchId, startDate, endDate } = query;

    const where = {
      tenantId,
      ...(branchId && { branchId }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const now = new Date();

    const [
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksByStatus,
      tasksByPriority,
      branches,
      teams,
    ] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.task.count({
        where: {
          ...where,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: { lt: now },
        },
      }),
      prisma.task.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where,
        _count: { priority: true },
      }),
      prisma.branch.findMany({
        where: { tenantId },
        include: {
          tasks: {
            select: { id: true, status: true, dueDate: true },
          },
        },
      }),
      prisma.team.findMany({
        where: { tenantId },
        include: {
          branch: { select: { name: true } },
          tasks: {
            select: { id: true, status: true, dueDate: true },
          },
        },
      }),
    ]);

    // Format Status Distribution
    const statusDistribution = {
      PENDING: 0,
      IN_PROGRESS: 0,
      SUBMITTED: 0,
      CHANGES_REQUESTED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    tasksByStatus.forEach((s) => {
      statusDistribution[s.status] = s._count.status;
    });

    // Format Priority Distribution
    const priorityDistribution = {
      LOW: 0,
      NORMAL: 0,
      HIGH: 0,
      URGENT: 0,
    };
    tasksByPriority.forEach((p) => {
      priorityDistribution[p.priority] = p._count.priority;
    });

    // Compute Branch Breakdown
    const branchBreakdown = branches.map((b) => {
      const branchTotal = b.tasks.length;
      const branchCompleted = b.tasks.filter((t) => t.status === 'COMPLETED').length;
      const branchOverdue = b.tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && !['COMPLETED', 'CANCELLED'].includes(t.status)
      ).length;
      const completionRate = branchTotal > 0 ? Math.round((branchCompleted / branchTotal) * 100) : 0;

      return {
        id: b.id,
        name: b.name,
        code: b.code,
        city: b.city,
        totalTasks: branchTotal,
        completedTasks: branchCompleted,
        overdueTasks: branchOverdue,
        completionRate,
      };
    });

    // Compute Team Breakdown
    const teamBreakdown = teams.map((tm) => {
      const teamTotal = tm.tasks.length;
      const teamCompleted = tm.tasks.filter((t) => t.status === 'COMPLETED').length;
      const completionRate = teamTotal > 0 ? Math.round((teamCompleted / teamTotal) * 100) : 0;

      return {
        id: tm.id,
        name: tm.name,
        branchName: tm.branch?.name || 'HQ',
        totalTasks: teamTotal,
        completedTasks: teamCompleted,
        completionRate,
      };
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const onTimeRate =
      completedTasks > 0 ? Math.max(0, Math.round(((completedTasks - overdueTasks) / completedTasks) * 100)) : 100;

    return {
      kpis: {
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate,
        onTimeRate,
      },
      statusDistribution,
      priorityDistribution,
      branchBreakdown,
      teamBreakdown,
    };
  }

  async getEmployeeLeaderboard(tenantId, query = {}) {
    const now = new Date();

    const members = await prisma.tenantMember.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, phone: true },
        },
        role: {
          select: { id: true, name: true },
        },
      },
    });

    const leaderboard = await Promise.all(
      members.map(async (m) => {
        const assignments = await prisma.taskAssignment.findMany({
          where: {
            userId: m.user.id,
            task: { tenantId },
          },
          include: {
            task: {
              select: { id: true, status: true, dueDate: true, completedAt: true },
            },
          },
        });

        const totalAssigned = assignments.length;
        const completed = assignments.filter((a) => a.task.status === 'COMPLETED').length;
        const inProgress = assignments.filter((a) => a.task.status === 'IN_PROGRESS').length;
        const underReview = assignments.filter((a) => a.task.status === 'SUBMITTED').length;
        const overdue = assignments.filter(
          (a) =>
            a.task.dueDate &&
            new Date(a.task.dueDate) < now &&
            !['COMPLETED', 'CANCELLED'].includes(a.task.status)
        ).length;

        const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

        let performanceTier = 'Needs Attention';
        if (completionRate >= 80) performanceTier = 'Top Performer';
        else if (completionRate >= 50) performanceTier = 'On Track';

        return {
          userId: m.user.id,
          fullName: m.user.fullName,
          email: m.user.email,
          role: m.role.name,
          totalAssigned,
          completed,
          inProgress,
          underReview,
          overdue,
          completionRate,
          performanceTier,
        };
      })
    );

    // Sort descending by completionRate, then completed count
    leaderboard.sort((a, b) => b.completionRate - a.completionRate || b.completed - a.completed);

    return leaderboard;
  }

  async exportReportsCSV(tenantId) {
    const tasks = await prisma.task.findMany({
      where: { tenantId },
      include: {
        branch: { select: { name: true } },
        team: { select: { name: true } },
        assignments: {
          include: { user: { select: { fullName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Task Number',
      'Title',
      'Status',
      'Priority',
      'Branch',
      'Team',
      'Assignees',
      'Due Date',
      'Completed Date',
      'Requires Proof',
    ];

    const rows = tasks.map((t) => [
      t.taskNumber,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      `"${t.branch?.name || 'HQ'}"`,
      `"${t.team?.name || 'General'}"`,
      `"${t.assignments.map((a) => a.user.fullName).join(', ')}"`,
      t.dueDate ? t.dueDate.toISOString().split('T')[0] : 'None',
      t.completedAt ? t.completedAt.toISOString().split('T')[0] : 'Incomplete',
      t.requiresProof ? 'Yes' : 'No',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csvContent;
  }
}

module.exports = new ReportsService();
