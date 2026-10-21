// Centralized Role & Permission Navigation Configuration
// TaskDigitalCrowd — Digital Crowd Technologies SaaS

import {
  LayoutDashboard,
  Building2,
  Users2,
  UserCircle,
  ShieldCheck,
  Package,
  Wallet,
  LifeBuoy,
  BarChart3,
  History,
  Bell,
  Settings,
  Sliders,
  UserCheck,
  FolderGit2,
  CheckSquare,
  MailPlus,
  Calendar,
  Clock,
  CreditCard,
  HelpCircle,
  MessagesSquare,
  Paperclip,
  Share2,
  CheckCheck,
  KanbanSquare,
  MessageSquare,
  BookOpen,
  Send,
  Receipt,
  Tag,
  TrendingUp,
  FileText,
  UserPlus,
  Lock,
} from 'lucide-react';
import { hasPermission } from './permissions.js';

export const ROLE_DISPLAY_LABELS = {
  SUPER_ADMIN: 'Platform Superadmin',
  SUPPORT_ADMIN: 'Support Admin',
  BILLING_ADMIN: 'Billing Admin',
  OWNER: 'Company Owner',
  COMPANY_OWNER: 'Company Owner',
  COMPANY_ADMIN: 'Company Admin',
  ADMIN: 'Company Admin',
  BRANCH_MANAGER: 'Manager',
  MANAGER: 'Manager',
  TEAM_LEADER: 'Team Lead',
  TEAM_LEAD: 'Team Lead',
  EMPLOYEE: 'Employee / Team Member',
  MEMBER: 'Employee / Team Member',
  CLIENT: 'Client / Guest',
  GUEST: 'Client / Guest',
  VIEWER: 'Client / Guest',
  HR_ADMIN: 'HR Admin (Optional)',
  PROJECT_VIEWER: 'Project Viewer (Optional)',
  AUDITOR: 'Auditor (Optional)',
  FINANCE_VIEWER: 'Finance Viewer (Optional)',
};

/**
 * Navigation Specification defined per role hierarchy
 */
