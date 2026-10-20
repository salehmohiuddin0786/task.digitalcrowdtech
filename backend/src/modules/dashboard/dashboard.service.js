// Role-Specific Dashboard Metrics Service
// TaskDigitalCrowd — Digital Crowd Technologies
const prisma = require('../../config/prisma');

class DashboardService {
  async getMetrics(tenantId, user, role, membership = null, branchId = null) {
    // 1. SUPER_ADMIN: Platform Diagnostics, Tenant Administration, System Metrics
    if (role === 'SUPER_ADMIN' || (user?.isPlatformAdmin && !tenantId)) {
      const [totalTenants, activeTenants, totalUsers, totalTasks, recentTenants] = await Promise.all([
        prisma.tenant.count(),
        prisma.tenant.count({ where: { isSuspended: false } }),
        prisma.user.count(),
        prisma.task.count(),
        prisma.tenant.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { members: true, branches: true, tasks: true } },
          },
        }),
      ]);

      const mem = process.memoryUsage();
      return {
        role: 'SUPER_ADMIN',
        platformMetrics: {
          totalTenants,
          activeTenants,
          suspendedTenants: totalTenants - activeTenants,
          totalUsers,
          totalTasks,
          systemUptime: Math.floor(process.uptime()),
          heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          rssMb: Math.round(mem.rss / 1024 / 1024),
        },
        recentTenants: recentTenants.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          planTier: t.planTier,
          createdAt: t.createdAt,
          isSuspended: t.isSuspended,
          userCount: t._count.members,
          branchCount: t._count.branches,
          taskCount: t._count.tasks,
        })),
      };
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Base filter scoped strictly to tenant
    const baseFilter = {
      tenantId,
    };

    // 2. Role-specific scoping
    let branchInfo = null;
    let teamInfo = null;

    if (role === 'BRANCH_MANAGER' && membership?.branchId) {
      baseFilter.branchId = membership.branchId;
      branchInfo = membership.branch;
    } else if (branchId) {
      baseFilter.branchId = branchId;
    }

    if (role === 'TEAM_LEADER') {
      const teamIds = membership?.teamMemberships ? membership.teamMemberships.map((tm) => tm.teamId) : [];
      if (teamIds.length > 0) {
        baseFilter.teamId = { in: teamIds };
        teamInfo = membership.teamMemberships.map((tm) => tm.team);
      }
    }

    if (role === 'EMPLOYEE') {
      baseFilter.assignments = {
        some: {
          userId: user.id,
        },
      };
    }

    // Task counts by status
    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      submittedTasks,
      completedTasks,
      cancelledTasks,
      dueTodayTasks,
      overdueTasks,
      changesRequestedTasks,
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
      prisma.task.count({ where: { ...baseFilter, status: 'CHANGES_REQUESTED' } }),
    ]);

    const activeTasks = totalTasks - cancelledTasks;
    const completionRate = activeTasks > 0 ? Math.round((completedTasks / activeTasks) * 100) : 0;

    // Branch breakdown (for OWNER or VIEWER)
    let branchWorkload = [];
    if (['OWNER', 'VIEWER', 'SUPER_ADMIN'].includes(role)) {
      const branches = await prisma.branch.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: { tasks: true, members: true },
          },
        },
      });

      branchWorkload = branches.map((b) => ({
        id: b.id,
        name: b.name,
        taskCount: b._count.tasks,
        memberCount: b._count.members,
      }));
    }

    // Recent activity logs (scoped appropriately)
    const recentActivity = await prisma.taskActivityLog.findMany({
      where: {
        task: baseFilter,
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

    // Upcoming tasks due soon
    const upcomingTasks = await prisma.task.findMany({
      where: {
        ...baseFilter,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      take: 6,
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

    // Tasks awaiting review (critical for Managers and Owners)
    let pendingReviews = [];
    if (['OWNER', 'BRANCH_MANAGER'].includes(role)) {
      pendingReviews = await prisma.task.findMany({
        where: {
          ...baseFilter,
          status: 'SUBMITTED',
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          assignments: {
            include: { user: { select: { id: true, fullName: true } } },
          },
          _count: { select: { evidence: true } },
        },
      });
    }

    return {
      role,
      isReadOnly: role === 'VIEWER',
      branchInfo,
      teamInfo,
      overview: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        submittedTasks,
        completedTasks,
        cancelledTasks,
        dueTodayTasks,
        overdueTasks,
        changesRequestedTasks,
        completionRate,
      },
      branchWorkload,
      recentActivity,
      upcomingTasks,
      pendingReviews,
    };
  }
}

module.exports = new DashboardService();
