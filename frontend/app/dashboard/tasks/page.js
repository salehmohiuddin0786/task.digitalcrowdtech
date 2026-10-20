'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Search, Filter, Plus, Calendar, Building2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import CreateTaskModal from '@/components/CreateTaskModal';
import { api } from '@/lib/api';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;

      const res = await api.getTasks(params);
      if (res.success && res.data) {
        setTasks(res.data.tasks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight">
            Task Explorer
          </h2>
          <p className="text-xs text-[#6B6172] mt-0.5">
            Filter, inspect, and track assignments across all organizational units.
          </p>
        </div>
        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8DFED] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#6B6172] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title, description, or category..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:outline-hidden"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tasks Table / Card List */}
      <div className="rounded-3xl bg-white border border-[#E8DFED] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#6B6172]">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare className="w-10 h-10 text-[#C4A4DA] mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-[#251A2D]">No tasks found</p>
            <p className="text-xs text-[#6B6172] mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8DFED]">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 sm:p-5 hover:bg-[#FAF6FD]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-[#7F5D99]">
                      #{task.taskNumber}
                    </span>
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                    {task.category && (
                      <span className="text-[11px] font-semibold text-[#6B6172] bg-[#FAF6FD] px-2 py-0.5 rounded border border-[#E8DFED]">
                        {task.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#251A2D] truncate">{task.title}</h3>
                  {task.description && (
                    <p className="text-xs text-[#6B6172] line-clamp-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-[#6B6172] pt-1">
                    {task.branch && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#7F5D99]" />
                        {task.branch.name}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#9E7EB5]" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center shrink-0">
                  {task.assignments?.map((a) => (
                    <div
                      key={a.user.id}
                      title={a.user.fullName}
                      className="w-7 h-7 rounded-full bg-[#7F5D99] text-white font-bold text-[11px] flex items-center justify-center border border-white shadow-2xs"
                    >
                      {a.user.fullName.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreated={() => loadTasks()}
      />
    </div>
  );
}
