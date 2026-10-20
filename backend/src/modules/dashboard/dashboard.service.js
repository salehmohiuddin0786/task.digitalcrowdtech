const prisma = require('../../config/prisma');

class DashboardService {
  async getMetrics(tenantId, user, role, branchId = null) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Base filter scoped to tenant
    const baseFilter = {
      tenantId,
    };

    if (branchId) {
      baseFilter.branchId = branchId;
    }

    // Role-based restrictions: EMPLOYEE only sees assigned tasks
    if (role === 'EMPLOYEE') {
      baseFilter.assignments = {
        some: {
          userId: user.id,
        },
      };
    }

    // 1. Task counts by status
    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      submittedTasks,
      completedTasks,
      cancelledTasks,
      dueTodayTasks,
      overdueTasks,
    ] = await Promise.all([
      prisma.task.count({ where: baseFilter }),
      prisma.task.count({ where: { ...baseFilter, status: 'PENDING' } }),
      prisma.task.count({ where: { ...baseFilter, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...baseFilter, status: 'SUBMITTED' } }),
      prisma.task.count({ where: { ...baseFilter, status: 'COMPLETED' } }),
      prisma.task.count({ where: { ...baseFilter, status: 'CANCELLED' } }),
      prisma.task.count({
        where: {
          ...baseFilter,
          dueDate: { gte: startOfToday, lte: endOfToday },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
      prisma.task.count({
        where: {
          ...baseFilter,
          dueDate: { lt: startOfToday },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
    ]);

    const activeTasks = totalTasks - cancelledTasks;
    const completionRate = activeTasks > 0 ? Math.round((completedTasks / activeTasks) * 100) : 0;

    // 2. Branch breakdown
    const branches = await prisma.branch.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { tasks: true, members: true },
        },
      },
    });

    const branchWorkload = branches.map((b) => ({
      id: b.id,
      name: b.name,
      taskCount: b._count.tasks,
      memberCount: b._count.members,
    }));

    // 3. Recent activity logs
    const recentActivity = await prisma.taskActivityLog.findMany({
      where: {
        task: {
          tenantId,
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: { id: true, title: true, priority: true, status: true },
        },
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    // 4. Tasks due soon (Next 5)
    const upcomingTasks = await prisma.task.findMany({
      where: {
        ...baseFilter,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      take: 5,
      orderBy: { dueDate: 'asc' },
      include: {
        branch: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        _count: {
          select: { checklists: true },
        },
      },
    });

    return {
      overview: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        submittedTasks,
        completedTasks,
        cancelledTasks,
        dueTodayTasks,
        overdueTasks,
        completionRate,
      },
      branchWorkload,
      recentActivity,
      upcomingTasks,
    };
  }
}

module.exports = new DashboardService();
