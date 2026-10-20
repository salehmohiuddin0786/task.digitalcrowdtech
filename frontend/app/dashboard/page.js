'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CreateTaskModal from '@/components/CreateTaskModal';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard';
import OwnerDashboard from '@/components/dashboards/OwnerDashboard';
import BranchManagerDashboard from '@/components/dashboards/BranchManagerDashboard';
import TeamLeaderDashboard from '@/components/dashboards/TeamLeaderDashboard';
import EmployeeDashboard from '@/components/dashboards/EmployeeDashboard';
import ViewerDashboard from '@/components/dashboards/ViewerDashboard';

export default function DashboardResolverPage() {
  const [metrics, setMetrics] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { user, tenant, role, can, loading: authLoading } = useAuth();

  const loadData = useCallback(async () => {
    setDataLoading(true);
    try {
      const res = await api.getDashboardSummary();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user, role, tenant?.id, loadData]);

  // Loading skeleton to prevent flashing another role's dashboard
  if (authLoading || (dataLoading && !metrics)) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-3xl bg-[#FAF6FD] border border-[#E8DFED]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-3xl bg-white border border-[#E8DFED]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 rounded-3xl bg-white border border-[#E8DFED]" />
          <div className="h-72 rounded-3xl bg-white border border-[#E8DFED]" />
        </div>
      </div>
    );
  }

  // Determine effective role
  const effectiveRole = user?.isPlatformAdmin && (!role || role === 'SUPER_ADMIN')
    ? 'SUPER_ADMIN'
    : role || 'EMPLOYEE';

  return (
    <>
      {effectiveRole === 'SUPER_ADMIN' && (
        <SuperAdminDashboard
          data={metrics}
          onRefresh={loadData}
          loading={dataLoading}
        />
      )}

      {effectiveRole === 'OWNER' && (
        <OwnerDashboard
          data={metrics}
          tenant={tenant}
          onOpenCreateTask={() => setIsTaskModalOpen(true)}
          onRefresh={loadData}
          loading={dataLoading}
        />
      )}

      {effectiveRole === 'BRANCH_MANAGER' && (
        <BranchManagerDashboard
          data={metrics}
          tenant={tenant}
          onOpenCreateTask={() => setIsTaskModalOpen(true)}
          onRefresh={loadData}
          loading={dataLoading}
        />
      )}

      {effectiveRole === 'TEAM_LEADER' && (
        <TeamLeaderDashboard
          data={metrics}
          tenant={tenant}
          onOpenCreateTask={() => setIsTaskModalOpen(true)}
          onRefresh={loadData}
          loading={dataLoading}
        />
      )}

      {effectiveRole === 'EMPLOYEE' && (
        <EmployeeDashboard
          data={metrics}
          user={user}
          onRefresh={loadData}
          loading={dataLoading}
        />
      )}

      {effectiveRole === 'VIEWER' && (
        <ViewerDashboard
          data={metrics}
          tenant={tenant}
          onRefresh={loadData}
          loading={dataLoading}
        />
      )}

      {/* Task Creation Modal */}
      {isTaskModalOpen && can('tasks.create') && (
        <CreateTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onTaskCreated={() => {
            setIsTaskModalOpen(false);
            loadData();
          }}
        />
      )}
    </>
  );
}
