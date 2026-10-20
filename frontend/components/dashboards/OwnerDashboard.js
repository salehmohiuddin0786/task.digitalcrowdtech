'use client';

import React from 'react';
import Link from 'next/link';
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
  ShieldCheck,
  FileCheck2,
  BarChart3,
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

export default function OwnerDashboard({
  data,
  tenant,
  onOpenCreateTask,
  onRefresh,
  loading,
}) {
  const overview = data?.overview || {
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    submittedTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
  };

  const branchWorkload = data?.branchWorkload || [];
  const recentActivity = data?.recentActivity || [];
  const upcomingTasks = data?.upcomingTasks || [];
  const pendingReviews = data?.pendingReviews || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#4C2365] via-[#7F5D99] to-[#9E7EB5] text-white shadow-md">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-[#C4A4DA] inline-block mb-2">
            {tenant?.name || 'Company Workspace'}
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Executive Operations Dashboard
          </h1>
          <p className="text-xs text-white/80 mt-1 max-w-xl">
            Complete company-wide visibility across branches, workflows, approvals, and performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer disabled:opacity-50"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenCreateTask}
            className="px-4 py-2.5 rounded-2xl bg-white text-[#4C2365] hover:bg-[#FAF6FD] font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#7F5D99]" />
            Assign New Task
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Assigned Tasks"
          value={overview.totalTasks}
          subtitle={`${overview.inProgressTasks} currently in progress`}
          icon={CheckSquare}
          color="purple"
        />
        <MetricCard
          title="Tasks Completed"
          value={overview.completedTasks}
          subtitle={`${overview.completionRate}% completion rate`}
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="Overdue Tasks"
          value={overview.overdueTasks}
          subtitle="Requires supervisor follow-up"
          icon={AlertCircle}
          color="rose"
        />
        <MetricCard
          title="Pending Approval"
          value={overview.submittedTasks}
          subtitle="Waiting for supervisor review"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Main Grid: Pending Reviews, Upcoming Tasks, Branch Workloads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Cols): Pending Reviews & Upcoming Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Reviews Widget */}
          {pendingReviews.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-amber-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                    Tasks Submitted for Approval ({pendingReviews.length})
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Action Required
                </span>
              </div>

              <div className="space-y-2">
                {pendingReviews.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-[#FAF6FD]/60 border border-[#E8DFED] hover:border-[#7F5D99] transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#7F5D99]">
                          #{t.taskNumber}
                        </span>
                        <Link
                          href={`/dashboard/tasks/${t.id}`}
                          className="text-xs font-bold text-[#251A2D] hover:text-[#7F5D99] truncate block"
                        >
                          {t.title}
                        </Link>
                      </div>
                      <div className="text-[11px] text-[#6B6172] mt-0.5">
                        Submitted by:{' '}
                        <strong>
                          {t.assignments?.map((a) => a.user?.fullName).join(', ') || 'Staff'}
                        </strong>{' '}
                        • Evidence attached: {t._count?.evidence || 0}
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/tasks/${t.id}`}
                      className="px-3 py-1.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center gap-1 shrink-0"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Conduct Review
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tasks Table */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#7F5D99]" />
                <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                  Upcoming Priority Tasks
                </h3>
              </div>
              <Link
                href="/dashboard/tasks"
                className="text-xs font-bold text-[#7F5D99] hover:text-[#4C2365] flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {upcomingTasks.length === 0 ? (
                <p className="text-xs text-[#6B6172] italic py-4">No upcoming tasks scheduled.</p>
              ) : (
                upcomingTasks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/dashboard/tasks/${t.id}`}
                    className="p-3.5 rounded-2xl bg-[#FAF6FD]/60 border border-[#E8DFED] hover:border-[#7F5D99] transition-all flex items-center justify-between gap-3 block"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#7F5D99]">
                          #{t.taskNumber}
                        </span>
                        <span className="text-xs font-bold text-[#251A2D] truncate">{t.title}</span>
                      </div>
                      <div className="text-[11px] text-[#6B6172] mt-0.5 flex items-center gap-3">
                        <span>{t.branch?.name || 'Global HQ'}</span>
                        <span>
                          Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'None'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right (1 Col): Branch Workload & Recent Activity */}
        <div className="space-y-6">
          {/* Branch Distribution */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#7F5D99]" />
                <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                  Branch Workload
                </h3>
              </div>
              <Link
                href="/dashboard/branches"
                className="text-xs font-bold text-[#7F5D99] hover:underline"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {branchWorkload.length === 0 ? (
                <p className="text-xs text-[#6B6172] italic">No active branches configured.</p>
              ) : (
                branchWorkload.map((b) => (
                  <div key={b.id} className="p-3 rounded-2xl bg-[#FAF6FD] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#251A2D] truncate">{b.name}</span>
                      <span className="font-semibold text-[#7F5D99]">{b.taskCount} tasks</span>
                    </div>
                    <div className="text-[10px] text-[#6B6172]">Staff Members: {b.memberCount}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#FAF6FD] to-white border border-[#E8DFED] shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
              Management Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/dashboard/reports"
                className="p-3 rounded-2xl bg-white border border-[#E8DFED] hover:border-[#7F5D99] transition-all flex flex-col items-center gap-1.5 text-center group"
              >
                <BarChart3 className="w-5 h-5 text-[#7F5D99] group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-[#251A2D]">Reports</span>
              </Link>
              <Link
                href="/dashboard/employees"
                className="p-3 rounded-2xl bg-white border border-[#E8DFED] hover:border-[#7F5D99] transition-all flex flex-col items-center gap-1.5 text-center group"
              >
                <User className="w-5 h-5 text-[#7F5D99] group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-[#251A2D]">Staff List</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
