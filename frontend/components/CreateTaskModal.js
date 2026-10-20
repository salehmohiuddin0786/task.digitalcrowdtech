'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, AlertTriangle, CheckSquare } from 'lucide-react';
import { api } from '@/lib/api';

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [category, setCategory] = useState('');
  const [branchId, setBranchId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [requiresProof, setRequiresProof] = useState(false);
  const [proofType, setProofType] = useState('PHOTO');
  const [checklistItems, setChecklistItems] = useState(['']);
  const [branches, setBranches] = useState([]);
  const [members, setMembers] = useState([]);
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadBranchesAndMembers();
    }
  }, [isOpen]);

  const loadBranchesAndMembers = async () => {
    try {
      const [branchRes, memberRes] = await Promise.all([
        api.getBranches(),
        api.getMembers(),
      ]);
      if (branchRes.success) setBranches(branchRes.data || []);
      if (memberRes.success) setMembers(memberRes.data || []);
      if (branchRes.data?.[0]) setBranchId(branchRes.data[0].id);
    } catch (e) {
      console.error(e);
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
        category,
        branchId: branchId || undefined,
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
        setCategory('');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E8DFED] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-[#FAF6FD] border-b border-[#E8DFED] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#4C2365]">Create New Task</h3>
            <p className="text-xs text-[#6B6172]">
              Assign actionable work to branch staff with verification standards.
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

          {/* Row: Priority & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5">
                Target Branch
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: Category & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5">
                Category / Department
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Operations, Compliance, QA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
              />
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

          {/* Assignees Selection */}
          <div>
            <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5">
              Assign Staff Members
            </label>
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#7F5D99] text-white shadow-xs'
                          : 'bg-white border border-[#E8DFED] text-[#251A2D] hover:bg-[#F2EDF7]'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {m.user.fullName} ({m.role.label})
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Evidence Verification Switch */}
          <div className="p-3.5 rounded-2xl border border-[#E8DFED] bg-[#FAF6FD]/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#4C2365] block">
                Proof of Work Verification
              </span>
              <span className="text-[11px] text-[#6B6172]">
                Require photo or video evidence before task submission can be completed
              </span>
            </div>
            <div className="flex items-center gap-3">
              {requiresProof && (
                <select
                  value={proofType}
                  onChange={(e) => setProofType(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-[#C4A4DA] bg-white text-[#4C2365] font-semibold"
                >
                  <option value="PHOTO">Photo Proof</option>
                  <option value="VIDEO">Video Proof</option>
                  <option value="BOTH">Photo & Video</option>
                </select>
              )}
              <input
                type="checkbox"
                checked={requiresProof}
                onChange={(e) => setRequiresProof(e.target.checked)}
                className="w-4 h-4 text-[#7F5D99] rounded border-[#C4A4DA] focus:ring-[#7F5D99]"
              />
            </div>
          </div>

          {/* Checklist Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#251A2D] uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#7F5D99]" />
                Checklist Steps
              </label>
              <button
                type="button"
                onClick={handleAddChecklist}
                className="text-xs font-bold text-[#7F5D99] hover:text-[#4C2365] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Step
              </button>
            </div>
            <div className="space-y-2">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-[#9E7EB5] font-bold w-4 text-center">{idx + 1}.</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleChecklistChange(idx, e.target.value)}
                    placeholder={`Step ${idx + 1} item...`}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#E8DFED] text-xs text-[#251A2D] focus:outline-hidden focus:ring-1 focus:ring-[#7F5D99]"
                  />
                  {checklistItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklist(idx)}
                      className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E8DFED] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E8DFED] text-xs font-semibold text-[#6B6172] hover:bg-[#F2EDF7] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {loading ? 'Creating Task...' : 'Create & Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
