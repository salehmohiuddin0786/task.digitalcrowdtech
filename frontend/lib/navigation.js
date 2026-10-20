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
} from 'lucide-react';
import { hasPermission } from './permissions';

export const NAVIGATION_ITEMS = [
  {
    key: 'overview',
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    isAvailable: () => true,
  },
  {
    key: 'my-tasks',
    label: 'My Tasks',
    href: '/dashboard/my-tasks',
    icon: ListTodo,
    isAvailable: (user, role) => ['EMPLOYEE', 'TEAM_LEADER', 'BRANCH_MANAGER', 'OWNER'].includes(role),
  },
  {
    key: 'tasks',
    label: 'Task Explorer',
    href: '/dashboard/tasks',
    icon: CheckSquare,
    permission: 'tasks.view',
  },
  {
    key: 'board',
    label: 'Kanban Board',
    href: '/dashboard/board',
    icon: KanbanSquare,
    permission: 'tasks.view',
  },
  {
    key: 'branches',
    label: 'Branches',
    href: '/dashboard/branches',
    icon: Building2,
    permission: 'branches.view',
  },
  {
    key: 'teams',
    label: 'Teams',
    href: '/dashboard/teams',
    icon: Users2,
    permission: 'teams.view',
  },
  {
    key: 'employees',
    label: 'Employees',
    href: '/dashboard/employees',
    icon: UserCircle,
    permission: 'members.view',
  },
  {
    key: 'roles',
    label: 'Roles & RBAC',
    href: '/dashboard/roles',
    icon: ShieldCheck,
    permission: 'settings.manage',
    roles: ['OWNER', 'SUPER_ADMIN'],
  },
  {
    key: 'reports',
    label: 'Reports & Analytics',
    href: '/dashboard/reports',
    icon: BarChart3,
    permission: 'reports.view',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
    isAvailable: () => true,
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    permission: 'settings.manage',
    roles: ['OWNER', 'SUPER_ADMIN'],
  },
];

export function getAuthorizedNavigation(user, role, permissions = []) {
  if (!role && !user) return [];

  return NAVIGATION_ITEMS.filter((item) => {
    // 1. Check custom availability callback
    if (typeof item.isAvailable === 'function') {
      if (!item.isAvailable(user, role, permissions)) {
        return false;
      }
    }

    // 2. Check role restriction
    if (item.roles && !item.roles.includes(role) && !user?.isPlatformAdmin) {
      return false;
    }

    // 3. Check permission requirement
    if (item.permission) {
      if (role === 'OWNER' || role === 'SUPER_ADMIN' || user?.isPlatformAdmin) {
        return true;
      }
      if (!hasPermission(permissions, item.permission)) {
        return false;
      }
    }

    return true;
  });
}
