'use client';

import React, { useState, useEffect } from 'react';
import { KanbanSquare, Plus, Clock, User, Calendar } from 'lucide-react';
import PriorityBadge from '@/components/PriorityBadge';
import CreateTaskModal from '@/components/CreateTaskModal';
import { api } from '@/lib/api';

export default function KanbanBoardPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.getTasks({ limit: 100 });
      if (res.success && res.data) {
        setTasks(res.data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const columns = [
    { key: 'PENDING', label: 'Pending Kickoff', color: 'border-t-[#9E7EB5]' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-t-[#7F5D99]' },
    { key: 'SUBMITTED', label: 'Submitted for Review', color: 'border-t-[#4C2365]' },
    { key: 'COMPLETED', label: 'Approved & Completed', color: 'border-t-[#237A4B]' },
  ];

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight">
            Kanban Board
          </h2>
          <p className="text-xs text-[#6B6172] mt-0.5">
            Visual workflow pipeline and stage-by-stage status distribution.
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

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 items-start">
        {columns.map((col) => {
          const colTasks = getTasksByStatus(col.key);
          return (
            <div
              key={col.key}
              className={`p-4 rounded-3xl bg-[#FAF6FD]/60 border border-[#E8DFED] border-t-4 ${col.color} shadow-xs min-h-[400px] flex flex-col`}
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E8DFED]">
                <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                  {col.label}
                </h3>
                <span className="px-2 py-0.5 text-xs font-bold bg-white text-[#7F5D99] rounded-full border border-[#E8DFED]">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[65vh]">
                {colTasks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#6B6172] border border-dashed border-[#E8DFED] rounded-2xl">
                    No tasks in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-2xl bg-white border border-[#E8DFED] hover:border-[#9E7EB5] shadow-2xs hover:shadow-xs transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <PriorityBadge priority={task.priority} />
                        <span className="text-[10px] font-mono text-[#7F5D99]">
                          #{task.taskNumber}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#251A2D] line-clamp-2">
                        {task.title}
                      </h4>
                      {task.branch && (
                        <div className="text-[11px] text-[#6B6172] truncate">
                          📍 {task.branch.name}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-[#E8DFED] text-[10px] text-[#6B6172]">
                        {task.dueDate ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#9E7EB5]" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span>No deadline</span>
                        )}
                        <span className="font-semibold text-[#7F5D99]">
                          {task.assignments?.[0]?.user.fullName || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreated={() => loadTasks()}
      />
    </div>
  );
}
