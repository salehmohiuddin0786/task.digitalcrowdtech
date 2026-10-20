'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users2,
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  RefreshCw,
  ArrowRight,
  ListChecks,
  MessageSquare,
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

export default function TeamLeaderDashboard({
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

  const teams = data?.teamInfo || [];
  const upcomingTasks = data?.upcomingTasks || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#4C2365] via-[#7F5D99] to-[#9E7EB5] text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-[#C4A4DA] inline-flex items-center gap-1.5">
              <Users2 className="w-3.5 h-3.5" />
              Team Coordination
            </span>
            {teams.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-white text-[#4C2365]">
                {teams.map((t) => t.name).join(', ')}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Team Workflow & Checklist Progress
          </h1>
          <p className="text-xs text-white/80 mt-1 max-w-xl">
            Coordinate departmental execution, assign subtasks, monitor checklists, and track upcoming deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer disabled:opacity-50"
            title="Refresh team metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenCreateTask}
            className="px-4 py-2.5 rounded-2xl bg-white text-[#4C2365] hover:bg-[#FAF6FD] font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#7F5D99]" />
            New Team Task
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Team Tasks Pool"
          value={overview.totalTasks}
          subtitle={`${overview.inProgressTasks} active in progress`}
          icon={CheckSquare}
          color="purple"
        />
        <MetricCard
          title="Awaiting Review"
          value={overview.submittedTasks}
          subtitle="Submitted by team members"
          icon={Clock}
          color="amber"
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
          subtitle="Past target deadline"
          icon={AlertCircle}
          color="rose"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Team Tasks */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#7F5D99]" />
              <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                Active Team Tasks & Checklists
              </h3>
            </div>
            <Link
              href="/dashboard/board"
              className="text-xs font-bold text-[#7F5D99] hover:underline flex items-center gap-1"
            >
              Open Kanban
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-[#6B6172] italic py-4">No team tasks scheduled.</p>
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
                    <div className="text-[11px] text-[#6B6172] mt-1 flex items-center gap-3">
                      <span>
                        Assignees:{' '}
                        <strong>
                          {t.assignments?.map((a) => a.user?.fullName).join(', ') || 'Unassigned'}
                        </strong>
                      </span>
                      <span>Subtasks: {t._count?.checklists || 0}</span>
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

        {/* Right Column (1 Col): Team Guidance */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider pb-3 border-b border-[#E8DFED]">
              Team Leader Checklist
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#FAF6FD] space-y-1">
                <span className="font-bold text-[#4C2365] flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-[#7F5D99]" />
                  Milestone Checklists
                </span>
                <p className="text-[11px] text-[#6B6172]">
                  Break larger tasks into manageable subtasks so staff can check off progress step by step.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF6FD] space-y-1">
                <span className="font-bold text-[#4C2365] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#7F5D99]" />
                  Task Discussions
                </span>
                <p className="text-[11px] text-[#6B6172]">
                  Keep questions and instructions on the task's collaborative comments thread.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/teams"
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#FAF6FD] hover:bg-[#F2EDF7] border border-[#E8DFED] text-xs font-bold text-[#7F5D99] flex items-center justify-center gap-1.5 transition-colors"
            >
              View Team Members
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