export const NAVIGATION_CONFIG = {
  // 1. Superadmin (Platform Level)
  // Restriction: Do not display "All Projects" or "All Tasks" in the primary Superadmin sidebar.
  superadmin: [
    {
      key: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      key: 'organizations',
      label: 'Organizations',
      href: '/dashboard?tab=tenants',
      icon: Building2,
      permission: 'organizations.view',
    },
    {
      key: 'all-users',
      label: 'All Users',
      href: '/dashboard/employees?tab=all-users',
      icon: Users2,
      permission: 'platform.users.view',
    },
    {
      key: 'roles-permissions',
      label: 'Roles & Permissions',
      href: '/dashboard/roles',
      icon: ShieldCheck,
      permission: 'roles.view',
    },
    {
      key: 'subscription-plans',
      label: 'Subscription Plans',
      href: '/dashboard/settings?tab=plans',
      icon: Package,
      permission: 'billing.manage',
    },
    {
      key: 'billing-payments',
      label: 'Billing & Payments',
      href: '/dashboard/settings?tab=billing',
      icon: Wallet,
      permission: 'billing.manage',
    },
    {
      key: 'support-tickets',
      label: 'Support Tickets',
      href: '/dashboard/settings?tab=support',
      icon: LifeBuoy,
      permission: 'support.view',
    },
    {
      key: 'analytics-reports',
      label: 'Analytics & Reports',
      href: '/dashboard/reports',
      icon: BarChart3,
      permission: 'reports.view',
    },
    {
      key: 'audit-logs',
      label: 'Audit Logs',
      href: '/dashboard/reports?tab=audit',
      icon: History,
      permission: 'audit.view',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      hasBadge: true,
    },
    {
      key: 'platform-settings',
      label: 'Platform Settings',
      href: '/dashboard/settings?tab=platform',
      icon: Sliders,
      permission: 'settings.manage',
    },
    {
      key: 'my-profile',
      label: 'My Profile',
      href: '/dashboard/settings?tab=profile',
      icon: UserCheck,
    },
  ],

  // 2. Company Owner (Organization Level)
  owner: [
    {
      key: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      key: 'projects',
      label: 'Projects',
      href: '/dashboard/branches',
      icon: FolderGit2,
      permission: 'branches.view',
    },
    {
      key: 'branch-supervision',
      label: 'Branch Supervision & Approvals',
      href: '/dashboard/branches?tab=supervision',
      icon: ShieldCheck,
      permission: 'branches.manage',
    },
    {
      key: 'all-tasks',
      label: 'All Tasks',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      permission: 'tasks.view',
    },
    {
      key: 'team-employees',
      label: 'Team & Employees',
      href: '/dashboard/employees',
      icon: Users2,
      permission: 'members.view',
    },
    {
      key: 'invitations',
      label: 'Invitations',
      href: '/dashboard/employees?tab=invitations',
      icon: MailPlus,
      permission: 'members.invite',
    },
    {
      key: 'calendar',
      label: 'Calendar',
      href: '/dashboard/tasks/recurrence',
      icon: Calendar,
      permission: 'tasks.view',
    },
    {
      key: 'reports-analytics',
      label: 'Reports & Analytics',
      href: '/dashboard/reports',
      icon: BarChart3,
      permission: 'reports.view',
    },
    {
      key: 'time-tracking',
      label: 'Time Tracking',
      href: '/dashboard/tasks?tab=timetracking',
      icon: Clock,
      permission: 'tasks.view',
    },
    {
      key: 'subscription-billing',
      label: 'Subscription & Billing',
      href: '/dashboard/settings?tab=billing',
      icon: CreditCard,
      permission: 'billing.manage',
    },
    {
      key: 'roles-permissions',
      label: 'Roles & Permissions',
      href: '/dashboard/roles',
      icon: ShieldCheck,
      permission: 'settings.manage',
    },
    {
      key: 'company-settings',
      label: 'Company Settings',
      href: '/dashboard/settings',
      icon: Settings,
      permission: 'settings.manage',
      exact: true,
    },
    {
      key: 'notifications',
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      hasBadge: true,
    },
    {
      key: 'help-support',
      label: 'Help & Support',
      href: '/dashboard/settings?tab=help',
      icon: HelpCircle,
    },
    {
      key: 'my-profile',
      label: 'My Profile',
      href: '/dashboard/settings?tab=profile',
      icon: UserCheck,
    },
  ],

  // 3. Company Admin (Organization Level)
  company_admin: [
    {
      key: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      key: 'projects',
      label: 'Projects',
      href: '/dashboard/branches',
      icon: FolderGit2,
      permission: 'branches.view',
    },
    {
      key: 'branch-supervision',
      label: 'Branch Supervision & Approvals',
      href: '/dashboard/branches?tab=supervision',
      icon: ShieldCheck,
      permission: 'branches.manage',
    },
    {
      key: 'tasks',
      label: 'Tasks',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      permission: 'tasks.view',
    },
    {
      key: 'team-management',
      label: 'Team Management',
      href: '/dashboard/teams',
      icon: Users2,
      permission: 'teams.view',
    },
    {
      key: 'invitations',
      label: 'Invitations',
      href: '/dashboard/employees?tab=invitations',
      icon: MailPlus,
      permission: 'members.invite',
    },
    {
      key: 'calendar',
      label: 'Calendar',
      href: '/dashboard/tasks/recurrence',
      icon: Calendar,
      permission: 'tasks.view',
    },
    {
      key: 'time-tracking',
      label: 'Time Tracking',
      href: '/dashboard/tasks?tab=timetracking',
      icon: Clock,
      permission: 'tasks.view',
    },
    {
      key: 'reports',
      label: 'Reports',
      href: '/dashboard/reports',
      icon: BarChart3,
      permission: 'reports.view',
    },
    {
      key: 'comments-discussions',
      label: 'Comments & Discussions',
      href: '/dashboard/board',
      icon: MessagesSquare,
      permission: 'tasks.view',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      hasBadge: true,
    },
    {
      key: 'workspace-settings',
      label: 'Workspace Settings',
      href: '/dashboard/settings',
      icon: Settings,
      permission: 'settings.manage',
      exact: true,
    },
    {
      key: 'help-support',
      label: 'Help & Support',
      href: '/dashboard/settings?tab=help',
      icon: HelpCircle,
    },
    {
      key: 'my-profile',
      label: 'My Profile',
      href: '/dashboard/settings?tab=profile',
      icon: UserCheck,
    },
  ],

  // 4. Manager (Organization Level)
  manager: [
    {
      key: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      key: 'my-projects',
      label: 'My Projects',
      href: '/dashboard/branches',
      icon: FolderGit2,
      permission: 'branches.view',
    },
    {
      key: 'tasks-assignments',
      label: 'Tasks & Assignments',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      permission: 'tasks.view',
    },
    {
      key: 'my-team',
      label: 'My Team',
      href: '/dashboard/teams',
      icon: Users2,
      permission: 'teams.view',
    },
    {
      key: 'calendar-deadlines',
      label: 'Calendar & Deadlines',
      href: '/dashboard/tasks/recurrence',
      icon: Calendar,
      permission: 'tasks.view',
    },
    {
      key: 'team-performance',
      label: 'Team Performance',
      href: '/dashboard/reports',
      icon: BarChart3,
      permission: 'reports.view',
    },
    {
      key: 'time-tracking',
      label: 'Time Tracking',
      href: '/dashboard/tasks?tab=timetracking',
      icon: Clock,
      permission: 'tasks.view',
    },
    {
      key: 'discussions',
      label: 'Discussions',
      href: '/dashboard/board',
      icon: MessagesSquare,
      permission: 'tasks.view',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      hasBadge: true,
    },
    {
      key: 'my-profile',
      label: 'My Profile',
      href: '/dashboard/settings?tab=profile',
      icon: UserCheck,
    },
  ],

  // 5. Team Lead (Organization Level)
  team_leader: [
    {
      key: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      key: 'team-tasks',
      label: 'Team Tasks',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      permission: 'tasks.view',
    },
    {
      key: 'assigned-projects',
      label: 'Assigned Projects',
      href: '/dashboard/branches',
      icon: FolderGit2,
      permission: 'branches.view',
    },
    {
      key: 'team-members',
      label: 'Team Members',
      href: '/dashboard/teams',
      icon: Users2,
      permission: 'teams.view',
    },
    {
      key: 'team-calendar',
      label: 'Team Calendar',
      href: '/dashboard/tasks/recurrence',
      icon: Calendar,
      permission: 'tasks.view',
    },
    {
      key: 'time-tracking',
      label: 'Time Tracking',
      href: '/dashboard/tasks?tab=timetracking',
      icon: Clock,
      permission: 'tasks.view',
    },
    {
      key: 'task-progress',
      label: 'Task Progress',
      href: '/dashboard/board',
      icon: KanbanSquare,
      permission: 'tasks.view',
    },
    {
      key: 'discussions',
      label: 'Discussions',
      href: '/dashboard/board?tab=discussions',
      icon: MessagesSquare,
      permission: 'tasks.view',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      hasBadge: true,
    },
    {
      key: 'my-profile',
      label: 'My Profile',
      href: '/dashboard/settings?tab=profile',
      icon: UserCheck,
    },
  ],

  // 6. Employee / Team Member (Organization Level)
  employee: [
    {
      key: 'my-dashboard',
      label: 'My Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      key: 'my-tasks',
      label: 'My Tasks',
      href: '/dashboard/my-tasks',
      icon: CheckSquare,
      permission: 'tasks.view',
    },
    {
      key: 'my-projects',
      label: 'My Projects',
      href: '/dashboard/branches',
      icon: FolderGit2,
      permission: 'branches.view',
    },
    {
      key: 'my-calendar',
      label: 'My Calendar',
      href: '/dashboard/tasks/recurrence',
      icon: Calendar,
      permission: 'tasks.view',
    },
    {
      key: 'my-time-tracking',
      label: 'My Time Tracking',
      href: '/dashboard/tasks?tab=timetracking',
      icon: Clock,
      permission: 'tasks.view',
    },
    {
      key: 'comments-discussions',
      label: 'Comments & Discussions',
      href: '/dashboard/board',
      icon: MessagesSquare,
      permission: 'tasks.view',
    },
    {
      key: 'my-files-attachments',
      label: 'My Files & Attachments',
      href: '/dashboard/tasks?tab=evidence',
      icon: Paperclip,
      permission: 'tasks.view',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      hasBadge: true,
    },
    {
      key: 'my-profile',
      label: 'My Profile',
      href: '/dashboard/settings?tab=profile',
      icon: UserCheck,
    },
  ],

  // 7. Client / Guest / Viewer (Organization Level)
  client: [
    {
      key: 'overview',
      label: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      key: 'shared-projects',
      label: 'Shared Projects',
      href: '/dashboard/branches',
      icon: Share2,
      permission: 'branches.view',
    },
    {
      key: 'shared-tasks',
      label: 'Shared Tasks',
      href: '/dashboard/tasks',
      icon: CheckCheck,
      permission: 'tasks.view',
    },
    {
      key: 'project-timeline',
      label: 'Project Timeline',
      href: '/dashboard/board',
      icon: KanbanSquare,
      permission: 'tasks.view',
    },
    {
      key: 'shared-files',
      label: 'Shared Files',
      href: '/dashboard/tasks?tab=evidence',
      icon: Paperclip,
      permission: 'tasks.view',
    },
    {
      key: 'comments-feedback',
      label: 'Comments & Feedback',
      href: '/dashboard/board?tab=feedback',
      icon: MessageSquare,
      permission: 'tasks.view',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      hasBadge: true,
    },
    {
      key: 'my-profile',
      label: 'My Profile',
      href: '/dashboard/settings?tab=profile',
      icon: UserCheck,
    },
  ],

  // 8. Support Admin (Platform Level)
  support_admin: [
    {
      key: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      key: 'support-tickets',
      label: 'Support Tickets',
      href: '/dashboard/settings?tab=support',
      icon: LifeBuoy,
      permission: 'support.view',
    },
    {
      key: 'organization-lookup',
      label: 'Organization Lookup',
      href: '/dashboard?tab=tenants',
      icon: Building2,
      permission: 'organizations.view',
    },
    {
      key: 'user-lookup',
      label: 'User Lookup',
      href: '/dashboard/employees?tab=all-users',
      icon: Users2,
      permission: 'platform.users.view',
    },
    {
      key: 'knowledge-base',
      label: 'Knowledge Base',
      href: '/dashboard/settings?tab=knowledge-base',
      icon: BookOpen,
    },
    {
      key: 'customer-communications',
      label: 'Customer Communications',
      href: '/dashboard/notifications?tab=communications',
      icon: Send,
    },
    {
      key: 'support-activity-logs',
      label: 'Support Activity Logs',
      href: '/dashboard/reports?tab=audit',
      icon: History,
      permission: 'reports.view',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      hasBadge: true,
    },
    {
      key: 'my-profile',
      label: 'My Profile',
      href: '/dashboard/settings?tab=profile',
      icon: UserCheck,
    },
  ],

  // 9. Billing Admin (Platform Level)
  billing_admin: [
    {
      key: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      key: 'subscription-plans',
      label: 'Subscription Plans',
      href: '/dashboard/settings?tab=plans',
      icon: Package,
      permission: 'billing.manage',
    },
    {
      key: 'org-subscriptions',
      label: 'Organization Subscriptions',
      href: '/dashboard?tab=tenants',
      icon: Building2,
      permission: 'billing.manage',
    },
    {
      key: 'invoices',
      label: 'Invoices',
      href: '/dashboard/settings?tab=invoices',
      icon: Receipt,
      permission: 'billing.manage',
    },
    {
      key: 'payments-transactions',
      label: 'Payments & Transactions',
      href: '/dashboard/settings?tab=billing',
      icon: Wallet,
      permission: 'billing.manage',
    },
    {
      key: 'coupons-discounts',
      label: 'Coupons & Discounts',
      href: '/dashboard/settings?tab=coupons',
      icon: Tag,
      permission: 'billing.manage',
    },
    {
      key: 'revenue-reports',
      label: 'Revenue Reports',
      href: '/dashboard/reports',
      icon: TrendingUp,
      permission: 'reports.view',
    },
    {
      key: 'billing-audit-logs',
      label: 'Billing Audit Logs',
      href: '/dashboard/reports?tab=audit',
      icon: History,
      permission: 'billing.manage',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      hasBadge: true,
    },
    {
      key: 'my-profile',
      label: 'My Profile',
      href: '/dashboard/settings?tab=profile',
      icon: UserCheck,
    },
  ],

  // 10. Optional Future Roles (Kept disabled until modules are active)
  hr_admin: [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { key: 'employees', label: 'Employees', href: '/dashboard/employees', icon: Users2 },
    { key: 'attendance', label: 'Attendance', href: '/dashboard/employees?tab=attendance', icon: Clock },
    { key: 'leave-requests', label: 'Leave Requests', href: '/dashboard/employees?tab=leaves', icon: Calendar },
    { key: 'team-directory', label: 'Team Directory', href: '/dashboard/teams', icon: Building2 },
    { key: 'hr-reports', label: 'HR Reports', href: '/dashboard/reports', icon: BarChart3 },
    { key: 'notifications', label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { key: 'my-profile', label: 'My Profile', href: '/dashboard/settings?tab=profile', icon: UserCheck },
  ],
  project_viewer: [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { key: 'shared-projects', label: 'Shared Projects', href: '/dashboard/branches', icon: FolderGit2 },
    { key: 'project-timeline', label: 'Project Timeline', href: '/dashboard/board', icon: KanbanSquare },
    { key: 'milestones', label: 'Milestones', href: '/dashboard/tasks', icon: CheckSquare },
    { key: 'authorized-reports', label: 'Authorized Reports', href: '/dashboard/reports', icon: BarChart3 },
    { key: 'notifications', label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { key: 'my-profile', label: 'My Profile', href: '/dashboard/settings?tab=profile', icon: UserCheck },
  ],
  auditor: [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { key: 'audit-logs', label: 'Audit Logs', href: '/dashboard/reports?tab=audit', icon: History },
    { key: 'activity-reports', label: 'Activity Reports', href: '/dashboard/reports', icon: BarChart3 },
    { key: 'access-reviews', label: 'Access Reviews', href: '/dashboard/roles', icon: ShieldCheck },
    { key: 'compliance-reports', label: 'Compliance Reports', href: '/dashboard/reports?tab=compliance', icon: FileText },
    { key: 'notifications', label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { key: 'my-profile', label: 'My Profile', href: '/dashboard/settings?tab=profile', icon: UserCheck },
  ],
  finance_viewer: [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { key: 'invoices', label: 'Invoices', href: '/dashboard/settings?tab=invoices', icon: Receipt },
    { key: 'payment-history', label: 'Payment History', href: '/dashboard/settings?tab=billing', icon: Wallet },
    { key: 'subscription-reports', label: 'Subscription Reports', href: '/dashboard/reports?tab=subscriptions', icon: Package },
    { key: 'revenue-reports', label: 'Revenue Reports', href: '/dashboard/reports', icon: TrendingUp },
    { key: 'notifications', label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { key: 'my-profile', label: 'My Profile', href: '/dashboard/settings?tab=profile', icon: UserCheck },
  ],
};

/**
 * Maps raw role strings to config keys
 */
export function resolveRoleConfigKey(user, role) {
  if (user?.isPlatformAdmin) {
    if (role === 'SUPPORT_ADMIN') return 'support_admin';
    if (role === 'BILLING_ADMIN') return 'billing_admin';
    return 'superadmin';
  }

  const normalized = (role || '').toUpperCase().trim();

  switch (normalized) {
    case 'SUPER_ADMIN':
      return 'superadmin';
    case 'SUPPORT_ADMIN':
      return 'support_admin';
    case 'BILLING_ADMIN':
      return 'billing_admin';
    case 'OWNER':
    case 'COMPANY_OWNER':
      return 'owner';
    case 'COMPANY_ADMIN':
    case 'ADMIN':
      return 'company_admin';
    case 'BRANCH_MANAGER':
    case 'MANAGER':
      return 'manager';
    case 'TEAM_LEADER':
    case 'TEAM_LEAD':
      return 'team_leader';
    case 'EMPLOYEE':
    case 'MEMBER':
      return 'employee';
    case 'CLIENT':
    case 'GUEST':
    case 'VIEWER':
      return 'client';
    case 'HR_ADMIN':
      return 'hr_admin';
    case 'PROJECT_VIEWER':
      return 'project_viewer';
    case 'AUDITOR':
      return 'auditor';
    case 'FINANCE_VIEWER':
      return 'finance_viewer';
    default:
      return 'employee';
  }
}

/**
 * Filter and return authorized navigation items
 */
export function getAuthorizedNavigation(user, role, permissions = [], tenant = null) {
  if (!user && !role) return [];

  const roleKey = resolveRoleConfigKey(user, role);
  const items = NAVIGATION_CONFIG[roleKey] || NAVIGATION_CONFIG.employee;

  // Platform admin and owner have full privileges within their scope
  const isSuperAdmin = Boolean(user?.isPlatformAdmin && roleKey === 'superadmin');
  const isOwner = roleKey === 'owner';

  return items.filter((item) => {
    // If future optional role marked disabled
    if (item.disabled) return false;

    // Check permission if specified
    if (item.permission) {
      if (isSuperAdmin || isOwner) {
        return true;
      }
      return hasPermission(permissions, item.permission);
    }

    return true;
  });
}
