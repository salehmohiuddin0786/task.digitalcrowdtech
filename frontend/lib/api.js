// Centralized API Client
// Digital Crowd Technologies - TaskDigitalCrowd

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

class ApiClient {
  constructor() {
    this.token = null;
    this.tenantId = null;

    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('tdc_token');
      this.tenantId = localStorage.getItem('tdc_tenant_id');
    }
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('tdc_token', token);
      else localStorage.removeItem('tdc_token');
    }
  }

  setTenantId(tenantId) {
    this.tenantId = tenantId;
    if (typeof window !== 'undefined') {
      if (tenantId) localStorage.setItem('tdc_tenant_id', tenantId);
      else localStorage.removeItem('tdc_tenant_id');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.tenantId) {
      headers['x-tenant-id'] = this.tenantId;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If unauthenticated, emit session expired if needed
        if (response.status === 401 && typeof window !== 'undefined') {
          // Token expired or invalid
        }
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.errors = data.errors;
        throw error;
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  // Auth endpoints
  login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  register(payload) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getMe() {
    return this.request('/auth/me');
  }

  logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  switchTenant(tenantId) {
    return this.request('/auth/switch-tenant', {
      method: 'POST',
      body: JSON.stringify({ tenantId }),
    });
  }

  // Dashboard & Tasks
  getDashboardSummary(branchId) {
    const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
    return this.request(`/dashboard/summary${query}`);
  }

  getTasks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/tasks${query ? `?${query}` : ''}`);
  }

  getTaskCategories() {
    return this.request('/tasks/categories');
  }

  getMyTasks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/tasks/my-tasks${query ? `?${query}` : ''}`);
  }

  getTaskById(id) {
    return this.request(`/tasks/${id}`);
  }

  createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  updateTask(id, taskData) {
    return this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(taskData),
    });
  }

  deleteTask(id) {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  updateTaskStatus(id, status) {
    return this.request(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  assignTaskUser(id, userId) {
    return this.request(`/tasks/${id}/assignments`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  unassignTaskUser(id, userId) {
    return this.request(`/tasks/${id}/assignments/${userId}`, {
      method: 'DELETE',
    });
  }

  addChecklistItem(id, title) {
    return this.request(`/tasks/${id}/checklists`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  toggleChecklistItem(id, itemId, isCompleted) {
    return this.request(`/tasks/${id}/checklists/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isCompleted }),
    });
  }

  deleteChecklistItem(id, itemId) {
    return this.request(`/tasks/${id}/checklists/${itemId}`, {
      method: 'DELETE',
    });
  }

  addTaskComment(id, content) {
    return this.request(`/tasks/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  getTaskComments(id) {
    return this.request(`/tasks/${id}/comments`);
  }

  getTaskActivity(id) {
    return this.request(`/tasks/${id}/activity`);
  }

  // Evidence Proof & Reviews
  uploadTaskEvidence(id, dataOrFormData) {
    const isFormData = typeof FormData !== 'undefined' && dataOrFormData instanceof FormData;
    return this.request(`/tasks/${id}/evidence`, {
      method: 'POST',
      body: isFormData ? dataOrFormData : JSON.stringify(dataOrFormData),
    });
  }

  getTaskEvidence(id) {
    return this.request(`/tasks/${id}/evidence`);
  }

  deleteTaskEvidence(id, evidenceId) {
    return this.request(`/tasks/${id}/evidence/${evidenceId}`, {
      method: 'DELETE',
    });
  }

  submitTaskReview(id, data) {
    return this.request(`/tasks/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getTaskReviews(id) {
    return this.request(`/tasks/${id}/reviews`);
  }

  // Branches & Teams & Members
  getBranches() {
    return this.request('/branches');
  }

  createBranch(data) {
    return this.request('/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateBranch(id, data) {
    return this.request(`/branches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteBranch(id) {
    return this.request(`/branches/${id}`, { method: 'DELETE' });
  }

  getTeams() {
    return this.request('/teams');
  }

  createTeam(data) {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateTeam(id, data) {
    return this.request(`/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteTeam(id) {
    return this.request(`/teams/${id}`, { method: 'DELETE' });
  }

  assignTeamMember(teamId, data) {
    return this.request(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  removeTeamMember(teamId, memberId) {
    return this.request(`/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  getMembers() {
    return this.request('/members');
  }

  updateMember(memberId, data) {
    return this.request(`/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteMember(memberId) {
    return this.request(`/members/${memberId}`, { method: 'DELETE' });
  }

  // Roles & Permissions
  getRoles() {
    return this.request('/roles');
  }

  getAllPermissions() {
    return this.request('/roles/permissions/all');
  }

  getRolePermissions(roleId) {
    return this.request(`/roles/${roleId}/permissions`);
  }

  updateRolePermissions(roleId, permissionSlugs) {
    return this.request(`/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissionSlugs }),
    });
  }

  // Invitations
  getInvitations() {
    return this.request('/invitations');
  }

  createInvitation(data) {
    return this.request('/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  revokeInvitation(id) {
    return this.request(`/invitations/${id}`, { method: 'DELETE' });
  }

  verifyInvitation(token) {
    return this.request(`/invitations/verify/${token}`);
  }

  acceptInvitation(data) {
    return this.request('/invitations/accept', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Tenant Settings & Sessions
  getTenantCurrent() {
    return this.request('/tenants/current');
  }

  getTenantUsage() {
    return this.request('/tenants/usage');
  }

  updateTenantCurrent(data) {
    return this.request('/tenants/current', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  getSessions() {
    return this.request('/auth/sessions');
  }

  revokeSession(sessionId) {
    return this.request(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
  }

  updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  changePassword(data) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Notifications
  getNotifications() {
    return this.request('/notifications');
  }

  markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  markAllNotificationsRead() {
    return this.request('/notifications/mark-all-read', { method: 'POST' });
  }

  deleteNotification(id) {
    return this.request(`/notifications/${id}`, { method: 'DELETE' });
  }

  // Recurrence & Scheduled Tasks
  getRecurrenceRules() {
    return this.request('/tasks/recurrence');
  }

  createRecurrenceRule(data) {
    return this.request('/tasks/recurrence', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateRecurrenceRule(id, data) {
    return this.request(`/tasks/recurrence/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteRecurrenceRule(id) {
    return this.request(`/tasks/recurrence/${id}`, { method: 'DELETE' });
  }

  generateRecurringTasks(forceAll = false) {
    return this.request('/tasks/recurrence/generate', {
      method: 'POST',
      body: JSON.stringify({ forceAll }),
    });
  }

  // Dependencies
  addTaskDependency(id, prerequisiteTaskId) {
    return this.request(`/tasks/${id}/dependencies`, {
      method: 'POST',
      body: JSON.stringify({ prerequisiteTaskId }),
    });
  }

  removeTaskDependency(id, prereqId) {
    return this.request(`/tasks/${id}/dependencies/${prereqId}`, {
      method: 'DELETE',
    });
  }

  overrideTaskDependency(id, prereqId, overrideReason) {
    return this.request(`/tasks/${id}/dependencies/${prereqId}/override`, {
      method: 'POST',
      body: JSON.stringify({ overrideReason }),
    });
  }

  // Subscription Plans
  getPlans() {
    return this.request('/tenants/plans');
  }

  createPlan(data) {
    return this.request('/tenants/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updatePlan(id, data) {
    return this.request(`/tenants/plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Reports & Analytics
  getOverviewReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/overview${query ? `?${query}` : ''}`);
  }

  getEmployeeLeaderboard(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/employees${query ? `?${query}` : ''}`);
  }

  async exportReportsCSV() {
    const url = `${API_BASE_URL}/reports/export`;
    const headers = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (this.tenantId) headers['x-tenant-id'] = this.tenantId;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to download CSV report');
    return res.text();
  }
}

export const api = new ApiClient();
