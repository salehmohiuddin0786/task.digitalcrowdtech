'use client';

import React from 'react';
import Link from 'next/link';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  UploadCloud,
  FileCheck2,
  RefreshCw,
  ArrowRight,
  Camera,
  AlertTriangle,
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

export default function EmployeeDashboard({ data, user, onRefresh, loading }) {
  const overview = data?.overview || {
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    submittedTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    changesRequestedTasks: 0,
  };

  const upcomingTasks = data?.upcomingTasks || [];
  const needsReworkCount = overview.changesRequestedTasks || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#4C2365] via-[#7F5D99] to-[#9E7EB5] text-white shadow-md">
        <div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-[#C4A4DA] inline-block mb-2">
            Personal Workspace • {user?.fullName || 'Staff Member'}
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            My Daily Assigned Work
          </h1>
          <p className="text-xs text-white/80 mt-1 max-w-xl">
            Track your tasks, checklist milestones, attach proof of execution, and submit work for supervisor sign-off.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          title="Refresh task queue"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Rework Alert Banner (If supervisor requested changes) */}
      {needsReworkCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Action Required: {needsReworkCount} task(s) require adjustments
              </h4>
              <p className="text-[11px] text-amber-700">
                A supervisor requested changes or additional proof on your submission. Review the feedback and re-submit.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/my-tasks"
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            Review Feedback
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Assigned to Me"
          value={overview.totalTasks}
          subtitle="Total assigned work pool"
          icon={ListTodo}
          color="purple"
        />
        <MetricCard
          title="In Progress"
          value={overview.inProgressTasks}
          subtitle="Work currently active"
          icon={PlayCircle}
          color="indigo"
        />
        <MetricCard
          title="Under Review"
          value={overview.submittedTasks}
          subtitle="Waiting for supervisor approval"
          icon={Clock}
          color="amber"
        />
        <MetricCard
          title="Completed"
          value={overview.completedTasks}
          subtitle="Successfully approved tasks"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Active Work Queue & Quick Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Assigned Tasks List */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-[#7F5D99]" />
              <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                My Immediate Tasks ({upcomingTasks.length})
              </h3>
            </div>
            <Link
              href="/dashboard/my-tasks"
              className="text-xs font-bold text-[#7F5D99] hover:text-[#4C2365] flex items-center gap-1"
            >
              Full Board
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingTasks.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF6FD]/30 rounded-2xl border border-dashed border-[#E8DFED]">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-[#251A2D]">You're all caught up!</p>
                <p className="text-[11px] text-[#6B6172] mt-0.5">
                  No pending or in-progress tasks assigned to your queue.
                </p>
              </div>
            ) : (
              upcomingTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-[#FAF6FD]/60 border border-[#E8DFED] hover:border-[#7F5D99] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                    <div className="text-[11px] text-[#6B6172] mt-1 flex items-center gap-3 flex-wrap">
                      <span>Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'None'}</span>
                      {t.requiresProof && (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          Proof Required ({t.proofType || 'PHOTO'})
                        </span>
                      )}
                      <span>Subtasks: {t._count?.checklists || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                    <Link
                      href={`/dashboard/tasks/${t.id}`}
                      className="px-3 py-1.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs transition-colors"
                    >
                      Open Task
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Execution Steps Guide */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider pb-3 border-b border-[#E8DFED]">
              How Task Execution Works
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#FAF6FD] space-y-1">
                <span className="font-bold text-[#4C2365]">1. Start Work</span>
                <p className="text-[11px] text-[#6B6172]">
                  Click "Start Work" to move the task to <strong>In Progress</strong> and inform your supervisor.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF6FD] space-y-1">
                <span className="font-bold text-[#4C2365]">2. Complete Checklists & Proof</span>
                <p className="text-[11px] text-[#6B6172]">
                  Check off subtasks and upload photos or videos if required before submission.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF6FD] space-y-1">
                <span className="font-bold text-[#4C2365]">3. Submit for Review</span>
                <p className="text-[11px] text-[#6B6172]">
                  Once work is finished, submit for supervisor review. Once approved, it will be marked completed.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/my-tasks"
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#4C2365] to-[#7F5D99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-opacity hover:opacity-95"
            >
              Go to My Tasks Board
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
