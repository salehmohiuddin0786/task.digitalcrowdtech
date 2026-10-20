// Centralized Role & Permission Navigation Configuration
// TaskDigitalCrowd — Digital Crowd Technologies

import {
  LayoutDashboard,
  ListTodo,
  CheckSquare,
  KanbanSquare,
  Building2,
  Users2,
  UserCircle,
  ShieldCheck,
  BarChart3,
  Bell,
  Settings,
  Activity,
  Repeat,
} from 'lucide-react';
import { hasPermission } from './permissions';

export function getAuthorizedNavigation(user, role, permissions = []) {
  if (!role && !user) return [];

  const isSuperAdmin = user?.isPlatformAdmin && (!role || role === 'SUPER_ADMIN');

  // 1. SUPER_ADMIN Navigation
  if (isSuperAdmin) {
    return [
      {
        key: 'platform-overview',
        label: 'Platform Overview',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        key: 'organizations',
        label: 'System Tenants',
        href: '/dashboard',
        icon: Building2,
      },
      {
        key: 'system-health',
        label: 'System Health & Metrics',
        href: '/dashboard/settings',
        icon: Activity,
      },
      {
        key: 'audit-logs',
        label: 'Platform Audit',
        href: '/dashboard/reports',
        icon: BarChart3,
      },
      {
        key: 'platform-settings',
        label: 'Platform Settings',
        href: '/dashboard/settings',
        icon: Settings,
      },
      {
        key: 'notifications',
        label: 'Notifications',
        href: '/dashboard/notifications',
        icon: Bell,
      },
    ];
  }

  // 2. OWNER Navigation
  if (role === 'OWNER') {
    return [
      {
        key: 'overview',
        label: 'Overview',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        key: 'all-tasks',
        label: 'All Tasks',
        href: '/dashboard/tasks',
        icon: CheckSquare,
      },
      {
        key: 'kanban-board',
        label: 'Kanban Board',
        href: '/dashboard/board',
        icon: KanbanSquare,
      },
      {
        key: 'branches',
        label: 'Branches',
        href: '/dashboard/branches',
        icon: Building2,
      },
      {
        key: 'teams',
        label: 'Teams',
        href: '/dashboard/teams',
        icon: Users2,
      },
      {
        key: 'employees',
        label: 'Employees & Invitations',
        href: '/dashboard/employees',
        icon: UserCircle,
      },
      {
        key: 'recurring-tasks',
        label: 'Recurring Tasks',
        href: '/dashboard/tasks/recurrence',
        icon: Repeat,
      },
      {
        key: 'reports',
        label: 'Reports & Analytics',
        href: '/dashboard/reports',
        icon: BarChart3,
      },
      {
        key: 'roles',
        label: 'Roles & Permissions',
        href: '/dashboard/roles',
        icon: ShieldCheck,
      },
      {
        key: 'company-settings',
        label: 'Company Settings',
        href: '/dashboard/settings',
        icon: Settings,
      },
      {
        key: 'notifications',
        label: 'Notifications',
        href: '/dashboard/notifications',
        icon: Bell,
      },
    ];
  }

  // 3. BRANCH_MANAGER Navigation
  if (role === 'BRANCH_MANAGER') {
    return [
      {
        key: 'dashboard',
        label: 'Branch Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        key: 'branch-tasks',
        label: 'Branch Tasks',
        href: '/dashboard/tasks',
        icon: CheckSquare,
      },
      {
        key: 'kanban-board',
        label: 'Kanban Board',
        href: '/dashboard/board',
        icon: KanbanSquare,
      },
      {
        key: 'my-tasks',
        label: 'My Tasks',
        href: '/dashboard/my-tasks',
        icon: ListTodo,
      },
      {
        key: 'teams',
        label: 'Branch Teams',
        href: '/dashboard/teams',
        icon: Users2,
      },
      {
        key: 'staff',
        label: 'Staff Members',
        href: '/dashboard/employees',
        icon: UserCircle,
      },
      {
        key: 'recurring-tasks',
        label: 'Recurring Tasks',
        href: '/dashboard/tasks/recurrence',
        icon: Repeat,
      },
      {
        key: 'reports',
        label: 'Branch Reports',
        href: '/dashboard/reports',
        icon: BarChart3,
      },
      {
        key: 'notifications',
        label: 'Notifications',
        href: '/dashboard/notifications',
        icon: Bell,
      },
    ];
  }

  // 4. TEAM_LEADER Navigation
  if (role === 'TEAM_LEADER') {
    return [
      {
        key: 'dashboard',
        label: 'Team Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        key: 'team-tasks',
        label: 'Team Tasks',
        href: '/dashboard/tasks',
        icon: CheckSquare,
      },
      {
        key: 'kanban-board',
        label: 'Kanban Board',
        href: '/dashboard/board',
        icon: KanbanSquare,
      },
      {
        key: 'my-tasks',
        label: 'My Tasks',
        href: '/dashboard/my-tasks',
        icon: ListTodo,
      },
      {
        key: 'team-members',
        label: 'Team Members',
        href: '/dashboard/teams',
        icon: Users2,
      },
      {
        key: 'recurring-tasks',
        label: 'Recurring Tasks',
        href: '/dashboard/tasks/recurrence',
        icon: Repeat,
      },
      {
        key: 'notifications',
        label: 'Notifications',
        href: '/dashboard/notifications',
        icon: Bell,
      },
    ];
  }

  // 5. EMPLOYEE Navigation
  if (role === 'EMPLOYEE') {
    return [
      {
        key: 'my-dashboard',
        label: 'My Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        key: 'my-tasks',
        label: 'My Tasks',
        href: '/dashboard/my-tasks',
        icon: ListTodo,
      },
      {
        key: 'my-submissions',
        label: 'My Submissions',
        href: '/dashboard/my-tasks?status=SUBMITTED',
        icon: CheckSquare,
      },
      {
        key: 'notifications',
        label: 'Notifications',
        href: '/dashboard/notifications',
        icon: Bell,
      },
    ];
  }

  // 6. VIEWER Navigation (Read-Only)
  if (role === 'VIEWER') {
    return [
      {
        key: 'overview',
        label: 'Auditor Overview',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        key: 'read-only-tasks',
        label: 'Read-only Tasks',
        href: '/dashboard/tasks',
        icon: CheckSquare,
      },
      {
        key: 'read-only-kanban',
        label: 'Read-only Kanban Board',
        href: '/dashboard/board',
        icon: KanbanSquare,
      },
      {
        key: 'branches',
        label: 'Branches',
        href: '/dashboard/branches',
        icon: Building2,
      },
      {
        key: 'teams',
        label: 'Teams',
        href: '/dashboard/teams',
        icon: Users2,
      },
      {
        key: 'analytics',
        label: 'Analytics & Reports',
        href: '/dashboard/reports',
        icon: BarChart3,
      },
      {
        key: 'notifications',
        label: 'Notifications',
        href: '/dashboard/notifications',
        icon: Bell,
      },
    ];
  }

  // Fallback for custom role: capability based
  return [
    {
      key: 'overview',
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    ...(hasPermission(permissions, 'tasks.view')
      ? [
          {
            key: 'tasks',
            label: 'Tasks',
            href: '/dashboard/tasks',
            icon: CheckSquare,
          },
          {
            key: 'board',
            label: 'Kanban Board',
            href: '/dashboard/board',
            icon: KanbanSquare,
          },
        ]
      : []),
    {
      key: 'notifications',
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
    },
  ];
}
