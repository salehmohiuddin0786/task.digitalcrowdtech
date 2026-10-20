'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  Plus,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Users2,
  Unlock,
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

export default function BranchManagerDashboard({
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

  const branch = data?.branchInfo || {
    name: 'Assigned Branch',
    code: 'BR-01',
    city: 'Local',
  };

  const upcomingTasks = data?.upcomingTasks || [];
  const pendingReviews = data?.pendingReviews || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#4C2365] via-[#7F5D99] to-[#9E7EB5] text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-[#C4A4DA] inline-flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Branch Manager Operations
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-white text-[#4C2365]">
              {branch.name} {branch.code ? `(${branch.code})` : ''}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Branch Supervision & Approvals
          </h1>
          <p className="text-xs text-white/80 mt-1 max-w-xl">
            Managing tasks, review approvals, and staff execution for your operating branch.
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
            New Branch Task
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Branch Tasks"
          value={overview.totalTasks}
          subtitle={`${overview.inProgressTasks} active in branch`}
          icon={CheckSquare}
          color="purple"
        />
        <MetricCard
          title="Submitted for Review"
          value={overview.submittedTasks}
          subtitle="Awaiting your approval"
          icon={FileCheck2}
          color="amber"
        />
        <MetricCard
          title="Completed"
          value={overview.completedTasks}
          subtitle={`${overview.completionRate}% completion rate`}
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="Overdue Tasks"
          value={overview.overdueTasks}
          subtitle="Past due deadline"
          icon={AlertCircle}
          color="rose"
        />
      </div>

      {/* Main Grid: Pending Reviews and Branch Work */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Reviews & Branch Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Reviews Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#7F5D99]" />
                <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                  Submitted Tasks Awaiting Review ({pendingReviews.length})
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#6B6172]">
                Supervisor Sign-off Required
              </span>
            </div>

            <div className="space-y-2.5">
              {pendingReviews.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF6FD]/40 rounded-2xl border border-dashed border-[#E8DFED]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-[#251A2D]">All reviews caught up!</p>
                  <p className="text-[11px] text-[#6B6172] mt-0.5">
                    No submitted tasks waiting for approval in this branch.
                  </p>
                </div>
              ) : (
                pendingReviews.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 hover:border-amber-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                      <div className="text-[11px] text-[#6B6172] mt-1 flex items-center gap-2">
                        <span>
                          Assignee:{' '}
                          <strong>
                            {t.assignments?.map((a) => a.user?.fullName).join(', ') || 'Staff'}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>Proof attachments: {t._count?.evidence || 0}</span>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/tasks/${t.id}`}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#4C2365] to-[#7F5D99] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C4A4DA]" />
                      Conduct Review
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Branch Tasks */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#7F5D99]" />
                <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                  Upcoming Branch Tasks
                </h3>
              </div>
              <Link
                href="/dashboard/tasks"
                className="text-xs font-bold text-[#7F5D99] hover:underline flex items-center gap-1"
              >
                Task Explorer
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {upcomingTasks.length === 0 ? (
                <p className="text-xs text-[#6B6172] italic py-4">No active branch tasks scheduled.</p>
              ) : (
                upcomingTasks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/dashboard/tasks/${t.id}`}
                    className="p-3 rounded-2xl bg-[#FAF6FD]/60 border border-[#E8DFED] hover:border-[#7F5D99] transition-all flex items-center justify-between gap-3 block"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#7F5D99]">
                          #{t.taskNumber}
                        </span>
                        <span className="text-xs font-bold text-[#251A2D] truncate">{t.title}</span>
                      </div>
                      <div className="text-[11px] text-[#6B6172] mt-0.5">
                        Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No deadline'}
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

        {/* Right Column (1 Col): Manager Capabilities & Fast Actions */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider pb-3 border-b border-[#E8DFED]">
              Managerial Responsibilities
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#FAF6FD] space-y-1">
                <span className="font-bold text-[#4C2365] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7F5D99]" />
                  Two-Way Review Authority
                </span>
                <p className="text-[11px] text-[#6B6172]">
                  Conduct supervisor reviews on completed tasks. Approve or request adjustments with mandatory feedback.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF6FD] space-y-1">
                <span className="font-bold text-[#4C2365] flex items-center gap-1">
                  <Unlock className="w-3.5 h-3.5 text-[#7F5D99]" />
                  Dependency Overrides
                </span>
                <p className="text-[11px] text-[#6B6172]">
                  Authorized to bypass blocked prerequisite tasks when operational emergencies require parallel work.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard/reports"
                className="w-full py-2.5 px-4 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                Branch Staff Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
