'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Repeat,
  Plus,
  Play,
  Calendar,
  Clock,
  Building2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import PriorityBadge from '@/components/PriorityBadge';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function RecurrencePage() {
  const { user, role } = useAuth();
  const [rules, setRules] = useState([]);
  const [branches, setBranches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    titleTemplate: '',
    description: '',
    frequency: 'DAILY',
    intervalDays: 1,
    priority: 'NORMAL',
    branchId: '',
    teamId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, branchesRes, teamsRes] = await Promise.all([
        api.getRecurrenceRules(),
        api.getBranches().catch(() => ({ data: [] })),
        api.getTeams().catch(() => ({ data: [] })),
      ]);

      if (rulesRes.success && rulesRes.data) {
        setRules(rulesRes.data);
      }
      if (branchesRes.success && branchesRes.data) {
        setBranches(branchesRes.data);
      }
      if (teamsRes.success && teamsRes.data) {
        setTeams(teamsRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!formData.titleTemplate.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.createRecurrenceRule(formData);
      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          titleTemplate: '',
          description: '',
          frequency: 'DAILY',
          intervalDays: 1,
          priority: 'NORMAL',
          branchId: '',
          teamId: '',
        });
        await loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to create recurrence schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this recurrence schedule?')) return;
    try {
      await api.deleteRecurrenceRule(ruleId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete recurrence schedule');
    }
  };

  const handleTriggerRun = async () => {
    setGenerating(true);
    try {
      const res = await api.generateRecurringTasks(true);
      if (res.success) {
        alert(
          `Success: ${res.data.tasksGenerated} recurring task instances generated from active schedules!`
        );
        await loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to trigger scheduled run');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8DFED]">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/tasks"
            className="p-2 rounded-xl bg-white border border-[#E8DFED] text-[#7F5D99] hover:bg-[#FAF6FD] transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight flex items-center gap-2">
              <Repeat className="w-6 h-6 text-[#7F5D99]" />
              Recurring Task Schedules
            </h1>
            <p className="text-xs text-[#6B6172] mt-0.5">
              Automated recurring work schedules (Daily, Weekdays, Weekly, Monthly) for operational checklists.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerRun}
            disabled={generating}
            className="px-3.5 py-2 rounded-xl border border-[#E8DFED] bg-white text-xs font-bold text-[#7F5D99] hover:bg-[#FAF6FD] flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-[#C4A4DA]" />
            {generating ? 'Processing...' : 'Run Schedules Now'}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Schedule
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="rounded-3xl bg-white border border-[#E8DFED] overflow-hidden shadow-xs divide-y divide-[#E8DFED]">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#6B6172]">
            Loading recurrence schedules...
          </div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center">
            <Repeat className="w-10 h-10 text-[#C4A4DA] mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-[#251A2D]">No recurring schedules configured</p>
            <p className="text-xs text-[#6B6172] mt-1">
              Automate opening checklists, sanitization sweeps, and recurring maintenance tasks.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7F5D99] text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create First Schedule
            </button>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF6FD]/60 transition-colors group"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#4C2365] text-white">
                    {rule.frequency}
                  </span>
                  <PriorityBadge priority={rule.priority} />
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      rule.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {rule.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#251A2D] truncate">
                  {rule.titleTemplate}
                </h3>

                {rule.description && (
                  <p className="text-xs text-[#6B6172] line-clamp-1">{rule.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-[#6B6172] pt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#7F5D99]" />
                    Next Run:{' '}
                    {rule.nextRunAt
                      ? new Date(rule.nextRunAt).toLocaleDateString()
                      : 'Scheduled'}
                  </span>
                  <span className="text-[#9E7EB5] font-semibold">
                    {rule._count?.tasks || 0} instances spawned
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-center shrink-0">
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-2 text-[#6B6172] hover:text-rose-600 transition-colors cursor-pointer"
                  title="Delete schedule"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Recurrence Rule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#E8DFED] shadow-xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAF6FD] text-[#7F5D99]">
                  <Repeat className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#4C2365]">New Recurring Task Schedule</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#6B6172] hover:bg-[#FAF6FD] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4C2365] mb-1">
                  Task Title Template *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titleTemplate}
                  onChange={(e) =>
                    setFormData({ ...formData, titleTemplate: e.target.value })
                  }
                  placeholder="e.g. Daily Fridge Temperature & Sanitization Log"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E8DFED] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4C2365] mb-1">
                    Frequency *
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8DFED] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
                  >
                    <option value="DAILY">Every Day</option>
                    <option value="WEEKDAYS">Every Weekday (Mon-Fri)</option>
                    <option value="WEEKLY">Every Week</option>
                    <option value="MONTHLY">Every Month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4C2365] mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8DFED] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4C2365] mb-1">
                  Standard Instructions / Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="SOP details, temperature thresholds, checklist steps..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E8DFED] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#4C2365] mb-1">Branch</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8DFED] bg-white focus:outline-hidden"
                  >
                    <option value="">Global / HQ</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4C2365] mb-1">Team</label>
                  <select
                    value={formData.teamId}
                    onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8DFED] bg-white focus:outline-hidden"
                  >
                    <option value="">All Teams</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8DFED]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6172] hover:bg-[#FAF6FD] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {submitting ? 'Creating...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
