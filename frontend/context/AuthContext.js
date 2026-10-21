'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { hasPermission, canUser } from '@/lib/permissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadSession = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('tdc_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      api.setToken(storedToken);
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data.user);
        setTenant(res.data.tenant);
        setTenants(res.data.tenants || []);
        const storedOverride = typeof window !== 'undefined' ? localStorage.getItem('tdc_override_role') : null;
        setRole(storedOverride || res.data.role);
        setPermissions(res.data.permissions || []);
        setUnreadCount(res.data.unreadNotificationCount || 0);
        if (res.data.tenant) {
          api.setTenantId(res.data.tenant.id);
        }
      }
    } catch (err) {
      console.error('Session restore failed:', err);
      api.setToken(null);
      api.setTenantId(null);
      setUser(null);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.success && res.data) {
        api.setToken(res.data.accessToken);
        if (res.data.tenant) {
          api.setTenantId(res.data.tenant.id);
        }
        setUser(res.data.user);
        setTenant(res.data.tenant);
        setTenants(res.data.tenants || []);
        setRole(res.data.role);
        setPermissions(res.data.permissions || []);
        router.push('/dashboard');
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const res = await api.register(payload);
      if (res.success && res.data) {
        api.setToken(res.data.accessToken);
        if (res.data.tenant) {
          api.setTenantId(res.data.tenant.id);
        }
        setUser(res.data.user);
        setTenant(res.data.tenant);
        setRole(res.data.role);
        router.push('/dashboard');
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore
    } finally {
      api.setToken(null);
      api.setTenantId(null);
      try {
        localStorage.removeItem('tdc_override_role');
      } catch (e) {}
      setUser(null);
      setTenant(null);
      setTenants([]);
      setRole(null);
      setPermissions([]);
      router.push('/login');
    }
  };

  const switchTenant = async (tenantId) => {
    try {
      api.setTenantId(tenantId);
      const res = await api.switchTenant(tenantId);
      if (res.success && res.data) {
        setTenant(res.data.tenant);
        setRole(res.data.role);
        setPermissions(res.data.permissions || []);
        window.location.reload();
      }
    } catch (err) {
      console.error('Tenant switch failed:', err);
    }
  };

  const quickDemoLogin = async (roleType) => {
    const creds = {
      SUPER_ADMIN: { email: 'superadmin@digitalcrowdtech.in', password: 'Password@123', role: 'SUPER_ADMIN' },
      SUPPORT_ADMIN: { email: 'superadmin@digitalcrowdtech.in', password: 'Password@123', role: 'SUPPORT_ADMIN' },
      BILLING_ADMIN: { email: 'superadmin@digitalcrowdtech.in', password: 'Password@123', role: 'BILLING_ADMIN' },
      OWNER: { email: 'admin@digitalcrowdtech.in', password: 'Password@123', role: 'OWNER' },
      COMPANY_ADMIN: { email: 'admin@digitalcrowdtech.in', password: 'Password@123', role: 'COMPANY_ADMIN' },
      BRANCH_MANAGER: { email: 'manager@digitalcrowdtech.in', password: 'Password@123', role: 'BRANCH_MANAGER' },
      TEAM_LEADER: { email: 'lead@digitalcrowdtech.in', password: 'Password@123', role: 'TEAM_LEADER' },
      EMPLOYEE: { email: 'employee@digitalcrowdtech.in', password: 'Password@123', role: 'EMPLOYEE' },
      CLIENT: { email: 'viewer@digitalcrowdtech.in', password: 'Password@123', role: 'CLIENT' },
      VIEWER: { email: 'viewer@digitalcrowdtech.in', password: 'Password@123', role: 'CLIENT' },
    };
    const target = creds[roleType] || creds.OWNER;
    const res = await login(target.email, target.password);
    if (res.success) {
      if (target.role) {
        setRole(target.role);
        try {
          localStorage.setItem('tdc_override_role', target.role);
        } catch (e) {}
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    }
    return res;
  };

  const isSuperAdmin = Boolean(user?.isPlatformAdmin && (!role || role === 'SUPER_ADMIN'));
  const isOwner = role === 'OWNER';
  const isManager = role === 'BRANCH_MANAGER';
  const isLeader = role === 'TEAM_LEADER';
  const isEmployee = role === 'EMPLOYEE';
  const isViewer = role === 'VIEWER';

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        tenants,
        role,
        permissions,
        unreadCount,
        setUnreadCount,
        loading,
        login,
        register,
        logout,
        switchTenant,
        quickDemoLogin,
        refreshSession: loadSession,
        hasPermission: (slug) => hasPermission(permissions, slug),
        can: (action) => canUser(user, role, permissions, action),
        isSuperAdmin,
        isOwner,
        isManager,
        isLeader,
        isEmployee,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
