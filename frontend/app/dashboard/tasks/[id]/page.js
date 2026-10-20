'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Building2,
  Users2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  Send,
  MessageSquare,
  ShieldCheck,
  Plus,
  Trash2,
  UserPlus,
  FileCheck2,
  CheckSquare,
  History,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import PriorityBadge from '@/components/PriorityBadge';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function TaskDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user, role } = useAuth();
  const taskId = params.id;

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Checklists
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [addingChecklist, setAddingChecklist] = useState(false);

  // Comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Activity
  const [activities, setActivities] = useState([]);

  // Assignment modal/picker
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [assigningMember, setAssigningMember] = useState(false);

  // Status updating
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadTaskData = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    try {
      const [taskRes, commentsRes, activityRes] = await Promise.all([
        api.getTaskById(taskId),
        api.getTaskComments(taskId).catch(() => ({ data: [] })),
        api.getTaskActivity(taskId).catch(() => ({ data: [] })),
      ]);

      if (taskRes.success && taskRes.data) {
        setTask(taskRes.data);
      } else {
        setError(taskRes.message || 'Task could not be loaded');
      }

      if (commentsRes.success && commentsRes.data) {
        setComments(commentsRes.data);
      }

      if (activityRes.success && activityRes.data) {
        setActivities(activityRes.data);
      }
    } catch (err) {
      setError(err.message || 'Error loading task details');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadTaskData();
  }, [loadTaskData]);

  // Load tenant members for assignment dropdown
  useEffect(() => {
    api
      .getMembers()
      .then((res) => {
        if (res.success && res.data) setMembers(res.data);
      })
      .catch(() => {});
  }, []);

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const res = await api.updateTaskStatus(taskId, newStatus);
      if (res.success) {
        await loadTaskData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddChecklist = async (e) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;
    setAddingChecklist(true);
    try {
      const res = await api.addChecklistItem(taskId, newChecklistTitle.trim());
      if (res.success) {
        setNewChecklistTitle('');
        await loadTaskData();
      }
    } catch (err) {
      alert(err.message || 'Failed to add checklist item');
    } finally {
      setAddingChecklist(false);
    }
  };

  const handleToggleChecklist = async (itemId, currentStatus) => {
    try {
      await api.toggleChecklistItem(taskId, itemId, !currentStatus);
      setTask((prev) => ({
        ...prev,
        checklists: prev.checklists.map((item) =>
          item.id === itemId ? { ...item, isCompleted: !currentStatus } : item
        ),
      }));
    } catch (err) {
      alert(err.message || 'Failed to toggle checklist item');
    }
  };

  const handleDeleteChecklist = async (itemId) => {
    if (!confirm('Are you sure you want to delete this checklist item?')) return;
    try {
      await api.deleteChecklistItem(taskId, itemId);
      setTask((prev) => ({
        ...prev,
        checklists: prev.checklists.filter((item) => item.id !== itemId),
      }));
    } catch (err) {
      alert(err.message || 'Failed to remove checklist item');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.addTaskComment(taskId, newComment.trim());
      if (res.success) {
        setNewComment('');
        const refreshed = await api.getTaskComments(taskId);
        if (refreshed.success) setComments(refreshed.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAssignMember = async () => {
    if (!selectedMemberId) return;
    setAssigningMember(true);
    try {
      const res = await api.assignTaskUser(taskId, selectedMemberId);
      if (res.success) {
        setSelectedMemberId('');
        await loadTaskData();
      }
    } catch (err) {
      alert(err.message || 'Failed to assign member');
    } finally {
      setAssigningMember(false);
    }
  };

  const handleUnassignMember = async (targetUserId) => {
    if (!confirm('Unassign this employee from the task?')) return;
    try {
      await api.unassignTaskUser(taskId, targetUserId);
      await loadTaskData();
    } catch (err) {
      alert(err.message || 'Failed to unassign member');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-semibold text-[#6B6172]">
        Loading task workspace...
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-[#4C2365]">Unable to Load Task</h3>
        <p className="text-xs text-[#6B6172]">{error || 'Task not found or access denied.'}</p>
        <Link
          href="/dashboard/tasks"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7F5D99] text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </Link>
      </div>
    );
  }

  const completedChecklistCount = task.checklists?.filter((c) => c.isCompleted).length || 0;
  const totalChecklistCount = task.checklists?.length || 0;
  const checklistPercentage =
    totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;

  const isEmployee = role === 'EMPLOYEE';
  const isManagerOrOwner = ['OWNER', 'BRANCH_MANAGER', 'SUPER_ADMIN'].includes(role);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8DFED]">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/tasks"
            className="p-2 rounded-xl bg-white border border-[#E8DFED] text-[#7F5D99] hover:bg-[#FAF6FD] transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-extrabold text-[#7F5D99]">
                #{task.taskNumber}
              </span>
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              {task.category && (
                <span className="text-[11px] font-semibold text-[#6B6172] bg-white px-2 py-0.5 rounded-md border border-[#E8DFED]">
                  {task.category}
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#251A2D] mt-1 tracking-tight">
              {task.title}
            </h1>
          </div>
        </div>

        {/* Status Transition Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {task.status === 'PENDING' && (
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              disabled={statusUpdating}
              className="px-3.5 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <PlayCircle className="w-4 h-4" />
              Start Work
            </button>
          )}

          {task.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleStatusChange('SUBMITTED')}
              disabled={statusUpdating}
              className="px-3.5 py-2 rounded-xl bg-[#4C2365] hover:bg-[#321743] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <FileCheck2 className="w-4 h-4" />
              Submit for Review
            </button>
          )}

          {task.status === 'SUBMITTED' && isManagerOrOwner && (
            <>
              <button
                onClick={() => handleStatusChange('CHANGES_REQUESTED')}
                disabled={statusUpdating}
                className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Request Changes
              </button>
              <button
                onClick={() => handleStatusChange('COMPLETED')}
                disabled={statusUpdating}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve & Complete
              </button>
            </>
          )}

          {task.status === 'CHANGES_REQUESTED' && (
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              disabled={statusUpdating}
              className="px-3.5 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <PlayCircle className="w-4 h-4" />
              Resume Work
            </button>
          )}

          {isManagerOrOwner && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
            <button
              onClick={() => {
                if (confirm('Cancel this task?')) handleStatusChange('CANCELLED');
              }}
              disabled={statusUpdating}
              className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-semibold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Details & Right Metadata Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Description, Checklists, Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Section */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
              Description & Requirements
            </h2>
            <div className="text-sm text-[#251A2D] leading-relaxed whitespace-pre-wrap">
              {task.description || (
                <span className="italic text-[#6B6172]">No description provided for this task.</span>
              )}
            </div>

            {task.requiresProof && (
              <div className="p-3 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center gap-3 mt-4">
                <FileCheck2 className="w-5 h-5 text-[#7F5D99] shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#4C2365]">Proof of Execution Required</h4>
                  <p className="text-[11px] text-[#6B6172]">
                    Submission requires uploading evidence ({task.proofType || 'PHOTO / VIDEO'})
                    before final approval.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Checklists Section */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#7F5D99]" />
                <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                  Checklist Items ({completedChecklistCount}/{totalChecklistCount})
                </h3>
              </div>
              <span className="text-xs font-bold text-[#7F5D99]">{checklistPercentage}%</span>
            </div>

            {/* Checklist Progress Bar */}
            <div className="w-full bg-[#FAF6FD] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#7F5D99] h-full transition-all duration-300"
                style={{ width: `${checklistPercentage}%` }}
              />
            </div>

            {/* Checklist Items List */}
            <div className="space-y-2 pt-2">
              {task.checklists?.length === 0 ? (
                <p className="text-xs text-[#6B6172] italic py-2">
                  No checklist items yet. Add subtasks or verification steps below.
                </p>
              ) : (
                task.checklists?.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[#FAF6FD]/60 border border-[#E8DFED] hover:border-[#9E7EB5] transition-all flex items-center justify-between gap-3 group"
                  >
                    <label className="flex items-center gap-3 flex-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={() => handleToggleChecklist(item.id, item.isCompleted)}
                        className="w-4 h-4 text-[#7F5D99] rounded-md border-[#C4A4DA] focus:ring-[#7F5D99] cursor-pointer"
                      />
                      <span
                        className={`text-xs font-medium ${
                          item.isCompleted
                            ? 'line-through text-[#6B6172]'
                            : 'text-[#251A2D]'
                        }`}
                      >
                        {item.title}
                      </span>
                    </label>

                    {isManagerOrOwner && (
                      <button
                        onClick={() => handleDeleteChecklist(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#6B6172] hover:text-rose-600 transition-opacity cursor-pointer"
                        title="Delete checklist item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Checklist Item Form */}
            <form onSubmit={handleAddChecklist} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                placeholder="Add subtask or milestone item..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#E8DFED] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
              />
              <button
                type="submit"
                disabled={addingChecklist || !newChecklistTitle.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>
          </div>

          {/* Collaborative Comments Section */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E8DFED]">
              <MessageSquare className="w-4 h-4 text-[#7F5D99]" />
              <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                Discussion & Notes ({comments.length})
              </h3>
            </div>

            {/* Comments Stream */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-xs text-[#6B6172] italic py-2">
                  No comments posted yet. Leave an update or question for the team.
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3.5 rounded-2xl bg-[#FAF6FD]/60 border border-[#E8DFED] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#7F5D99] text-white font-bold text-[10px] flex items-center justify-center">
                          {comment.user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <span className="font-bold text-[#4C2365]">
                          {comment.user?.fullName || 'User'}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#6B6172]">
                        {new Date(comment.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#251A2D] pl-8 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Post a comment or update..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#E8DFED] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-4 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Reply
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (1 Col): Assignees, Metadata, Audit Log */}
        <div className="space-y-6">
          {/* Assignees Card */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8DFED]">
              <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                Assigned Staff ({task.assignments?.length || 0})
              </h3>
            </div>

            <div className="space-y-2">
              {task.assignments?.length === 0 ? (
                <p className="text-xs text-[#6B6172] italic">No employees assigned yet.</p>
              ) : (
                task.assignments?.map((a) => (
                  <div
                    key={a.user.id}
                    className="p-2.5 rounded-xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#7F5D99] text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {a.user.fullName?.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-[#251A2D] truncate">
                          {a.user.fullName}
                        </div>
                        <div className="text-[10px] text-[#6B6172] truncate">{a.user.email}</div>
                      </div>
                    </div>

                    {isManagerOrOwner && (
                      <button
                        onClick={() => handleUnassignMember(a.user.id)}
                        className="p-1 text-[#6B6172] hover:text-rose-600 transition-colors cursor-pointer"
                        title="Unassign employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Assign Member Dropdown for Managers */}
            {isManagerOrOwner && (
              <div className="pt-2 border-t border-[#E8DFED] flex gap-2">
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:outline-hidden"
                >
                  <option value="">Select staff member...</option>
                  {members
                    .filter((m) => !task.assignments?.some((a) => a.user.id === m.id))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.role?.name || 'Staff'})
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssignMember}
                  disabled={assigningMember || !selectedMemberId}
                  className="px-3 py-1.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Assign
                </button>
              </div>
            )}
          </div>

          {/* Metadata Card */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-3.5">
            <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider pb-2 border-b border-[#E8DFED]">
              Task Properties
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6172] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#7F5D99]" />
                  Branch
                </span>
                <span className="font-bold text-[#251A2D]">{task.branch?.name || 'HQ / Global'}</span>
              </div>

              {task.team && (
                <div className="flex items-center justify-between">
                  <span className="text-[#6B6172] flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5 text-[#7F5D99]" />
                    Team
                  </span>
                  <span className="font-bold text-[#251A2D]">{task.team.name}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[#6B6172] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#7F5D99]" />
                  Due Date
                </span>
                <span className="font-bold text-[#251A2D]">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None set'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#6B6172]">Created By</span>
                <span className="font-medium text-[#251A2D]">
                  {task.createdBy?.fullName || 'System'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#6B6172]">Created On</span>
                <span className="text-[#6B6172]">
                  {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Activity / Audit Timeline */}
          <div className="p-5 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E8DFED]">
              <History className="w-4 h-4 text-[#7F5D99]" />
              <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                Audit Timeline
              </h3>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {activities.length === 0 ? (
                <p className="text-xs text-[#6B6172] italic">No activity logs recorded yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="text-xs space-y-0.5 border-l-2 border-[#C4A4DA] pl-3 py-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#4C2365] text-[11px]">{act.action}</span>
                      <span className="text-[10px] text-[#6B6172]">
                        {new Date(act.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#251A2D]">
                      By {act.user?.fullName || 'User'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-semibold text-[#6B6172]">
          Loading task workspace...
        </div>
      }
    >
      <TaskDetailContent />
    </Suspense>
  );
}
