'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Edit2,
  Archive,
  ArrowRight,
  TrendingUp,
  Layers,
  Copy,
  Check,
  UserCheck,
  Sparkles,
  ChevronDown,
  Flag,
  Eye,
  AlertCircle,
  RefreshCw,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const PRIORITY_OPTIONS = [
  {
    id: 'LOW',
    label: 'Low',
    color: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    ring: 'focus:ring-sky-400',
    activeBg: 'bg-sky-50 border-sky-400 text-sky-900 shadow-xs',
  },
  {
    id: 'MEDIUM',
    label: 'Medium',
    color: 'bg-[#7F5D99]',
    badge: 'bg-purple-50 text-[#4C2365] border-purple-200',
    ring: 'focus:ring-[#7F5D99]',
    activeBg: 'bg-[#FAF6FD] border-[#7F5D99] text-[#4C2365] shadow-xs',
  },
  {
    id: 'HIGH',
    label: 'High',
    color: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    ring: 'focus:ring-amber-400',
    activeBg: 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs',
  },
  {
    id: 'URGENT',
    label: 'Urgent',
    color: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    ring: 'focus:ring-rose-400',
    activeBg: 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs',
    pulse: true,
  },
];

const STATUS_OPTIONS = [
  { id: 'PLANNING', label: 'Planning', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'NOT_STARTED', label: 'Not Started', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'IN_PROGRESS', label: 'In Progress', badge: 'bg-purple-50 text-[#4C2365] border-purple-200' },
  { id: 'ON_HOLD', label: 'On Hold', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'COMPLETED', label: 'Completed', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'CANCELLED', label: 'Cancelled', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'ARCHIVED', label: 'Archived', badge: 'bg-gray-100 text-gray-600 border-gray-200' },
];

