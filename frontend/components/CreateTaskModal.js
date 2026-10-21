'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, AlertTriangle, CheckSquare, Users2, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated }) {
  const { user, role, can } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [requiresProof, setRequiresProof] = useState(false);
  const [proofType, setProofType] = useState('PHOTO');
  const [checklistItems, setChecklistItems] = useState(['']);
  const [branches, setBranches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Is current user a Team Lead
  const isLead = role === 'TEAM_LEADER' || role === 'TEAM_LEAD';

  useEffect(() => {
    if (isOpen && can('tasks.create')) {
      loadInitialData();
    }
  }, [isOpen, can]);

  const loadInitialData = async () => {
    try {
      const branchPromise = api.getBranches().catch(() => ({ success: false, data: [] }));
      const teamPromise = api.getTeams().catch(() => ({ success: false, data: [] }));
      const categoryPromise = api.getTaskCategories().catch(() => ({
        success: true,
        data: ['Operations', 'Engineering', 'Customer Support', 'Design', 'Marketing', 'Finance', 'Quality Assurance'],
      }));
      const memberPromise = can('members.view')
        ? api.getMembers().catch(() => ({ success: false, data: [] }))
        : Promise.resolve({ success: true, data: [] });

      const [branchRes, teamRes, catRes, memberRes] = await Promise.all([
        branchPromise,
        teamPromise,
        categoryPromise,
        memberPromise,
      ]);

      if (branchRes.success) {
        setBranches(branchRes.data || []);
        if (branchRes.data?.[0] && !isLead) setBranchId(branchRes.data[0].id);
      }
      if (teamRes.success) {
        setTeams(teamRes.data || []);
        if (teamRes.data?.[0]) {
          setTeamId(teamRes.data[0].id);
          if (teamRes.data[0].branchId) {
            setBranchId(teamRes.data[0].branchId);
          }
        }
      }
      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
        if (catRes.data[0]) setCategory(catRes.data[0]);
      }
      if (memberRes.success) setMembers(memberRes.data || []);
    } catch (e) {
      // Graceful fallback
    }
  };

  const handleTeamChange = (selectedTeamId) => {
    setTeamId(selectedTeamId);
    const selectedTeam = teams.find((t) => t.id === selectedTeamId);
    if (selectedTeam?.branchId) {
      setBranchId(selectedTeam.branchId);
    }
  };

  const handleAddChecklist = () => {
    setChecklistItems([...checklistItems, '']);
  };

  const handleRemoveChecklist = (index) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleChecklistChange = (index, value) => {
    const updated = [...checklistItems];
    updated[index] = value;
    setChecklistItems(updated);
  };

  const toggleAssignee = (userId) => {
    setAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAddNewCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const trimmed = newCategoryName.trim();
    if (!categories.includes(trimmed)) {
      setCategories([...categories, trimmed].sort());
    }
    setCategory(trimmed);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const filteredChecklists = checklistItems.filter((item) => item.trim().length > 0);
      const res = await api.createTask({
        title,
        description,
        priority,
        category: category || undefined,
        branchId: isLead ? undefined : branchId || undefined,
        teamId: teamId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        requiresProof,
        proofType: requiresProof ? proofType : undefined,
        assigneeIds,
        checklistItems: filteredChecklists,
      });

      if (res.success) {
        onTaskCreated?.(res.data);
        onClose();
        // Reset form
        setTitle('');
        setDescription('');
        setPriority('NORMAL');
        setCategory(categories[0] || '');
        setDueDate('');
        setRequiresProof(false);
        setChecklistItems(['']);
        setAssigneeIds([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !can('tasks.create')) return null;

  // Selected team object
  const activeTeam = teams.find((t) => t.id === teamId);
  const derivedBranch = branches.find((b) => b.id === (activeTeam?.branchId || branchId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E8DFED] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-[#FAF6FD] border-b border-[#E8DFED] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#4C2365]">
              {isLead ? 'Lead Portal — Assign Team Task' : 'Create New Task'}
            </h3>
            <p className="text-xs text-[#6B6172]">
              {isLead
                ? 'Assign work to your operational team with branch context auto-derived.'
                : 'Assign actionable work to branch staff with verification standards.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B6172] hover:text-[#4C2365] hover:bg-[#F2EDF7] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Conduct daily inventory count and sync billing logs"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99] focus:border-[#7F5D99]"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5">
              Description & SOP Guidelines
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detailed instructions for the assigned team member..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99] focus:border-[#7F5D99]"
            />
          </div>

          {/* Team Assignment & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users2 className="w-3.5 h-3.5 text-[#7F5D99]" />
                Assigned Team *
              </label>
              <select
                value={teamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
              >
                <option value="">Select Team (General Task)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.branch?.name ? `(${t.branch.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Branch Section: REMOVED for Lead, auto-derived banner shown */}
          {isLead ? (
            <div className="p-3 rounded-xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#4C2365]">
                <Building2 className="w-4 h-4 text-[#7F5D99]" />
                <span className="font-semibold">Associated Branch:</span>
                <span className="font-bold text-[#251A2D]">
                  {derivedBranch ? derivedBranch.name : 'Auto-derived from team context'}
                </span>
              </div>
              <span className="text-[10px] text-[#6B6172] font-mono px-2 py-0.5 rounded bg-white border border-[#E8DFED]">
                Enforced
              </span>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5">
                Target Branch
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
              >
                <option value="">Headquarters / No Specific Branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code || 'LOC'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Row: Dynamic Category Dropdown & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider">
                  Category / Department *
                </label>
                {(role === 'OWNER' || role === 'COMPANY_ADMIN' || role === 'SUPER_ADMIN') && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                    className="text-[11px] font-semibold text-[#7F5D99] hover:underline cursor-pointer"
                  >
                    {isAddingCategory ? 'Select Existing' : '+ Custom'}
                  </button>
                )}
              </div>

              {isAddingCategory ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="px-3 py-2 rounded-xl bg-[#7F5D99] text-white text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
                >
                  <option value="">Select Category / Department</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5">
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
              />
            </div>
          </div>

          {/* Assignees Selection (Individual override / addition) */}
          {can('tasks.assign') && can('members.view') && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider">
                  Staff Members (Optional Individual Assignment)
                </label>
                <span className="text-[11px] text-[#6B6172]">
                  {assigneeIds.length === 0 && teamId
                    ? 'Default: All active team members'
                    : `${assigneeIds.length} individually selected`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 p-2.5 rounded-xl border border-[#E8DFED] max-h-32 overflow-y-auto bg-[#FAF6FD]/40">
                {members.length === 0 ? (
                  <span className="text-xs text-[#6B6172]">No members available to assign</span>
                ) : (
                  members.map((m) => {
                    const isSelected = assigneeIds.includes(m.user.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => toggleAssignee(m.user.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#7F5D99] text-white border-[#7F5D99] shadow-xs'
                            : 'bg-white text-[#251A2D] border-[#E8DFED] hover:border-[#7F5D99]'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>{m.user.fullName}</span>
                        {m.designation && <span className="opacity-75">({m.designation})</span>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Proof of Work Checklist */}
          <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#251A2D] block">Require Proof of Execution</span>
                <span className="text-[11px] text-[#6B6172]">
                  Employee must upload evidence before submitting for supervisor review.
                </span>
              </div>
              <input
                type="checkbox"
                checked={requiresProof}
                onChange={(e) => setRequiresProof(e.target.checked)}
                className="w-4 h-4 text-[#7F5D99] rounded border-gray-300 focus:ring-[#7F5D99] cursor-pointer"
              />
            </div>

            {requiresProof && (
              <div className="pt-2 border-t border-[#E8DFED] flex items-center gap-4">
                <span className="text-xs font-medium text-[#251A2D]">Verification Type:</span>
                {['PHOTO', 'VIDEO', 'BOTH'].map((type) => (
                  <label key={type} className="flex items-center gap-1.5 text-xs text-[#6B6172] cursor-pointer">
                    <input
                      type="radio"
                      name="proofType"
                      value={type}
                      checked={proofType === type}
                      onChange={(e) => setProofType(e.target.value)}
                      className="text-[#7F5D99] focus:ring-[#7F5D99]"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Checklist Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#251A2D] uppercase tracking-wider">
                Step-by-Step SOP Checklist
              </label>
              <button
                type="button"
                onClick={handleAddChecklist}
                className="text-xs font-bold text-[#7F5D99] hover:text-[#4C2365] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#9E7EB5] shrink-0" />
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleChecklistChange(index, e.target.value)}
                    placeholder={`Step ${index + 1}...`}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
                  />
                  {checklistItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklist(index)}
                      className="p-1.5 text-[#6B6172] hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#E8DFED] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E8DFED] text-xs font-semibold text-[#6B6172] hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Task...</span>
                </>
              ) : (
                <span>Publish Task</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
