'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Plus,
  RefreshCw,
  Building2,
  Calendar,
  User,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import CreateTaskModal from '@/components/CreateTaskModal';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function DashboardOverviewPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [actionError, setActionError] = useState('');
  const { tenant, role } = useAuth();

  const loadData = useCallback(async () => {
    setLoading(true);
    setActionError('');
    try {
      const res = await api.getDashboardSummary();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (taskId, newStatus) => {
    setStatusUpdating(taskId);
    setActionError('');
    try {
      const res = await api.updateTaskStatus(taskId, newStatus);
      if (res.success) {
        loadData();
      }
    } catch (err) {
      setActionError(err.message || 'Status transition failed');
    } finally {
      setStatusUpdating(null);
    }
  };

  const overview = metrics?.overview || {
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    submittedTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
  };

  return (
    <div className="space-y-6">
      {/* Action Error Banner */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError('')}
            className="text-rose-500 hover:text-rose-700 underline text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#4C2365] via-[#7F5D99] to-[#9E7EB5] text-white shadow-md">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-[#C4A4DA] inline-block mb-2">
            {tenant?.name || 'Company Workspace'}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Operational Task Command Center
          </h2>
          <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
            Monitor real-time branch progress, verify evidence submissions, and coordinate business deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh dashboard"
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-white text-[#4C2365] hover:bg-[#FAF6FD] font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#7F5D99]" />
            New Task
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Total Tasks"
          value={overview.totalTasks}
          subtitle="All active tenant tasks"
          icon={CheckSquare}
          variant="primary"
        />
        <MetricCard
          title="In Progress"
          value={overview.inProgressTasks}
          subtitle={`${overview.pendingTasks} pending kickoff`}
          icon={Clock}
          variant="default"
        />
        <MetricCard
          title="Submitted for Review"
          value={overview.submittedTasks}
          subtitle="Awaiting manager sign-off"
          icon={TrendingUp}
          variant="default"
        />
        <MetricCard
          title="Overdue Tasks"
          value={overview.overdueTasks}
          subtitle="Action required immediately"
          icon={AlertCircle}
          variant={overview.overdueTasks > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFED] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#237A4B] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#6B6172] font-semibold">Overall Completion Rate</div>
            <div className="text-lg font-bold text-[#251A2D]">
              {overview.completionRate}% Done ({overview.completedTasks} Approved)
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 max-w-md w-full">
          <div className="w-full bg-[#E8DFED] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#237A4B] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, overview.completionRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Active Tasks & Branch/Activity widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming / Active Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#4C2365]">Active Task Priority Queue</h3>
                <p className="text-xs text-[#6B6172]">
                  Upcoming deliverables requiring execution and review.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#7F5D99] bg-[#FAF6FD] px-3 py-1 rounded-full border border-[#E8DFED]">
                {metrics?.upcomingTasks?.length || 0} active
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-[#6B6172]">
                Loading active task queue...
              </div>
            ) : !metrics?.upcomingTasks || metrics.upcomingTasks.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-[#237A4B] mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold text-[#251A2D]">No pending tasks in queue</p>
                <p className="text-xs text-[#6B6172] mt-1">
                  Create a task to get your team moving forward!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.upcomingTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl border border-[#E8DFED] bg-[#FAF6FD]/30 hover:border-[#9E7EB5] transition-all hover:shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PriorityBadge priority={t.priority} />
                        <StatusBadge status={t.status} />
                        {t.category && (
                          <span className="text-[11px] font-semibold text-[#6B6172] bg-white px-2 py-0.5 rounded-md border border-[#E8DFED]">
                            {t.category}
                          </span>
                        )}
                      </div>

                      {/* Due Date Indicator */}
                      {t.dueDate && (
                        <div className="flex items-center gap-1.5 text-xs text-[#6B6172]">
                          <Calendar className="w-3.5 h-3.5 text-[#9E7EB5]" />
                          <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-[#251A2D] mb-1">{t.title}</h4>
                    {t.description && (
                      <p className="text-xs text-[#6B6172] line-clamp-2 mb-3">
                        {t.description}
                      </p>
                    )}

                    {/* Metadata & Actions row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#E8DFED]/60">
                      <div className="flex items-center gap-3 text-xs text-[#6B6172]">
                        {t.branch && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-[#7F5D99]" />
                            {t.branch.name}
                          </span>
                        )}
                        {t.assignments?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-[#7F5D99]" />
                            {t.assignments.map((a) => a.user.fullName).join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Interactive Transition Buttons */}
                      <div className="flex items-center gap-1.5">
                        {t.status === 'PENDING' && (
                          <button
                            disabled={statusUpdating === t.id}
                            onClick={() => handleStatusChange(t.id, 'IN_PROGRESS')}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#7F5D99] text-white hover:bg-[#4C2365] transition-colors cursor-pointer"
                          >
                            Start Task
                          </button>
                        )}
                        {t.status === 'IN_PROGRESS' && (
                          <button
                            disabled={statusUpdating === t.id}
                            onClick={() => handleStatusChange(t.id, 'SUBMITTED')}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#9E7EB5] text-white hover:bg-[#7F5D99] transition-colors cursor-pointer"
                          >
                            Submit Proof
                          </button>
                        )}
                        {t.status === 'SUBMITTED' && role !== 'EMPLOYEE' && (
                          <button
                            disabled={statusUpdating === t.id}
                            onClick={() => handleStatusChange(t.id, 'COMPLETED')}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#237A4B] text-white hover:bg-emerald-800 transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Branch Workload & Activity Logs */}
        <div className="space-y-6">
          {/* Branch Workload */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs">
            <h3 className="text-base font-bold text-[#4C2365] mb-1">Branch Workload</h3>
            <p className="text-xs text-[#6B6172] mb-4">Task distribution across locations</p>

            <div className="space-y-3">
              {metrics?.branchWorkload?.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#E8DFED] flex items-center justify-center text-[#4C2365]">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#251A2D]">{b.name}</div>
                      <div className="text-[10px] text-[#6B6172]">{b.memberCount} staff assigned</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#7F5D99] text-white">
                    {b.taskCount} tasks
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Audit / Activity Logs */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs">
            <h3 className="text-base font-bold text-[#4C2365] mb-1">Live Activity Stream</h3>
            <p className="text-xs text-[#6B6172] mb-4">Audit log of system actions</p>

            <div className="space-y-3">
              {metrics?.recentActivity?.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#7F5D99] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[#251A2D] font-medium truncate">
                      <span className="font-bold text-[#4C2365]">{act.user?.fullName || 'System'}</span>{' '}
                      {act.action === 'CREATED' && 'created task'}
                      {act.action === 'STATUS_CHANGED' && 'updated status on'}
                      {act.action === 'COMMENTED' && 'commented on'}{' '}
                      <span className="font-semibold text-[#251A2D]">"{act.task?.title}"</span>
                    </p>
                    <span className="text-[10px] text-[#6B6172]">
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreated={() => loadData()}
      />
    </div>
  );
}
