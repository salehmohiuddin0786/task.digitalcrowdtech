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
  Camera,
  Video,
  FileText,
  UploadCloud,
  Maximize2,
  X,
  ExternalLink,
  Check,
  AlertCircle,
  Link2,
  Lock,
  Unlock,
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

  // Phase 4: Evidence & Proof
  const [evidenceList, setEvidenceList] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [evidenceCaption, setEvidenceCaption] = useState('');
  const [evidenceType, setEvidenceType] = useState('PHOTO');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [activePreview, setActivePreview] = useState(null);

  // Phase 4: Review Workflow
  const [reviewsList, setReviewsList] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Phase 6: Dependencies & Prerequisites
  const [tenantTasks, setTenantTasks] = useState([]);
  const [isAddPrereqModalOpen, setIsAddPrereqModalOpen] = useState(false);
  const [selectedPrereqId, setSelectedPrereqId] = useState('');
  const [addingPrereq, setAddingPrereq] = useState(false);

  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [targetPrereqToOverride, setTargetPrereqToOverride] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);

  const loadTaskData = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);
    try {
      const [taskRes, commentsRes, activityRes, evidenceRes, reviewsRes] = await Promise.all([
        api.getTaskById(taskId),
        api.getTaskComments(taskId).catch(() => ({ data: [] })),
        api.getTaskActivity(taskId).catch(() => ({ data: [] })),
        api.getTaskEvidence(taskId).catch(() => ({ data: [] })),
        api.getTaskReviews(taskId).catch(() => ({ data: [] })),
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

      if (evidenceRes.success && evidenceRes.data) {
        setEvidenceList(evidenceRes.data);
      }

      if (reviewsRes.success && reviewsRes.data) {
        setReviewsList(reviewsRes.data);
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
    // Check proof requirement client-side to prompt user nicely
    if (['SUBMITTED', 'COMPLETED'].includes(newStatus) && task.requiresProof && evidenceList.length === 0) {
      alert(`Proof of execution (${task.proofType || 'PHOTO/VIDEO'}) is required before this task can be submitted. Please upload evidence first.`);
      setIsUploadModalOpen(true);
      return;
    }

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

  // Phase 4: Handle Evidence Upload
  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a photo, video, or file to upload.');
      return;
    }

    setUploadingEvidence(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('fileType', evidenceType);
      if (evidenceCaption) formData.append('caption', evidenceCaption.trim());

      const res = await api.uploadTaskEvidence(taskId, formData);
      if (res.success) {
        setUploadFile(null);
        setEvidenceCaption('');
        setIsUploadModalOpen(false);
        await loadTaskData();
      }
    } catch (err) {
      alert(err.message || 'Evidence upload failed');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId) => {
    if (!confirm('Delete this proof of execution item?')) return;
    try {
      await api.deleteTaskEvidence(taskId, evidenceId);
      await loadTaskData();
    } catch (err) {
      alert(err.message || 'Failed to remove evidence');
    }
  };

  // Phase 4: Handle Supervisor Review Submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewDecision === 'CHANGES_REQUESTED' && !reviewFeedback.trim()) {
      alert('Please provide detailed feedback explaining what changes are required.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.submitTaskReview(taskId, {
        decision: reviewDecision,
        feedback: reviewFeedback.trim() || undefined,
      });

      if (res.success) {
        setIsReviewModalOpen(false);
        setReviewFeedback('');
        await loadTaskData();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Phase 6: Handle Dependencies & Prerequisites
  const handleOpenAddPrereqModal = async () => {
    setIsAddPrereqModalOpen(true);
    try {
      const res = await api.getTasks({ limit: 100 });
      if (res.success && res.data) {
        setTenantTasks(res.data);
      }
    } catch (e) {
      console.error('Error fetching tasks for dependency picker:', e);
    }
  };

  const handleAddPrerequisite = async (e) => {
    e.preventDefault();
    if (!selectedPrereqId) return;
    setAddingPrereq(true);
    try {
      const res = await api.addTaskDependency(taskId, selectedPrereqId);
      if (res.success) {
        setIsAddPrereqModalOpen(false);
        setSelectedPrereqId('');
        await loadTaskData();
      }
    } catch (err) {
      alert(err.message || 'Failed to add prerequisite dependency');
    } finally {
      setAddingPrereq(false);
    }
  };

  const handleRemovePrerequisite = async (prereqId) => {
    if (!confirm('Remove this prerequisite dependency?')) return;
    try {
      const res = await api.removeTaskDependency(taskId, prereqId);
      if (res.success) {
        await loadTaskData();
      }
    } catch (err) {
      alert(err.message || 'Failed to remove dependency');
    }
  };

  const handleOpenOverrideModal = (prereq) => {
    setTargetPrereqToOverride(prereq);
    setOverrideReason('');
    setIsOverrideModalOpen(true);
  };

  const handleSubmitOverride = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert('Please provide a business justification for overriding this prerequisite.');
      return;
    }
    if (!targetPrereqToOverride) return;

    setSubmittingOverride(true);
    try {
      const res = await api.overrideTaskDependency(
        taskId,
        targetPrereqToOverride.prerequisiteTaskId,
        overrideReason.trim()
      );
      if (res.success) {
        setIsOverrideModalOpen(false);
        setTargetPrereqToOverride(null);
        setOverrideReason('');
        await loadTaskData();
      }
    } catch (err) {
      alert(err.message || 'Failed to override prerequisite');
    } finally {
      setSubmittingOverride(false);
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
  const requiresProofMissing = task.requiresProof && evidenceList.length === 0;
  const hasBlockingPrerequisites =
    task.prerequisites?.some((p) => !p.isOverridden && p.prerequisiteTask?.status !== 'COMPLETED') ||
    false;

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
            <button
              onClick={() => setIsReviewModalOpen(true)}
              disabled={statusUpdating}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4C2365] to-[#7F5D99] hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-[#C4A4DA]" />
              Conduct Supervisor Review
            </button>
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

      {/* Mandatory Proof Alert Banner */}
      {requiresProofMissing && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Proof of Execution Required ({task.proofType || 'PHOTO / VIDEO'})
              </h4>
              <p className="text-[11px] text-amber-700">
                This task cannot be submitted or approved until photographic or video evidence is attached.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            Upload Now
          </button>
        </div>
      )}

      {/* Phase 6: Prerequisite Blocking Alert Banner */}
      {hasBlockingPrerequisites && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Task Execution Blocked by Unfinished Prerequisites
              </h4>
              <p className="text-[11px] text-amber-700">
                This task depends on prior tasks that have not yet reached completion. All prerequisites must be completed or overridden by a manager before starting work.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left Details & Right Metadata Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Description, Evidence Gallery, Checklists, Comments */}
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
          </div>

          {/* Phase 6: Task Dependencies & Prerequisites */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#7F5D99]" />
                <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                  Task Dependencies & Prerequisites ({task.prerequisites?.length || 0})
                </h3>
              </div>
              {isManagerOrOwner && (
                <button
                  type="button"
                  onClick={handleOpenAddPrereqModal}
                  className="px-3 py-1.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Prerequisite
                </button>
              )}
            </div>

            {/* Prerequisites List */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold text-[#6B6172] uppercase tracking-wider">
                Prerequisite Tasks (Must complete first)
              </h4>
              {!task.prerequisites || task.prerequisites.length === 0 ? (
                <p className="text-xs text-[#6B6172] italic py-2">
                  No prerequisite tasks required. This task can be started directly.
                </p>
              ) : (
                task.prerequisites.map((p) => {
                  const isCompleted = p.prerequisiteTask?.status === 'COMPLETED';
                  const isOverridden = p.isOverridden;
                  const isBlocked = !isCompleted && !isOverridden;

                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCompleted
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : isOverridden
                          ? 'bg-purple-50/50 border-purple-200'
                          : 'bg-amber-50/40 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : isOverridden ? (
                            <ShieldCheck className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Lock className="w-4 h-4 text-amber-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/dashboard/tasks/${p.prerequisiteTask?.id}`}
                              className="text-xs font-bold text-[#4C2365] hover:text-[#7F5D99] hover:underline"
                            >
                              #{p.prerequisiteTask?.taskNumber}: {p.prerequisiteTask?.title}
                            </Link>
                            <StatusBadge status={p.prerequisiteTask?.status} />
                          </div>
                          <div className="text-[11px] mt-1 flex items-center gap-2 flex-wrap">
                            {isCompleted && (
                              <span className="font-semibold text-emerald-700">✓ Prerequisite Satisfied</span>
                            )}
                            {isOverridden && (
                              <span className="font-semibold text-purple-700">
                                ⚠ Overridden by Manager {p.overrideReason ? `("${p.overrideReason}")` : ''}
                              </span>
                            )}
                            {isBlocked && (
                              <span className="font-semibold text-amber-700">
                                🔒 Blocking — Pending Completion
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {isBlocked && isManagerOrOwner && (
                          <button
                            type="button"
                            onClick={() => handleOpenOverrideModal(p)}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-[#4C2365] font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Unlock className="w-3 h-3" />
                            Override Block
                          </button>
                        )}
                        {isManagerOrOwner && (
                          <button
                            type="button"
                            onClick={() => handleRemovePrerequisite(p.prerequisiteTaskId)}
                            className="p-1.5 text-[#6B6172] hover:text-rose-600 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                            title="Remove prerequisite dependency"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Downstream Dependents */}
            <div className="space-y-2 pt-2 border-t border-[#E8DFED]">
              <h4 className="text-[11px] font-bold text-[#6B6172] uppercase tracking-wider">
                Downstream Dependents (Tasks waiting on this task) ({task.dependents?.length || 0})
              </h4>
              {!task.dependents || task.dependents.length === 0 ? (
                <p className="text-xs text-[#6B6172] italic">
                  No other tasks are waiting on this task.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {task.dependents.map((dep) => (
                    <Link
                      key={dep.id}
                      href={`/dashboard/tasks/${dep.task?.id}`}
                      className="p-2.5 rounded-xl bg-[#FAF6FD] border border-[#E8DFED] hover:border-[#7F5D99] transition-all flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <span className="text-[10px] font-mono font-bold text-[#7F5D99]">
                          #{dep.task?.taskNumber}
                        </span>
                        <div className="text-xs font-semibold text-[#251A2D] truncate">
                          {dep.task?.title}
                        </div>
                      </div>
                      <StatusBadge status={dep.task?.status} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Phase 4: Proof of Execution & Evidence Gallery */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#7F5D99]" />
                <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                  Proof of Execution & Evidence ({evidenceList.length})
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload Evidence
              </button>
            </div>

            {/* Evidence Items Grid */}
            {evidenceList.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#E8DFED] rounded-2xl bg-[#FAF6FD]/30">
                <Camera className="w-8 h-8 text-[#C4A4DA] mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-[#251A2D]">No evidence uploaded yet</p>
                <p className="text-[11px] text-[#6B6172] mt-0.5">
                  Attach photos, video recordings, or documents verifying task completion.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {evidenceList.map((item) => {
                  const isImage = item.fileType === 'PHOTO' || item.mimeType?.startsWith('image/');
                  const isVideo = item.fileType === 'VIDEO' || item.mimeType?.startsWith('video/');

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-[#FAF6FD]/60 border border-[#E8DFED] hover:border-[#9E7EB5] transition-all space-y-2 group relative flex flex-col justify-between"
                    >
                      <div
                        onClick={() => setActivePreview(item)}
                        className="w-full h-32 rounded-xl bg-[#F0E6F6] flex items-center justify-center overflow-hidden cursor-pointer relative group-hover:opacity-90"
                      >
                        {isImage ? (
                          <img
                            src={item.fileUrl}
                            alt={item.caption || item.fileName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : isVideo ? (
                          <div className="flex flex-col items-center text-[#7F5D99]">
                            <Video className="w-8 h-8 mb-1" />
                            <span className="text-[10px] font-bold">Video Recording</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-[#7F5D99]">
                            <FileText className="w-8 h-8 mb-1" />
                            <span className="text-[10px] font-bold">Document</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Maximize2 className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-[#7F5D99] uppercase tracking-wider bg-white px-1.5 py-0.5 rounded border border-[#E8DFED]">
                            {item.fileType}
                          </span>
                          <span className="text-[#6B6172]">
                            {item.fileSize ? `${Math.round(item.fileSize / 1024)} KB` : ''}
                          </span>
                        </div>
                        {item.caption && (
                          <p className="text-xs font-semibold text-[#251A2D] line-clamp-2">
                            {item.caption}
                          </p>
                        )}
                        <p className="text-[10px] text-[#6B6172] truncate">{item.fileName}</p>
                      </div>

                      <div className="pt-2 border-t border-[#E8DFED] flex items-center justify-between">
                        <span className="text-[9px] text-[#6B6172]">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        {(isManagerOrOwner || item.uploadedById === user?.id) && (
                          <button
                            onClick={() => handleDeleteEvidence(item.id)}
                            className="text-rose-600 hover:text-rose-800 p-1 text-[11px] cursor-pointer"
                            title="Delete evidence"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Phase 4: Supervisor Review History Timeline */}
          {reviewsList.length > 0 && (
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E8DFED]">
                <ShieldCheck className="w-4 h-4 text-[#7F5D99]" />
                <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                  Supervisor Review History ({reviewsList.length})
                </h3>
              </div>

              <div className="space-y-3">
                {reviewsList.map((rev) => {
                  const isApproved = rev.decision === 'APPROVED';
                  return (
                    <div
                      key={rev.id}
                      className={`p-4 rounded-2xl border ${
                        isApproved
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-amber-50/60 border-amber-200'
                      } space-y-2`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                              isApproved
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-600 text-white'
                            }`}
                          >
                            {isApproved ? 'Approved' : 'Changes Requested'}
                          </span>
                          <span className="font-bold text-[#251A2D]">
                            {rev.reviewer?.fullName || 'Supervisor'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#6B6172]">
                          {new Date(rev.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {rev.feedback && (
                        <p className="text-xs text-[#251A2D] italic bg-white/70 p-2.5 rounded-xl border border-black/5 leading-relaxed">
                          "{rev.feedback}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

            <div className="space-y-3 max-h-[380px] overflow-y-auto">
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

        {/* Right Column (1 Col): Assignees, Properties, Audit Log */}
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

          {/* Properties Card */}
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
                <span className="text-[#6B6172]">Proof Required</span>
                <span className="font-bold text-[#7F5D99]">
                  {task.requiresProof ? task.proofType || 'YES' : 'Optional'}
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

          {/* Audit Timeline */}
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

      {/* MODAL 1: Upload Evidence Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E8DFED] shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAF6FD] text-[#7F5D99]">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#4C2365]">Upload Proof of Execution</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B6172] hover:bg-[#FAF6FD] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadEvidence} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4C2365] mb-1.5">
                  Evidence File Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'PHOTO', label: 'Photo', icon: Camera },
                    { key: 'VIDEO', label: 'Video', icon: Video },
                    { key: 'DOCUMENT', label: 'Document', icon: FileText },
                  ].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        type="button"
                        key={t.key}
                        onClick={() => setEvidenceType(t.key)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          evidenceType === t.key
                            ? 'bg-[#7F5D99] text-white border-[#7F5D99]'
                            : 'bg-white text-[#6B6172] border-[#E8DFED] hover:bg-[#FAF6FD]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4C2365] mb-1.5">
                  Select File / Camera Capture
                </label>
                <input
                  type="file"
                  accept={
                    evidenceType === 'PHOTO'
                      ? 'image/*'
                      : evidenceType === 'VIDEO'
                      ? 'video/*'
                      : 'application/pdf,image/*'
                  }
                  onChange={(e) => setUploadFile(e.target.files[0] || null)}
                  className="w-full text-xs text-[#251A2D] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#FAF6FD] file:text-[#7F5D99] hover:file:bg-[#E8DFED] border border-[#E8DFED] rounded-xl p-1 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4C2365] mb-1.5">
                  Caption / Verification Note
                </label>
                <input
                  type="text"
                  value={evidenceCaption}
                  onChange={(e) => setEvidenceCaption(e.target.value)}
                  placeholder="e.g. Counter wiped and disinfected at 4:30 PM..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E8DFED] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8DFED]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6172] hover:bg-[#FAF6FD] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingEvidence || !uploadFile}
                  className="px-4 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {uploadingEvidence ? 'Uploading...' : 'Upload Evidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Supervisor Review Decision Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E8DFED] shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAF6FD] text-[#7F5D99]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#4C2365]">Conduct Task Review</h3>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B6172] hover:bg-[#FAF6FD] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4C2365] mb-2">
                  Review Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('APPROVED')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      reviewDecision === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-[#251A2D] border-[#E8DFED] hover:bg-emerald-50/50'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Approve & Complete
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewDecision('CHANGES_REQUESTED')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      reviewDecision === 'CHANGES_REQUESTED'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-[#251A2D] border-[#E8DFED] hover:bg-amber-50/50'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Request Changes
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4C2365] mb-1.5">
                  Supervisor Feedback & Instructions{' '}
                  {reviewDecision === 'CHANGES_REQUESTED' && (
                    <span className="text-rose-600">*</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder={
                    reviewDecision === 'APPROVED'
                      ? 'Optional praise or confirmation note...'
                      : 'Specify what requires rectification before approval...'
                  }
                  required={reviewDecision === 'CHANGES_REQUESTED'}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E8DFED] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8DFED]">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6172] hover:bg-[#FAF6FD] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {submittingReview ? 'Submitting...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Lightbox Evidence Preview */}
      {activePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <div className="p-4 bg-[#4C2365] text-white flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold tracking-tight">{activePreview.fileName}</h4>
                {activePreview.caption && (
                  <p className="text-[11px] text-[#C4A4DA]">{activePreview.caption}</p>
                )}
              </div>
              <button
                onClick={() => setActivePreview(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-black flex items-center justify-center max-h-[70vh] overflow-hidden">
              {activePreview.fileType === 'PHOTO' || activePreview.mimeType?.startsWith('image/') ? (
                <img
                  src={activePreview.fileUrl}
                  alt={activePreview.caption || activePreview.fileName}
                  className="max-h-[65vh] w-auto object-contain mx-auto rounded-lg"
                />
              ) : activePreview.fileType === 'VIDEO' || activePreview.mimeType?.startsWith('video/') ? (
                <video
                  src={activePreview.fileUrl}
                  controls
                  autoPlay
                  className="max-h-[65vh] w-full object-contain mx-auto rounded-lg"
                />
              ) : (
                <div className="p-12 text-center text-white space-y-3">
                  <FileText className="w-16 h-16 text-[#C4A4DA] mx-auto opacity-80" />
                  <p className="text-sm font-semibold">{activePreview.fileName}</p>
                  <a
                    href={activePreview.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7F5D99] text-white text-xs font-bold"
                  >
                    Open Document
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Add Prerequisite Dependency */}
      {isAddPrereqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E8DFED] shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAF6FD] text-[#7F5D99]">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#4C2365]">Add Prerequisite Task</h3>
                  <p className="text-[11px] text-[#6B6172]">Select a task that must finish before this one</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPrereqModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B6172] hover:bg-[#FAF6FD] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPrerequisite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4C2365] mb-1.5">
                  Select Prerequisite Task
                </label>
                <select
                  value={selectedPrereqId}
                  onChange={(e) => setSelectedPrereqId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#E8DFED] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
                >
                  <option value="">Choose task from tenant workspace...</option>
                  {tenantTasks
                    .filter(
                      (t) =>
                        t.id !== taskId &&
                        !task.prerequisites?.some((p) => p.prerequisiteTaskId === t.id)
                    )
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        #{t.taskNumber} — {t.title} ({t.status})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] text-[11px] text-[#6B6172] space-y-1">
                <p className="font-semibold text-[#4C2365]">Dependency Enforcement:</p>
                <p>
                  Until this selected prerequisite is completed or overridden, employees will not be able to mark this task as In Progress or Completed.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8DFED]">
                <button
                  type="button"
                  onClick={() => setIsAddPrereqModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6172] hover:bg-[#FAF6FD] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingPrereq || !selectedPrereqId}
                  className="px-4 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {addingPrereq ? 'Linking...' : 'Link Dependency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Manager Prerequisite Override */}
      {isOverrideModalOpen && targetPrereqToOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E8DFED] shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-[#7F5D99]">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#4C2365]">Override Prerequisite Block</h3>
                  <p className="text-[11px] text-[#6B6172]">Managerial exemption for task progression</p>
                </div>
              </div>
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B6172] hover:bg-[#FAF6FD] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOverride} className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold">Overriding Predecessor Task:</span>
                <p className="font-semibold text-[#4C2365]">
                  #{targetPrereqToOverride.prerequisiteTask?.taskNumber} — {targetPrereqToOverride.prerequisiteTask?.title}
                </p>
                <p className="text-[11px] text-amber-700">
                  Status: {targetPrereqToOverride.prerequisiteTask?.status}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4C2365] mb-1.5">
                  Business Justification / Override Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Approved by Operations Director to proceed in parallel, materials arrived early..."
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E8DFED] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8DFED]">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6172] hover:bg-[#FAF6FD] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOverride || !overrideReason.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4C2365] to-[#7F5D99] hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {submittingOverride ? 'Saving Override...' : 'Confirm Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