export default function ProjectsPage() {
  const { user, role, can } = useAuth();
  const [projects, setProjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [eligibleLeads, setEligibleLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('');
  const [leadFilter, setLeadFilter] = useState('');

  // Project Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [code, setCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [description, setDescription] = useState('');
  const [branchId, setBranchId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [isLeadDropdownOpen, setIsLeadDropdownOpen] = useState(false);
  const [targetEndDate, setTargetEndDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('IN_PROGRESS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Project Details Drawer / View Modal
  const [viewingProject, setViewingProject] = useState(null);
  const [cardCodeCopied, setCardCodeCopied] = useState({});

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState('');

  const canManageProjects = role === 'OWNER' || role === 'COMPANY_ADMIN' || can('branches.manage');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (branchFilter) params.branchId = branchFilter;
      if (leadFilter) params.leadId = leadFilter;

      const [projectsRes, branchesRes, leadsRes] = await Promise.all([
        api.getProjects(params),
        api.getBranches().catch(() => ({ success: false, data: [] })),
        api.getEligibleProjectLeads().catch(() => ({ success: false, data: [] })),
      ]);

      if (projectsRes?.success) {
        setProjects(projectsRes.data || []);
      }
      if (branchesRes?.success) {
        setBranches(branchesRes.data || []);
      }
      if (leadsRes?.success) {
        setEligibleLeads(leadsRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load project data:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, branchFilter, leadFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Create Modal with Auto Code Preview
  const openCreateModal = async () => {
    setEditingProject(null);
    setName('');
    setNameError('');
    setDescription('');
    setBranchId('');
    setLeadId('');
    setLeadSearch('');
    setIsLeadDropdownOpen(false);
    setTargetEndDate('');
    setPriority('MEDIUM');
    setStatus('IN_PROGRESS');
    setFormError('');
    setCodeCopied(false);

    // Fetch next authoritative preview code
    try {
      const res = await api.getProjectPreviewCode();
      if (res?.success && res.data?.code) {
        setCode(res.data.code);
      } else {
        const year = new Date().getFullYear();
        setCode(`PRJ-${year}-0001`);
      }
    } catch (err) {
      const year = new Date().getFullYear();
      setCode(`PRJ-${year}-0001`);
    }

    setIsModalOpen(true);
  };

  const openEditModal = (proj) => {
    setEditingProject(proj);
    setName(proj.name || '');
    setNameError('');
    setCode(proj.code || '');
    setDescription(proj.description || '');
    setBranchId(proj.branchId || '');
    setLeadId(proj.leadId || '');
    setLeadSearch('');
    setIsLeadDropdownOpen(false);
    setTargetEndDate(proj.targetEndDate ? proj.targetEndDate.split('T')[0] : '');
    setPriority(proj.priority || 'MEDIUM');
    setStatus(proj.status || 'IN_PROGRESS');
    setFormError('');
    setCodeCopied(false);
    setIsModalOpen(true);
  };

  const handleCopyCode = (textToCopy, isModal = false, projId = null) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    if (isModal) {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
    if (projId) {
      setCardCodeCopied((prev) => ({ ...prev, [projId]: true }));
      setTimeout(() => {
        setCardCodeCopied((prev) => ({ ...prev, [projId]: false }));
      }, 2000);
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();

    // Title validation
    if (!name.trim()) {
      setNameError('Project title is required.');
      return;
    }
    setNameError('');
    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingProject) {
        const res = await api.updateProject(editingProject.id, {
          name: name.trim(),
          code: code.trim() || null,
          description: description.trim() || null,
          branchId: branchId || null,
          leadId: leadId || null,
          targetEndDate: targetEndDate ? new Date(targetEndDate).toISOString() : null,
          priority,
          status,
        });

        if (res.success) {
          showToast(`Project "${res.data.name}" updated successfully.`);
          setIsModalOpen(false);
          loadData();
        }
      } else {
        const res = await api.createProject({
          name: name.trim(),
          code: code.trim() || null,
          description: description.trim() || null,
          branchId: branchId || null,
          leadId: leadId || null,
          targetEndDate: targetEndDate ? new Date(targetEndDate).toISOString() : null,
          priority,
          status,
        });

        if (res.success) {
          showToast(`Project "${res.data.name}" created with code ${res.data.code}.`);
          setIsModalOpen(false);
          loadData();
        }
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save project. Please check required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveProject = async (proj) => {
    const isArchived = proj.status === 'ARCHIVED';
    const actionText = isArchived ? 'restore' : 'archive';
    if (!confirm(`Are you sure you want to ${actionText} project "${proj.name}"?`)) return;

    try {
      await api.updateProject(proj.id, {
        status: isArchived ? 'IN_PROGRESS' : 'ARCHIVED',
      });
      showToast(`Project "${proj.name}" has been ${isArchived ? 'restored' : 'archived'}.`);
      loadData();
    } catch (err) {
      alert(err.message || `Failed to ${actionText} project`);
    }
  };

  // Filtered Leads for dropdown
  const filteredLeads = useMemo(() => {
    return eligibleLeads.filter((l) => {
      const matchSearch =
        l.fullName.toLowerCase().includes(leadSearch.toLowerCase()) ||
        l.email.toLowerCase().includes(leadSearch.toLowerCase()) ||
        (l.designation && l.designation.toLowerCase().includes(leadSearch.toLowerCase()));

      if (!branchId) return matchSearch;
      // If branch selected, prioritize or filter matching branch or org-wide leads
      return matchSearch;
    });
  }, [eligibleLeads, leadSearch, branchId]);

  const selectedLeadObj = eligibleLeads.find((l) => l.userId === leadId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-[#4C2365] text-white text-xs sm:text-sm font-semibold rounded-2xl shadow-xl border border-[#7F5D99] animate-modal-in">
          <Sparkles className="w-4 h-4 text-[#C4A4DA]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-[#7F5D99]" />
            Project Management
          </h2>
          <p className="text-xs text-[#6B6172] mt-0.5">
            Organize multi-task work streams, assign project leadership, track completion velocity, and align deliverables with branches.
          </p>
        </div>

        {canManageProjects && (
          <button
            onClick={openCreateModal}
            className="btn-glossy-primary px-5 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7F5D99]"
          >
            <Plus className="w-4 h-4" />
            Create New Project
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-[#E8DFED] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#6B6172] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by title, code, or description..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-[#FAF6FD]/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]/40 focus:border-[#7F5D99] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:outline-hidden focus:border-[#7F5D99] transition-all cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:outline-hidden focus:border-[#7F5D99] transition-all cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} Priority
              </option>
            ))}
          </select>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:outline-hidden focus:border-[#7F5D99] transition-all cursor-pointer"
          >
            <option value="">All Branch Locations</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code || 'LOC'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#6B6172] font-semibold flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 text-[#7F5D99] animate-spin" />
          <span>Loading organization projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white border border-[#E8DFED] space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#FAF6FD] border border-[#E8DFED] mx-auto flex items-center justify-center text-[#9E7EB5]">
            <FolderGit2 className="w-8 h-8 opacity-70" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-[#251A2D]">No projects found</h3>
            <p className="text-xs text-[#6B6172] leading-relaxed">
              {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || branchFilter
                ? 'No projects match your current filter criteria. Try resetting filters.'
                : "Get started by creating your organization's first project to link tasks, assign leads, and monitor delivery velocity."}
            </p>
          </div>
          {canManageProjects && (
            <button
              onClick={openCreateModal}
              className="btn-glossy-primary px-5 py-2.5 rounded-xl text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const stats = proj.stats || {
              totalTasks: 0,
              eligibleTasks: 0,
              completedTasks: 0,
              inProgressTasks: 0,
              pendingTasks: 0,
              overdueTasks: 0,
              completionPercentage: 0,
              hasTasks: false,
            };

            const completionPct = stats.completionPercentage || 0;
            const priorityCfg = PRIORITY_OPTIONS.find((p) => p.id === proj.priority) || PRIORITY_OPTIONS[1];
            const statusCfg = STATUS_OPTIONS.find((s) => s.id === proj.status) || STATUS_OPTIONS[2];
            const isCopied = cardCodeCopied[proj.id];

            return (
              <div
                key={proj.id}
                className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4 card-hover-lift flex flex-col justify-between group"
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Icon, Code & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365] group-hover:scale-105 transition-transform shrink-0">
                      <FolderGit2 className="w-5 h-5" />
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {/* Priority Badge */}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border flex items-center gap-1.5 ${priorityCfg.badge}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${priorityCfg.color} ${priorityCfg.pulse ? 'animate-pulse' : ''}`} />
                        {priorityCfg.label}
                      </span>

                      {/* Status Badge */}
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${statusCfg.badge}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Project Code & Title */}
                  <div>
                    {proj.code && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-[10px] font-extrabold text-[#7F5D99] bg-[#FAF6FD] px-2 py-0.5 rounded-md border border-[#E8DFED]">
                          {proj.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(proj.code, false, proj.id)}
                          title="Copy project code"
                          className="p-1 rounded-md text-[#6B6172] hover:text-[#4C2365] hover:bg-[#FAF6FD] transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                    <h3 className="text-base font-bold text-[#251A2D] group-hover:text-[#4C2365] transition-colors line-clamp-1">
                      {proj.name}
                    </h3>
                    {proj.description && (
                      <p className="text-xs text-[#6B6172] mt-1 line-clamp-2 leading-relaxed">
                        {proj.description}
                      </p>
                    )}
                  </div>

                  {/* Lead, Branch & Deadline Pills */}
                  <div className="space-y-1.5 text-xs text-[#6B6172] pt-1">
                    {/* Project Lead */}
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#FAF6FD] border border-[#7F5D99]/30 flex items-center justify-center text-[10px] font-bold text-[#4C2365] shrink-0">
                        {proj.lead?.fullName ? proj.lead.fullName.charAt(0).toUpperCase() : <UserCheck className="w-3 h-3 text-[#7F5D99]" />}
                      </div>
                      <span className="text-xs text-[#251A2D] truncate">
                        Lead: <strong className="font-semibold text-[#4C2365]">{proj.lead?.fullName || 'Unassigned'}</strong>
                      </span>
                    </div>

                    {/* Branch & Target Date */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-[#6B6172]">
                        <Building2 className="w-3.5 h-3.5 text-[#9E7EB5] shrink-0" />
                        <span className="truncate">{proj.branch ? `${proj.branch.name} (${proj.branch.code || 'LOC'})` : 'Organization-Wide'}</span>
                      </span>
                      {proj.targetEndDate && (
                        <span className="flex items-center gap-1 text-[#6B6172]">
                          <Calendar className="w-3.5 h-3.5 text-[#9E7EB5] shrink-0" />
                          <span>Due {new Date(proj.targetEndDate).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Progress Metric & Velocity Bar */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#4C2365] flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#7F5D99]" />
                        Velocity
                      </span>
                      {stats.hasTasks ? (
                        <span className="text-xs font-extrabold text-[#7F5D99] font-mono">
                          {completionPct}% Complete
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-[#6B6172] px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">
                          No tasks yet
                        </span>
                      )}
                    </div>

                    {stats.hasTasks ? (
                      <>
                        <div className="w-full bg-[#E8DFED] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full progress-bar-smooth ${
                              completionPct === 100
                                ? 'bg-emerald-500'
                                : completionPct >= 50
                                ? 'bg-[#7F5D99]'
                                : completionPct > 0
                                ? 'bg-amber-500'
                                : 'bg-gray-300'
                            }`}
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>

                        {/* Task Count Breakdown Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                            {stats.completedTasks} Done
                          </span>
                          <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-semibold">
                            {stats.inProgressTasks} Active
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-800 font-semibold">
                            {stats.pendingTasks} Pending
                          </span>
                          {stats.overdueTasks > 0 && (
                            <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {stats.overdueTasks} Overdue
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-[#6B6172] italic">
                        Not started. Link tasks to this project code to track progress.
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-[#E8DFED] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewingProject(proj)}
                      className="p-1.5 text-[#6B6172] hover:text-[#4C2365] rounded-lg hover:bg-[#FAF6FD] transition-colors cursor-pointer"
                      title="View Project Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {canManageProjects && (
                      <>
                        <button
                          onClick={() => openEditModal(proj)}
                          className="p-1.5 text-[#6B6172] hover:text-[#4C2365] rounded-lg hover:bg-[#FAF6FD] transition-colors cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleArchiveProject(proj)}
                          className="p-1.5 text-[#6B6172] hover:text-rose-600 rounded-lg hover:bg-[#FAF6FD] transition-colors cursor-pointer"
                          title={proj.status === 'ARCHIVED' ? 'Restore Project' : 'Archive Project'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/tasks?projectId=${proj.id}`}
                    className="text-xs font-bold text-[#7F5D99] hover:text-[#4C2365] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Tasks ({stats.totalTasks})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* CREATE / EDIT PROJECT MODAL (Animos-inspired, 3 sections, 2 cols)   */}
      {/* =================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E8DFED] overflow-hidden animate-modal-in my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#FAF6FD] border-b border-[#E8DFED] flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#4C2365] flex items-center gap-2">
                  <FolderGit2 className="w-5 h-5 text-[#7F5D99]" />
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h3>
                <p className="text-xs text-[#6B6172] mt-0.5">
                  Define project scope, assign leadership, and configure delivery parameters.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#6B6172] hover:text-[#4C2365] hover:bg-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 space-y-6">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SECTION 1: Project Details                                    */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E8DFED] pb-2">
                  <span className="w-2 h-2 rounded-full bg-[#7F5D99]" />
                  <h4 className="text-xs font-extrabold text-[#4C2365] uppercase tracking-wider">
                    1. Project Details
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Project Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                      Project Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError('');
                      }}
                      placeholder="e.g. Q4 Regional Operations & Compliance Rollout"
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs text-[#251A2D] bg-[#FAF6FD]/40 focus:bg-white transition-all focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]/40 ${
                        nameError ? 'border-rose-300 ring-2 ring-rose-100' : 'border-[#E8DFED] focus:border-[#7F5D99]'
                      }`}
                    />
                    {nameError && (
                      <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {nameError}
                      </p>
                    )}
                  </div>

                  {/* Project Code (Auto Generated & Read-only with Copy) */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#251A2D] uppercase tracking-wider">
                        Project Code (Auto-Generated)
                      </label>
                      <span className="text-[10px] text-[#7F5D99] font-semibold bg-[#FAF6FD] px-2 py-0.5 rounded-md border border-[#E8DFED]">
                        Safe Sequence Guaranteed
                      </span>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type="text"
                        readOnly
                        value={code}
                        placeholder="PRJ-2026-0001"
                        className="w-full pl-4 pr-24 py-2.5 rounded-xl border border-[#E8DFED] text-xs font-mono font-bold text-[#4C2365] bg-[#FAF6FD] cursor-not-allowed select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyCode(code, true)}
                        className="absolute right-2 px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-[#E8DFED] hover:border-[#7F5D99] text-[#4C2365] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {codeCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-[#7F5D99]" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#6B6172] mt-1">
                      Unique project identifier assigned automatically. The backend verifies uniqueness upon creation.
                    </p>
                  </div>

                  {/* Project Description with Character Counter */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#251A2D] uppercase tracking-wider">
                        Project Description
                      </label>
                      <span className={`text-[10px] font-mono ${description.length > 450 ? 'text-amber-600 font-bold' : 'text-[#6B6172]'}`}>
                        {description.length} / 500
                      </span>
                    </div>
                    <textarea
                      value={description}
                      maxLength={500}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Outline core objectives, high-level deliverables, milestones, and operational expectations..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-[#FAF6FD]/40 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]/40 focus:border-[#7F5D99] transition-all leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 2: Ownership & Scope                                  */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E8DFED] pb-2">
                  <span className="w-2 h-2 rounded-full bg-[#7F5D99]" />
                  <h4 className="text-xs font-extrabold text-[#4C2365] uppercase tracking-wider">
                    2. Ownership & Scope
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Associated Branch */}
                  <div>
                    <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                      Associated Branch
                    </label>
                    <div className="relative">
                      <select
                        value={branchId}
                        onChange={(e) => {
                          setBranchId(e.target.value);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]/40 focus:border-[#7F5D99] transition-all cursor-pointer"
                      >
                        <option value="">Organization-Wide (No Branch)</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code || 'LOC'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[10px] text-[#6B6172] mt-1">
                      Organization-wide projects span across all branches and central operations.
                    </p>
                  </div>

                  {/* Assign Project Lead */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                      Assign Project Lead
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsLeadDropdownOpen(!isLeadDropdownOpen)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#E8DFED] text-xs text-left bg-white flex items-center justify-between focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]/40 focus:border-[#7F5D99] transition-all cursor-pointer"
                      >
                        {selectedLeadObj ? (
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-5 h-5 rounded-full bg-[#FAF6FD] border border-[#7F5D99]/30 flex items-center justify-center text-[10px] font-bold text-[#4C2365] shrink-0">
                              {selectedLeadObj.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-[#251A2D] truncate">
                              {selectedLeadObj.fullName}
                            </span>
                            <span className="text-[10px] text-[#7F5D99] bg-[#FAF6FD] px-1.5 py-0.5 rounded border border-[#E8DFED]">
                              {selectedLeadObj.roleLabel}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#6B6172]">Select an eligible Project Lead...</span>
                        )}
                        <ChevronDown className="w-4 h-4 text-[#6B6172] shrink-0" />
                      </button>

                      {/* Dropdown Menu */}
                      {isLeadDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-2xl border border-[#E8DFED] shadow-xl p-2 space-y-2 animate-fade-in max-h-60 overflow-y-auto">
                          <input
                            type="text"
                            value={leadSearch}
                            onChange={(e) => setLeadSearch(e.target.value)}
                            placeholder="Filter leads by name or role..."
                            className="w-full px-3 py-1.5 text-xs bg-[#FAF6FD] border border-[#E8DFED] rounded-xl focus:outline-hidden focus:border-[#7F5D99]"
                          />

                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                setLeadId('');
                                setIsLeadDropdownOpen(false);
                              }}
                              className="w-full p-2 text-left rounded-xl text-xs text-[#6B6172] hover:bg-gray-100 cursor-pointer"
                            >
                              -- None (Unassigned) --
                            </button>

                            {filteredLeads.map((lead) => {
                              const isSelected = lead.userId === leadId;
                              return (
                                <button
                                  key={lead.userId}
                                  type="button"
                                  onClick={() => {
                                    setLeadId(lead.userId);
                                    setIsLeadDropdownOpen(false);
                                  }}
                                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#FAF6FD] border border-[#7F5D99]/40'
                                      : 'hover:bg-[#FAF6FD]/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <div className="w-6 h-6 rounded-full bg-[#FAF6FD] border border-[#7F5D99]/30 flex items-center justify-center text-[10px] font-bold text-[#4C2365] shrink-0">
                                      {lead.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="truncate">
                                      <div className="text-xs font-bold text-[#251A2D] truncate">
                                        {lead.fullName}
                                      </div>
                                      <div className="text-[10px] text-[#6B6172] truncate">
                                        {lead.designation || lead.roleLabel} {lead.branchName ? `• ${lead.branchName}` : '• Org-Wide'}
                                      </div>
                                    </div>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-[#7F5D99] shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-[#6B6172] mt-1">
                      Project lead coordinates team assignments, task dependencies, and milestone delivery.
                    </p>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SECTION 3: Planning & Tracking                                */}
              {/* ------------------------------------------------------------- */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E8DFED] pb-2">
                  <span className="w-2 h-2 rounded-full bg-[#7F5D99]" />
                  <h4 className="text-xs font-extrabold text-[#4C2365] uppercase tracking-wider">
                    3. Planning & Tracking
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Target End Date */}
                  <div>
                    <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                      Target End Date
                    </label>
                    <input
                      type="date"
                      value={targetEndDate}
                      onChange={(e) => setTargetEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]/40 focus:border-[#7F5D99] transition-all cursor-pointer"
                    />
                    <p className="text-[10px] text-[#6B6172] mt-1">
                      Completion milestone for calculating on-time task velocity.
                    </p>
                  </div>

                  {/* Project Status */}
                  <div>
                    <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                      Project Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]/40 focus:border-[#7F5D99] transition-all cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-[#6B6172] mt-1">
                      Current lifecycle stage of the project.
                    </p>
                  </div>

                  {/* Project Priority (Required) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-2">
                      Project Priority <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {PRIORITY_OPTIONS.map((p) => {
                        const isSelected = priority === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPriority(p.id)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? p.activeBg
                                : 'bg-white border-[#E8DFED] hover:bg-[#FAF6FD]/60'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${p.color} ${p.pulse && isSelected ? 'animate-pulse' : ''}`} />
                              <span className="text-xs font-bold">{p.label}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#E8DFED] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E8DFED] text-xs font-semibold text-[#6B6172] hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-glossy-primary px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Project...</span>
                    </>
                  ) : editingProject ? (
                    'Update Project'
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PROJECT DETAILS DRAWER / VIEW MODAL                                 */}
      {/* =================================================================== */}
      {viewingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E8DFED] overflow-hidden animate-modal-in p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {viewingProject.code && (
                    <span className="font-mono text-xs font-extrabold text-[#7F5D99] bg-[#FAF6FD] px-2 py-0.5 rounded-md border border-[#E8DFED]">
                      {viewingProject.code}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${
                      STATUS_OPTIONS.find((s) => s.id === viewingProject.status)?.badge || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {viewingProject.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#251A2D]">{viewingProject.name}</h3>
              </div>
              <button
                onClick={() => setViewingProject(null)}
                className="p-1.5 text-[#6B6172] hover:text-[#4C2365] hover:bg-[#FAF6FD] rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewingProject.description && (
              <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] text-xs text-[#251A2D] leading-relaxed">
                {viewingProject.description}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl border border-[#E8DFED] bg-white space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6172] block">
                  Project Lead
                </span>
                <span className="font-bold text-[#251A2D]">
                  {viewingProject.lead?.fullName || 'Not assigned'}
                </span>
                {viewingProject.lead?.email && (
                  <span className="text-[10px] text-[#6B6172] block truncate">
                    {viewingProject.lead.email}
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl border border-[#E8DFED] bg-white space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6172] block">
                  Associated Branch
                </span>
                <span className="font-bold text-[#251A2D]">
                  {viewingProject.branch ? viewingProject.branch.name : 'Organization-Wide'}
                </span>
                {viewingProject.branch?.code && (
                  <span className="text-[10px] text-[#6B6172] block">
                    Code: {viewingProject.branch.code}
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl border border-[#E8DFED] bg-white space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6172] block">
                  Priority
                </span>
                <span className="font-bold text-[#251A2D] capitalize">
                  {viewingProject.priority?.toLowerCase() || 'Medium'} Priority
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#E8DFED] bg-white space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6172] block">
                  Target End Date
                </span>
                <span className="font-bold text-[#251A2D]">
                  {viewingProject.targetEndDate
                    ? new Date(viewingProject.targetEndDate).toLocaleDateString()
                    : 'Open-ended'}
                </span>
              </div>
            </div>

            {/* Task Velocity Metrics */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8DFED] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#4C2365]">
                <span>Task Delivery Velocity</span>
                <span>{viewingProject.stats?.completionPercentage || 0}% Complete</span>
              </div>

              <div className="w-full bg-[#E8DFED] h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7F5D99] rounded-full progress-bar-smooth"
                  style={{ width: `${viewingProject.stats?.completionPercentage || 0}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-xs font-bold text-[#251A2D] block">
                    {viewingProject.stats?.totalTasks || 0}
                  </span>
                  <span className="text-[10px] text-[#6B6172]">Total</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-700 block">
                    {viewingProject.stats?.completedTasks || 0}
                  </span>
                  <span className="text-[10px] text-emerald-800">Done</span>
                </div>
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-xs font-bold text-[#4C2365] block">
                    {viewingProject.stats?.inProgressTasks || 0}
                  </span>
                  <span className="text-[10px] text-[#7F5D99]">Active</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-xs font-bold text-rose-700 block">
                    {viewingProject.stats?.overdueTasks || 0}
                  </span>
                  <span className="text-[10px] text-rose-800">Overdue</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setViewingProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6172] hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>

              <Link
                href={`/dashboard/tasks?projectId=${viewingProject.id}`}
                className="btn-glossy-primary px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Manage Project Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
