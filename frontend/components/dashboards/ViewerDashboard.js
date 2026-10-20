'use client';

import React from 'react';
import Link from 'next/link';
import {
  Eye,
  Building2,
  CheckSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  BarChart3,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

export default function ViewerDashboard({ data, tenant, onRefresh, loading }) {
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
  const upcomingTasks = data?.upcomingTasks || [];

  return (
    <div className="space-y-6">
      {/* Top Banner with Read-Only Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#4C2365] via-[#7F5D99] to-[#9E7EB5] text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-[#C4A4DA] inline-flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Auditor / Viewer Workspace
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-white/20 text-white border border-white/20">
              Read-Only Mode
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Compliance & Operations Audit
          </h1>
          <p className="text-xs text-white/80 mt-1 max-w-xl">
            Inspecting organizational workflows, branch delivery progress, and completion audit trails.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          title="Refresh view"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Read-Only Notice Pill */}
      <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium flex items-center gap-2.5 shadow-2xs">
        <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>
          <strong>Observer Mode:</strong> You are signed in as an Auditor/Viewer. You have read-only access to inspect tasks, branches, and reports. All creation and modification actions are disabled.
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monitored Tasks"
          value={overview.totalTasks}
          subtitle={`${overview.inProgressTasks} actively running`}
          icon={CheckSquare}
          color="purple"
        />
        <MetricCard
          title="Completed Work"
          value={overview.completedTasks}
          subtitle={`${overview.completionRate}% completion rate`}
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="Under Review"
          value={overview.submittedTasks}
          subtitle="Waiting for supervisor decision"
          icon={Clock}
          color="amber"
        />
        <MetricCard
          title="Overdue Tasks"
          value={overview.overdueTasks}
          subtitle="SLA exceeded"
          icon={AlertCircle}
          color="rose"
        />
      </div>

      {/* Organization Structure & Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Tasks In Progress */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#7F5D99]" />
              <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                Observable Task Stream
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
              <p className="text-xs text-[#6B6172] italic py-4">No tasks found in tenant workspace.</p>
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

        {/* Right Column (1 Col): Branch Workloads */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#7F5D99]" />
                <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                  Branch Overview
                </h3>
              </div>
              <Link
                href="/dashboard/branches"
                className="text-xs font-bold text-[#7F5D99] hover:underline"
              >
                View
              </Link>
            </div>

            <div className="space-y-3">
              {branchWorkload.length === 0 ? (
                <p className="text-xs text-[#6B6172] italic">No active branches configured.</p>
              ) : (
                branchWorkload.map((b) => (
                  <div key={b.id} className="p-3 rounded-2xl bg-[#FAF6FD] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#251A2D] truncate">{b.name}</span>
                      <span className="font-semibold text-[#7F5D99]">{b.taskCount} tasks</span>
                    </div>
                    <div className="text-[10px] text-[#6B6172]">Staff Members: {b.memberCount}</div>
                  </div>
                ))
              )}
            </div>

            <Link
              href="/dashboard/reports"
              className="w-full mt-2 py-2 px-3 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              View Performance Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
