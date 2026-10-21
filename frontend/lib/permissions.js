// Role & Capability Utilities
// TaskDigitalCrowd — Digital Crowd Technologies

export function hasPermission(userPermissions = [], requiredPermission) {
  if (!userPermissions) return false;
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(requiredPermission);
}

export function canUser(user, role, permissions = [], action) {
  if (user?.isPlatformAdmin || role === 'SUPER_ADMIN' || role === 'OWNER') {
    return true;
  }

  // Clients, Guests and Viewers are strictly read-only
  if (role === 'VIEWER' || role === 'CLIENT' || role === 'GUEST') {
    return false;
  }

  switch (action) {
    case 'tasks:create':
      return hasPermission(permissions, 'tasks.create');
    case 'tasks:edit':
      return hasPermission(permissions, 'tasks.edit');
    case 'tasks:delete':
      return hasPermission(permissions, 'tasks.delete');
    case 'tasks:assign':
      return hasPermission(permissions, 'tasks.assign');
    case 'tasks:review':
      return (
        hasPermission(permissions, 'tasks.review') &&
        ['BRANCH_MANAGER', 'TEAM_LEADER', 'COMPANY_ADMIN', 'OWNER'].includes(role)
      );
    case 'tasks:override':
      return ['BRANCH_MANAGER', 'COMPANY_ADMIN', 'OWNER'].includes(role);
    case 'branches:manage':
      return hasPermission(permissions, 'branches.manage');
    case 'teams:manage':
      return hasPermission(permissions, 'teams.manage');
    case 'members:manage':
      return hasPermission(permissions, 'members.manage');
    case 'members:invite':
      return hasPermission(permissions, 'members.invite');
    case 'reports:export':
      return hasPermission(permissions, 'reports.export');
    case 'billing:manage':
      return hasPermission(permissions, 'billing.manage') && role !== 'COMPANY_ADMIN';
    case 'settings:manage':
      return hasPermission(permissions, 'settings.manage');
    default:
      return hasPermission(permissions, action);
  }
}
