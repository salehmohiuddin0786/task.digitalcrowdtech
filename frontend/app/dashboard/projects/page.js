'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  MoreVertical,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ProjectsPage() {
  const { user, role, can } = useAuth();
  const [projects, setProjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('');

  // Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [branchId, setBranchId] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canManageProjects = role === 'OWNER' || role === 'COMPANY_ADMIN' || can('branches.manage');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (branchFilter) params.branchId = branchFilter;

      const [projectsRes, branchesRes] = await Promise.all([
        api.getProjects(params),
        api.getBranches().catch(() => ({ success: false, data: [] })),
      ]);

      if (projectsRes.success) {
        setProjects(projectsRes.data || []);
      }
      if (branchesRes.success) {
        setBranches(branchesRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, branchFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setCode('');
    setDescription('');
    setBranchId('');
    setTargetEndDate('');
    setStatus('ACTIVE');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (proj) => {
    setEditingProject(proj);
    setName(proj.name);
    setCode(proj.code || '');
    setDescription(proj.description || '');
    setBranchId(proj.branchId || '');
    setTargetEndDate(proj.targetEndDate ? proj.targetEndDate.split('T')[0] : '');
    setStatus(proj.status || 'ACTIVE');
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      if (editingProject) {
        await api.updateProject(editingProject.id, {
          name,
          code: code || null,
          description: description || null,
          branchId: branchId || null,
          targetEndDate: targetEndDate ? new Date(targetEndDate).toISOString() : null,
          status,
        });
      } else {
        await api.createProject({
          name,
          code: code || null,
          description: description || null,
          branchId: branchId || null,
          targetEndDate: targetEndDate ? new Date(targetEndDate).toISOString() : null,
          status,
        });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save project');
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
        status: isArchived ? 'ACTIVE' : 'ARCHIVED',
      });
      loadData();
    } catch (err) {
      alert(err.message || `Failed to ${actionText} project`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-[#7F5D99]" />
            Project Management
          </h2>
          <p className="text-xs text-[#6B6172] mt-0.5">
            Organize multi-task work streams, track completion velocity, and align deliverables with branches.
          </p>
        </div>

        {canManageProjects && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8DFED] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#6B6172] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, code, or description..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:outline-hidden"
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
        <div className="p-12 text-center text-xs text-[#6B6172] font-semibold">
          Loading organizational projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E8DFED] space-y-3">
          <FolderGit2 className="w-12 h-12 text-[#9E7EB5] mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-[#251A2D]">No projects found</h3>
          <p className="text-xs text-[#6B6172] max-w-sm mx-auto">
            Get started by creating your organization's first project to link tasks, deadlines, and branch hubs.
          </p>
          {canManageProjects && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-[#7F5D99] text-white text-xs font-bold shadow-xs hover:bg-[#4C2365] cursor-pointer"
            >
              + Create First Project
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

            return (
              <div
                key={proj.id}
                className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4 hover:border-[#9E7EB5] hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365] group-hover:scale-105 transition-transform">
                      <FolderGit2 className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {proj.code && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FAF6FD] text-[#7F5D99] rounded border border-[#E8DFED]">
                          {proj.code}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          proj.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : proj.status === 'ON_HOLD'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : proj.status === 'ARCHIVED'
                            ? 'bg-gray-100 text-gray-600 border border-gray-200'
                            : 'bg-purple-50 text-[#4C2365] border border-purple-200'
                        }`}
                      >
                        {proj.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#251A2D] group-hover:text-[#4C2365] transition-colors">
                      {proj.name}
                    </h3>
                    {proj.description && (
                      <p className="text-xs text-[#6B6172] mt-1 line-clamp-2">{proj.description}</p>
                    )}
                  </div>

                  {/* Branch & Deadline Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6172] pt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#9E7EB5]" />
                      <span>{proj.branch ? proj.branch.name : 'Organization-Wide'}</span>
                    </span>
                    {proj.targetEndDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#9E7EB5]" />
                        <span>Due {new Date(proj.targetEndDate).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>

                  {/* Dynamic Progress Metric & Bar */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#4C2365] flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#7F5D99]" />
                        Progress
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
                            className={`h-full rounded-full transition-all duration-300 ${
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
                            {stats.inProgressTasks} In Progress
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
                        Not started. Assign tasks to this project to track delivery speed.
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-[#E8DFED] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {canManageProjects && (
                      <>
                        <button
                          onClick={() => openEditModal(proj)}
                          className="p-1.5 text-[#6B6172] hover:text-[#4C2365] rounded-lg hover:bg-[#FAF6FD] cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleArchiveProject(proj)}
                          className="p-1.5 text-[#6B6172] hover:text-rose-600 rounded-lg hover:bg-[#FAF6FD] cursor-pointer"
                          title={proj.status === 'ARCHIVED' ? 'Restore Project' : 'Archive Project'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/tasks?projectId=${proj.id}`}
                    className="text-xs font-bold text-[#7F5D99] hover:text-[#4C2365] flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Tasks ({stats.totalTasks})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E8DFED] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#FAF6FD] border-b border-[#E8DFED] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#4C2365]">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h3>
                <p className="text-xs text-[#6B6172]">Set deliverables, timelines, and branch scope.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-6 space-y-3.5">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q4 Regional Store Audits & Compliance"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                    Project Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. PRJ-2026-01"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                    Associated Branch
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:ring-2 focus:ring-[#7F5D99]"
                  >
                    <option value="">Organization-Wide (No Branch)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code || 'LOC'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Project Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Goals, deliverables, and operational guidelines..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                    Target End Date
                  </label>
                  <input
                    type="date"
                    value={targetEndDate}
                    onChange={(e) => setTargetEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                    Project Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:ring-2 focus:ring-[#7F5D99]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ON_HOLD">ON_HOLD</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8DFED] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8DFED] text-xs font-semibold text-[#6B6172] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
