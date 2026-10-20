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
    const headers = {
      'Content-Type': 'application/json',
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

  getTaskById(id) {
    return this.request(`/tasks/${id}`);
  }

  createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  updateTaskStatus(id, status) {
    return this.request(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Branches & Teams & Members
  getBranches() {
    return this.request('/branches');
  }

  getTeams() {
    return this.request('/teams');
  }

  getMembers() {
    return this.request('/members');
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
}

export const api = new ApiClient();
