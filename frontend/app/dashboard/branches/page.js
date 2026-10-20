'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function BranchesPage() {
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

  const { role } = useAuth();
  const canManage = role === 'OWNER' || role === 'SUPER_ADMIN';

  const loadBranches = async () => {
    setLoading(true);
    try {
      const [branchRes, usageRes] = await Promise.all([
        api.getBranches(),
        api.getTenantUsage(),
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

  return (
    <div className="space-y-6">
      {/* Header & Limits Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight">
            Branch Locations & Stores
          </h2>
          <p className="text-xs text-[#6B6172] mt-0.5">
            Manage your stores, offices, and regional service hubs.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </button>
        )}
      </div>

      {/* Usage Capacity Bar */}
      {usage && (
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

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((b) => (
          <div
            key={b.id}
            className={`p-6 rounded-3xl bg-white border shadow-xs space-y-4 transition-all hover:border-[#9E7EB5] ${
              !b.isActive ? 'opacity-60 border-gray-200' : 'border-[#E8DFED]'
            }`}
          >
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

            <div className="pt-4 border-t border-[#E8DFED] grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-[#FAF6FD]">
                <div className="text-xs font-bold text-[#4C2365]">{b._count?.members || 0}</div>
                <div className="text-[10px] text-[#6B6172]">Staff Members</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF6FD]">
                <div className="text-xs font-bold text-[#4C2365]">{b._count?.tasks || 0}</div>
                <div className="text-[10px] text-[#6B6172]">Active Tasks</div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                  placeholder="e.g. Jubilee Hills Flagship Store"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. HYD-02"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Hyderabad"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Telangana"
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
                    placeholder="e.g. 500033"
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
                  placeholder="Plot No. 42, Road No. 36, Jubilee Hills..."
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
