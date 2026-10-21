'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Building2,
  Plus,
  MapPin,
  Users,
  CheckSquare,
  X,
  AlertCircle,
  Power,
  Trash2,
  ShieldCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lock,
  FolderGit2,
  Layers,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function BranchesPage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab') || 'branches';
  const isSupervisionTab = currentTab === 'supervision';

  const [branches, setBranches] = useState([]);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');

  const { role, user } = useAuth();
  const isOwnerOrAdmin = role === 'OWNER' || role === 'COMPANY_ADMIN';
  const canManage = isOwnerOrAdmin || role === 'SUPER_ADMIN';

  const loadBranches = async () => {
    setLoading(true);
    try {
      const [branchRes, usageRes] = await Promise.all([
        api.getBranches(),
        api.getTenantUsage().catch(() => ({ success: false })),
      ]);
      if (branchRes.success) setBranches(branchRes.data || []);
      if (usageRes.success) setUsage(usageRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.createBranch({
        name,
        code,
        city,
        state,
        country,
        pincode,
        address,
      });

      if (res.success) {
        setIsModalOpen(false);
        setName('');
        setCode('');
        setCity('');
        setState('');
        setPincode('');
        setAddress('');
        loadBranches();
      }
    } catch (err) {
      setError(err.message || 'Failed to create branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (branch) => {
    if (!confirm(`Are you sure you want to ${branch.isActive ? 'deactivate' : 'activate'} ${branch.name}?`)) return;
    try {
      await api.updateBranch(branch.id, { isActive: !branch.isActive });
      loadBranches();
    } catch (err) {
      alert(err.message || 'Failed to update branch status');
    }
  };

  // Guard for Branch Supervision & Approvals
  if (isSupervisionTab && !isOwnerOrAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-white border border-[#E8DFED] text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#251A2D]">Access Restricted</h3>
        <p className="text-xs text-[#6B6172]">
          Branch Supervision & Operational Approvals are reserved exclusively for Company Owners and Company Admins.
        </p>
        <Link
          href="/dashboard/branches"
          className="inline-flex px-4 py-2 rounded-xl bg-[#7F5D99] text-white text-xs font-bold"
        >
          Return to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight flex items-center gap-2">
            {isSupervisionTab ? (
              <>
                <ShieldCheck className="w-6 h-6 text-[#7F5D99]" />
                Branch Supervision & Approvals
              </>
            ) : (
              <>
                <Building2 className="w-6 h-6 text-[#7F5D99]" />
                Project Locations & Branches
              </>
            )}
          </h2>
          <p className="text-xs text-[#6B6172] mt-0.5">
            {isSupervisionTab
              ? 'Authorized supervision console: inspect operational readiness, supervisor sign-offs, and compliance.'
              : 'Real-time project completion tracking derived from verified task lifecycle statuses.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isOwnerOrAdmin && (
            <div className="flex items-center bg-white rounded-xl border border-[#E8DFED] p-1 shadow-2xs">
              <Link
                href="/dashboard/branches"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isSupervisionTab
                    ? 'bg-[#7F5D99] text-white'
                    : 'text-[#6B6172] hover:text-[#4C2365]'
                }`}
              >
                Projects & Locations
              </Link>
              <Link
                href="/dashboard/branches?tab=supervision"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSupervisionTab
                    ? 'bg-[#7F5D99] text-white'
                    : 'text-[#6B6172] hover:text-[#4C2365]'
                }`}
              >
                Supervision & Approvals
              </Link>
            </div>
          )}

          {canManage && !isSupervisionTab && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Branch
            </button>
          )}
        </div>
      </div>

      {/* Usage Capacity Bar */}
      {usage && !isSupervisionTab && (
        <div className="p-4 rounded-2xl bg-white border border-[#E8DFED] flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF6FD] text-[#4C2365] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#251A2D]">
                Branch Capacity ({usage.branches.current} / {usage.branches.max} Allocated)
              </span>
              <p className="text-[11px] text-[#6B6172]">
                Plan tier: <span className="font-semibold text-[#7F5D99] uppercase">{usage.planTier}</span>
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-xs">
            <div className="w-full bg-[#E8DFED] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usage.branches.isLimitReached ? 'bg-[#B42318]' : 'bg-[#7F5D99]'
                }`}
                style={{
                  width: `${Math.min(100, (usage.branches.current / usage.branches.max) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Standard Projects / Branches with Dynamic Progress Updates */}
      {!isSupervisionTab && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((b) => {
            const stats = b.stats || {
              totalTasks: b._count?.tasks || 0,
              eligibleTasks: b._count?.tasks || 0,
              completedTasks: 0,
              inProgressTasks: 0,
              pendingTasks: b._count?.tasks || 0,
              overdueTasks: 0,
              completionPercentage: 0,
            };

            const hasTasks = stats.eligibleTasks > 0;
            const completionPct = stats.completionPercentage || 0;

            return (
              <div
                key={b.id}
                className={`p-6 rounded-3xl bg-white border shadow-xs space-y-4 transition-all hover:border-[#9E7EB5] flex flex-col justify-between ${
                  !b.isActive ? 'opacity-60 border-gray-200' : 'border-[#E8DFED]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#FAF6FD] text-[#7F5D99] rounded-lg border border-[#E8DFED]">
                        {b.code || 'LOC'}
                      </span>
                      {canManage && (
                        <button
                          onClick={() => handleToggleStatus(b)}
                          title={b.isActive ? 'Deactivate branch' : 'Activate branch'}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                            b.isActive
                              ? 'text-[#237A4B] hover:bg-emerald-50 border-emerald-200'
                              : 'text-gray-400 hover:bg-gray-100 border-gray-200'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#251A2D] flex items-center gap-2">
                      {b.name}
                      {!b.isActive && (
                        <span className="text-[10px] text-gray-500 font-semibold px-2 py-0.5 rounded bg-gray-100">
                          Inactive
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#6B6172] flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#9E7EB5] shrink-0" />
                      <span>
                        {b.city ? `${b.city}, ` : ''}{b.state ? `${b.state}, ` : ''}{b.country}
                      </span>
                    </p>
                    {b.address && <p className="text-[11px] text-[#6B6172] mt-1 line-clamp-1">{b.address}</p>}
                  </div>

                  {/* Project Completion Progress Bar (Formula: completed / eligible * 100) */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#4C2365] flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#7F5D99]" />
                        Project Progress
                      </span>
                      {hasTasks ? (
                        <span className="text-xs font-extrabold text-[#7F5D99] font-mono">
                          {completionPct}% Complete
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-[#6B6172] px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200">
                          No tasks yet
                        </span>
                      )}
                    </div>

                    {hasTasks ? (
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

                        {/* Breakdown Chips */}
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
                        Not started. Create tasks for this branch to calculate completion velocity.
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer metrics & direct links to tasks and projects */}
                <div className="pt-3 border-t border-[#E8DFED] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#6B6172]">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#9E7EB5]" />
                      <span>{b._count?.members || 0} Staff</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#9E7EB5]" />
                      <span>{b._count?.teams || 0} Teams</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Link
                      href={`/dashboard/projects?branchId=${b.id}`}
                      className="text-xs font-semibold text-[#7F5D99] hover:underline flex items-center gap-1"
                    >
                      <FolderGit2 className="w-3.5 h-3.5" />
                      <span>Branch Projects</span>
                    </Link>

                    <Link
                      href={`/dashboard/tasks?branchId=${b.id}`}
                      className="text-xs font-bold text-[#4C2365] hover:text-[#7F5D99] flex items-center gap-1"
                    >
                      <span>Tasks ({stats.totalTasks})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Branch Supervision & Approvals Module (Strictly for OWNER & COMPANY_ADMIN) */}
      {isSupervisionTab && isOwnerOrAdmin && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[#4C2365] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#7F5D99]" />
                Supervision & Executive Sign-off Matrix
              </h3>
              <p className="text-xs text-[#6B6172] mt-0.5">
                Audit and supervise branch operations, verified evidence approvals, and team coverage.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#4C2365]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Full Executive Authority Granted</span>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-[#E8DFED] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6FD] border-b border-[#E8DFED] text-[#4C2365] uppercase font-bold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Branch Location</th>
                    <th className="py-3.5 px-4">City / Region</th>
                    <th className="py-3.5 px-4">Staff Assigned</th>
                    <th className="py-3.5 px-4">Eligible Tasks</th>
                    <th className="py-3.5 px-4">Completion %</th>
                    <th className="py-3.5 px-4">Operational Status</th>
                    <th className="py-3.5 px-4 text-right">Supervision Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFED]">
                  {branches.map((b) => {
                    const stats = b.stats || {
                      eligibleTasks: b._count?.tasks || 0,
                      completedTasks: 0,
                      completionPercentage: 0,
                      overdueTasks: 0,
                    };

                    return (
                      <tr key={b.id} className="hover:bg-[#FAF6FD]/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#251A2D]">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#7F5D99]" />
                            <span>{b.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#6B6172]">{b.city || 'Headquarters'}</td>
                        <td className="py-3.5 px-4 font-medium text-[#251A2D]">{b._count?.members || 0}</td>
                        <td className="py-3.5 px-4 text-[#6B6172]">{stats.eligibleTasks}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#7F5D99]">
                              {stats.completionPercentage}%
                            </span>
                            <div className="w-16 bg-[#E8DFED] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#7F5D99] rounded-full"
                                style={{ width: `${stats.completionPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {b.isActive ? 'ACTIVE & SUPERVISED' : 'DEACTIVATED'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/tasks?branchId=${b.id}`}
                              className="px-2.5 py-1 rounded-lg border border-[#E8DFED] text-xs font-semibold text-[#4C2365] hover:bg-white"
                            >
                              Audit Tasks
                            </Link>
                            <button
                              onClick={() => handleToggleStatus(b)}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF6FD] hover:bg-[#7F5D99] hover:text-white text-xs font-semibold text-[#7F5D99] transition-colors cursor-pointer"
                            >
                              {b.isActive ? 'Suspend' : 'Reinstate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Branch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E8DFED] overflow-hidden">
            <div className="px-6 py-4 bg-[#FAF6FD] border-b border-[#E8DFED] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#4C2365]">Add New Branch Location</h3>
                <p className="text-xs text-[#6B6172]">Set up a physical store, warehouse, or regional hub.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="p-6 space-y-3.5">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Connaught Place Hub"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                    Store Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. DEL-CP-01"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. New Delhi"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Delhi"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 110001"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Full Street Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Street, Landmark, Sector..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                />
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
                  {isSubmitting ? 'Creating...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
