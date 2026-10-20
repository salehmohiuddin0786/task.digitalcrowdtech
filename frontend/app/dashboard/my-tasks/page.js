'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  PlayCircle,
  FileCheck2,
  Calendar,
  AlertCircle,
  Building2,
  ChevronRight,
  ListChecks,
} from 'lucide-react';
import PriorityBadge from '@/components/PriorityBadge';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  const loadMyTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.getMyTasks(params);
      if (res.success && res.data) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadMyTasks();
  }, [loadMyTasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      const res = await api.updateTaskStatus(taskId, newStatus);
      if (res.success) {
        await loadMyTasks();
      }
    } catch (err) {
      alert(err.message || 'Status update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const totalAssigned = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const submittedCount = tasks.filter((t) => t.status === 'SUBMITTED').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-[#7F5D99]" />
            My Assigned Tasks
          </h2>
          <p className="text-xs text-[#6B6172] mt-0.5">
            Your personal queue of action items, deadlines, checklists, and submissions.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E8DFED] shadow-xs">
          <span className="text-[11px] font-bold text-[#6B6172] uppercase tracking-wider">
            Total Assigned
          </span>
          <div className="text-2xl font-extrabold text-[#4C2365] mt-1">{totalAssigned}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E8DFED] shadow-xs">
          <span className="text-[11px] font-bold text-[#7F5D99] uppercase tracking-wider">
            In Progress
          </span>
          <div className="text-2xl font-extrabold text-[#7F5D99] mt-1">{inProgressCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E8DFED] shadow-xs">
          <span className="text-[11px] font-bold text-[#4C2365] uppercase tracking-wider">
            Under Review
          </span>
          <div className="text-2xl font-extrabold text-[#4C2365] mt-1">{submittedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E8DFED] shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Completed
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{completedCount}</div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'All My Tasks' },
          { key: 'PENDING', label: 'Pending Kickoff' },
          { key: 'IN_PROGRESS', label: 'In Progress' },
          { key: 'SUBMITTED', label: 'Submitted for Review' },
          { key: 'CHANGES_REQUESTED', label: 'Changes Requested' },
          { key: 'COMPLETED', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-[#7F5D99] text-white shadow-xs'
                : 'bg-white text-[#6B6172] hover:bg-[#FAF6FD] border border-[#E8DFED]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="rounded-3xl bg-white border border-[#E8DFED] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#6B6172]">Loading your tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#C4A4DA] mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-[#251A2D]">No tasks in this category</p>
            <p className="text-xs text-[#6B6172] mt-1">You are all caught up with your assignments!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8DFED]">
            {tasks.map((task) => {
              const completedChecklists =
                task.checklists?.filter((c) => c.isCompleted).length || 0;
              const totalChecklists = task.checklists?.length || 0;
              const isOverdue =
                task.dueDate &&
                new Date(task.dueDate) < new Date() &&
                task.status !== 'COMPLETED';

              return (
                <div
                  key={task.id}
                  className="p-4 sm:p-5 hover:bg-[#FAF6FD]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-[#7F5D99]">
                        #{task.taskNumber}
                      </span>
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                      {isOverdue && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Overdue
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/dashboard/tasks/${task.id}`}
                      className="text-sm font-bold text-[#251A2D] group-hover:text-[#7F5D99] transition-colors truncate block"
                    >
                      {task.title}
                    </Link>

                    {task.description && (
                      <p className="text-xs text-[#6B6172] line-clamp-1">{task.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-[#6B6172] pt-1 flex-wrap">
                      {task.branch && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#7F5D99]" />
                          {task.branch.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            isOverdue ? 'text-rose-600' : 'text-[#9E7EB5]'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {totalChecklists > 0 && (
                        <span className="flex items-center gap-1 text-[#7F5D99] font-medium">
                          <ListChecks className="w-3.5 h-3.5" />
                          {completedChecklists}/{totalChecklists} Checklist
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Controls */}
                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    {task.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                        disabled={updatingId === task.id}
                        className="px-3 py-1.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        Start
                      </button>
                    )}

                    {task.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'SUBMITTED')}
                        disabled={updatingId === task.id}
                        className="px-3 py-1.5 rounded-xl bg-[#4C2365] hover:bg-[#321743] text-white font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        Submit
                      </button>
                    )}

                    <Link
                      href={`/dashboard/tasks/${task.id}`}
                      className="p-2 rounded-xl bg-white hover:bg-[#FAF6FD] border border-[#E8DFED] text-[#7F5D99] transition-colors flex items-center gap-1 text-xs font-semibold"
                    >
                      Details
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
