'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCircle,
  Mail,
  Building2,
  Plus,
  Send,
  X,
  AlertCircle,
  Copy,
  Check,
  Shield,
  Trash2,
  Clock,
  UserCheck,
  Edit2,
  Lock,
  Power,
  Calendar,
  Search,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function EmployeesPage() {
  const { role: userRole, user, tenant } = useAuth();
  const isPlatformAdmin = Boolean(user?.isPlatformAdmin || userRole === 'SUPER_ADMIN');
  const isSupportAdmin = userRole === 'SUPPORT_ADMIN';
  const isBillingAdmin = userRole === 'BILLING_ADMIN';
  const isHrAdmin = userRole === 'HR_ADMIN' || userRole === 'HR';
  const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'COMPANY_ADMIN';
  const canManage = isOwnerOrAdmin || isPlatformAdmin || isHrAdmin;

  // General state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // -----------------------------------------------------------------
  // SUPERADMIN: Company and Subscription Management State
  // -----------------------------------------------------------------
  const [companies, setCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [companyStatusFilter, setCompanyStatusFilter] = useState('ALL');

  // Superadmin Action Modals
  const [suspendModalCompany, setSuspendModalCompany] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isSuspending, setIsSuspending] = useState(false);

  const [extendModalCompany, setExtendModalCompany] = useState(null);
  const [extensionDays, setExtensionDays] = useState(14);
  const [extensionReason, setExtensionReason] = useState('');
  const [isExtending, setIsExtending] = useState(false);

  // -----------------------------------------------------------------
  // TENANT PORTAL: Employee Directory & Invitations State
  // -----------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'invitations'
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [usage, setUsage] = useState(null);

  // Tenant Invite modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviteBranchId, setInviteBranchId] = useState('');
  const [inviteDesignation, setInviteDesignation] = useState('');

  // Tenant Edit Member Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editBranchId, setEditBranchId] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editRoleId, setEditRoleId] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editSaving, setEditSaving] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isPlatformAdmin) {
        // Superadmin: Load Organization Companies & Subscription Directory ONLY
        const res = await api.getSuperadminCompanies();
        if (res.success && res.data) {
          setCompanies(res.data);
        }
      } else {
        // Tenant Members & Invitations for Organization Roles
        const [memberRes, inviteRes, roleRes, branchRes, usageRes] = await Promise.all([
          api.getMembers(),
          canManage ? api.getInvitations().catch(() => ({ success: true, data: [] })) : Promise.resolve({ success: true, data: [] }),
          api.getRoles().catch(() => ({ success: true, data: [] })),
          api.getBranches().catch(() => ({ success: true, data: [] })),
          api.getTenantUsage().catch(() => ({ success: false })),
        ]);

        if (memberRes.success) setMembers(memberRes.data || []);
        if (inviteRes.success) setInvitations(inviteRes.data || []);
        if (roleRes.success) {
          setRoles(roleRes.data || []);
          if (roleRes.data?.[0]) setInviteRoleId(roleRes.data[0].id);
        }
        if (branchRes.success) setBranches(branchRes.data || []);
        if (usageRes.success) setUsage(usageRes.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load directory data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isPlatformAdmin]);

  // -----------------------------------------------------------------
  // Superadmin Actions
  // -----------------------------------------------------------------
  const handleConfirmSuspension = async () => {
    if (!suspendModalCompany) return;
    const targetSuspension = !suspendModalCompany.isSuspended;
    if (targetSuspension && !suspensionReason.trim()) {
      alert('Please provide a reason for company suspension.');
      return;
    }

    setIsSuspending(true);
    try {
      const res = await api.updateCompanyStatus(suspendModalCompany.id, {
        isSuspended: targetSuspension,
        reason: suspensionReason.trim() || undefined,
      });

      if (res.success) {
        setSuspendModalCompany(null);
        setSuspensionReason('');
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update company suspension status');
    } finally {
      setIsSuspending(false);
    }
  };

  const handleConfirmExtendTrial = async () => {
    if (!extendModalCompany) return;
    const parsedDays = parseInt(extensionDays, 10);
    if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 90) {
      alert('Please specify a valid number of days between 1 and 90.');
      return;
    }

    setIsExtending(true);
    try {
      const res = await api.extendCompanyTrial(extendModalCompany.id, {
        days: parsedDays,
        reason: extensionReason.trim() || 'Superadmin administrative trial extension',
      });

      if (res.success) {
        setExtendModalCompany(null);
        setExtensionDays(14);
        setExtensionReason('');
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to extend free trial');
    } finally {
      setIsExtending(false);
    }
  };

  // -----------------------------------------------------------------
  // Tenant Member Actions
  // -----------------------------------------------------------------
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteRoleId) return;

    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.createInvitation({
        email: inviteEmail,
        roleId: inviteRoleId,
        branchId: inviteBranchId || undefined,
        designation: inviteDesignation || undefined,
      });

      if (res.success) {
        setIsInviteModalOpen(false);
        setInviteEmail('');
        setInviteDesignation('');
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setEditBranchId(member.branchId || '');
    setEditDesignation(member.designation || '');
    setEditRoleId(member.roleId || '');
    setEditStatus(member.status || 'ACTIVE');
    setIsEditModalOpen(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    setEditSaving(true);
    setError('');
    try {
      const res = await api.updateMember(editingMember.id, {
        branchId: editBranchId || null,
        designation: editDesignation || null,
        roleId: editRoleId || undefined,
        status: editStatus,
      });
      if (res.success) {
        setIsEditModalOpen(false);
        setEditingMember(null);
        loadData();
      }
    } catch (err) {
      setError(err.message || 'Failed to update member');
    } finally {
      setEditSaving(false);
    }
  };

  const handleRevokeInvite = async (id) => {
    if (!confirm('Revoke this invitation link?')) return;
    try {
      await api.revokeInvitation(id);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to revoke invitation');
    }
  };

  const handleSuspendMember = async (member) => {
    if (!confirm(`Are you sure you want to deactivate ${member.user.fullName}?`)) return;
    try {
      await api.deleteMember(member.id);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to suspend member');
    }
  };

  const copyInviteLink = (token) => {
    const url = `${window.location.origin}/register?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(''), 2500);
  };

  // =================================================================
  // 1. SUPERADMIN PORTAL VIEW: Company & Subscription Directory
  // =================================================================
  if (isPlatformAdmin) {
    const filteredCompanies = companies.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
        c.slug.toLowerCase().includes(companySearch.toLowerCase()) ||
        c.subscriptionPlan.toLowerCase().includes(companySearch.toLowerCase());
      if (companyStatusFilter === 'ACTIVE') return matchesSearch && !c.isSuspended;
      if (companyStatusFilter === 'SUSPENDED') return matchesSearch && c.isSuspended;
      if (companyStatusFilter === 'TRIALING') return matchesSearch && c.freeTrialStatus === 'TRIALING';
      return matchesSearch;
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#7F5D99]" />
              Staff & Employee Directory — Company & Subscription Management
            </h2>
            <p className="text-xs text-[#6B6172] mt-0.5">
              Superadmin Executive Console: Multi-tenant company subscriptions, free-trial extensions, and account status controls.
            </p>
          </div>

          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl border border-[#E8DFED] bg-white text-xs font-bold text-[#4C2365] hover:bg-[#FAF6FD] flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Directory
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8DFED] flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#6B6172] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              placeholder="Search companies by legal name, slug, or plan tier..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={companyStatusFilter}
              onChange={(e) => setCompanyStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:outline-hidden"
            >
              <option value="ALL">All Companies ({companies.length})</option>
              <option value="ACTIVE">Active Workspaces</option>
              <option value="SUSPENDED">Suspended Workspaces</option>
              <option value="TRIALING">On Free Trial</option>
            </select>
          </div>
        </div>

        {/* Superadmin Table: Required Columns */}
        <div className="rounded-3xl bg-white border border-[#E8DFED] overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#6B6172] font-semibold">
              Loading multi-tenant company and subscription directory...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#6B6172]">
              No organization matching your search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6FD] border-b border-[#E8DFED] text-[#4C2365] uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Company Name</th>
                    <th className="py-3.5 px-4">Company Status</th>
                    <th className="py-3.5 px-4">Subscription Plan</th>
                    <th className="py-3.5 px-4">Subscription Status</th>
                    <th className="py-3.5 px-4">Start Date</th>
                    <th className="py-3.5 px-4">Expiry Date</th>
                    <th className="py-3.5 px-4">Free Trial Status</th>
                    <th className="py-3.5 px-4">Trial Expiry</th>
                    <th className="py-3.5 px-4">Remaining Trial Days</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFED]">
                  {filteredCompanies.map((c) => {
                    const isPaid = c.freeTrialStatus === 'CONVERTED_PAID';

                    return (
                      <tr key={c.id} className="hover:bg-[#FAF6FD]/60 transition-colors">
                        {/* Company Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#251A2D]">{c.name}</div>
                          <span className="text-[10px] font-mono text-[#7F5D99]">{c.slug}</span>
                        </td>

                        {/* Company Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.isSuspended
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {c.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                          </span>
                        </td>

                        {/* Subscription Plan */}
                        <td className="py-3.5 px-4 font-semibold text-[#4C2365]">
                          {c.subscriptionPlan}
                        </td>

                        {/* Subscription Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.subscriptionStatus === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700'
                                : c.subscriptionStatus === 'TRIALING'
                                ? 'bg-purple-50 text-purple-700'
                                : c.subscriptionStatus === 'EXPIRED'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {c.subscriptionStatus}
                          </span>
                        </td>

                        {/* Subscription Start Date */}
                        <td className="py-3.5 px-4 text-[#6B6172]">
                          {new Date(c.subscriptionStartDate).toLocaleDateString()}
                        </td>

                        {/* Subscription Expiry Date */}
                        <td className="py-3.5 px-4 text-[#6B6172]">
                          {c.subscriptionExpiryDate
                            ? new Date(c.subscriptionExpiryDate).toLocaleDateString()
                            : 'N/A (Rolling)'}
                        </td>

                        {/* Free Trial Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.freeTrialStatus === 'TRIALING'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : c.freeTrialStatus === 'EXPIRED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : c.freeTrialStatus === 'CONVERTED_PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {c.freeTrialStatus === 'CONVERTED_PAID'
                              ? 'PAID SUBSCRIBER'
                              : c.freeTrialStatus}
                          </span>
                        </td>

                        {/* Free Trial Expiry Date */}
                        <td className="py-3.5 px-4 text-[#6B6172]">
                          {c.freeTrialExpiryDate
                            ? new Date(c.freeTrialExpiryDate).toLocaleDateString()
                            : 'N/A'}
                        </td>

                        {/* Remaining Trial Days */}
                        <td className="py-3.5 px-4">
                          {isPaid ? (
                            <span className="text-[11px] text-[#6B6172]">Paid Account</span>
                          ) : c.remainingTrialDays > 0 ? (
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {c.remainingTrialDays} Days Left
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Expired
                            </span>
                          )}
                        </td>

                        {/* Actions: Activate/Suspend & Extend Free Trial */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Extend Free Trial Action */}
                            <button
                              onClick={() => {
                                if (isPaid) {
                                  alert(`Company "${c.name}" already has an active paid subscription (${c.subscriptionPlan}). Trial extension is not applicable.`);
                                  return;
                                }
                                if (c.isSuspended) {
                                  alert(`Cannot extend trial while company is suspended. Reactivate the company first.`);
                                  return;
                                }
                                setExtendModalCompany(c);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-[#C4A4DA] text-xs font-semibold text-[#4C2365] hover:bg-[#FAF6FD] cursor-pointer"
                              title="Extend Free Trial"
                            >
                              Extend Free Trial
                            </button>

                            {/* Activate / Suspend Company Action */}
                            <button
                              onClick={() => setSuspendModalCompany(c)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                c.isSuspended
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              }`}
                            >
                              {c.isSuspended ? 'Reactivate' : 'Suspend'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Superadmin Modal 1: Activate / Suspend Company */}
        {suspendModalCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DFED] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 bg-[#FAF6FD] border-b border-[#E8DFED] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#4C2365]">
                    {suspendModalCompany.isSuspended ? 'Reactivate Organization' : 'Suspend Organization'}
                  </h3>
                  <p className="text-xs text-[#6B6172]">{suspendModalCompany.name}</p>
                </div>
                <button
                  onClick={() => setSuspendModalCompany(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                    suspendModalCompany.isSuspended
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {suspendModalCompany.isSuspended ? 'Restore Access Confirmation' : 'Suspension Notice'}
                    </span>
                    <span className="text-[11px]">
                      {suspendModalCompany.isSuspended
                        ? 'Reactivating this organization will immediately restore access to all authorized portal features. No data was deleted.'
                        : 'Suspending this organization blocks all members from logging in and executing tasks. All company records, branches, and task histories remain strictly preserved.'}
                    </span>
                  </div>
                </div>

                {!suspendModalCompany.isSuspended && (
                  <div>
                    <label className="block font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                      Administrative Reason for Suspension *
                    </label>
                    <textarea
                      value={suspensionReason}
                      onChange={(e) => setSuspensionReason(e.target.value)}
                      rows={3}
                      placeholder="e.g. Terms of Service violation, non-payment, or customer hold request..."
                      className="w-full px-3 py-2 rounded-xl border border-[#E8DFED] focus:ring-2 focus:ring-[#7F5D99]"
                      required
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-[#E8DFED] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSuspendModalCompany(null)}
                    className="px-4 py-2 rounded-xl border border-[#E8DFED] font-semibold text-[#6B6172] hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSuspending}
                    onClick={handleConfirmSuspension}
                    className={`px-5 py-2 rounded-xl text-white font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 ${
                      suspendModalCompany.isSuspended
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {isSuspending
                      ? 'Processing...'
                      : suspendModalCompany.isSuspended
                      ? 'Confirm Reactivation'
                      : 'Confirm Suspension'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Superadmin Modal 2: Extend Free Trial */}
        {extendModalCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DFED] overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 bg-[#FAF6FD] border-b border-[#E8DFED] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#4C2365]">Extend Free Trial</h3>
                  <p className="text-xs text-[#6B6172]">{extendModalCompany.name}</p>
                </div>
                <button
                  onClick={() => setExtendModalCompany(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Current vs Proposed Date Comparison */}
                <div className="p-3.5 rounded-xl bg-[#FAF6FD] border border-[#E8DFED] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B6172]">Current Trial Expiry:</span>
                    <span className="font-bold text-[#251A2D]">
                      {extendModalCompany.freeTrialExpiryDate
                        ? new Date(extendModalCompany.freeTrialExpiryDate).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B6172]">Current Remaining Days:</span>
                    <span className="font-bold text-[#7F5D99]">
                      {extendModalCompany.remainingTrialDays} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#E8DFED]">
                    <span className="font-bold text-[#4C2365]">Proposed New Expiry Date:</span>
                    <span className="font-mono font-extrabold text-emerald-700">
                      {(() => {
                        const now = new Date();
                        const current = extendModalCompany.freeTrialExpiryDate
                          ? new Date(extendModalCompany.freeTrialExpiryDate)
                          : now;
                        const base = current > now ? current : now;
                        const added = (parseInt(extensionDays, 10) || 0) * 24 * 60 * 60 * 1000;
                        return new Date(base.getTime() + added).toLocaleDateString();
                      })()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                    Additional Trial Days (1 — 90 Days) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFED] focus:ring-2 focus:ring-[#7F5D99]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                    Administrative Reason *
                  </label>
                  <input
                    type="text"
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    placeholder="e.g. Granted 14 days evaluation extension per customer request"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8DFED] focus:ring-2 focus:ring-[#7F5D99]"
                    required
                  />
                </div>

                <div className="pt-2 border-t border-[#E8DFED] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setExtendModalCompany(null)}
                    className="px-4 py-2 rounded-xl border border-[#E8DFED] font-semibold text-[#6B6172] hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isExtending}
                    onClick={handleConfirmExtendTrial}
                    className="px-5 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isExtending ? 'Extending...' : 'Confirm Trial Extension'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =================================================================
  // 2. TENANT ROLE VIEW: Employee Directory & Role Assignments
  // =================================================================
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight">
            {isSupportAdmin && 'Support Directory — User Lookup'}
            {isBillingAdmin && 'Billing Directory — Licensed Account Roster'}
            {isHrAdmin && 'HR Portal — Staff Directory & Branch Assignments'}
            {!isSupportAdmin && !isBillingAdmin && !isHrAdmin && 'Staff & Employee Directory'}
          </h2>
          <p className="text-xs text-[#6B6172] mt-0.5">
            {isSupportAdmin && 'View verified customer account details to assist with platform support tickets.'}
            {isBillingAdmin && 'Monitor seat allocations, plan licensing counts, and active billing accounts.'}
            {isHrAdmin && 'Manage employee onboarding, role allocation, department, and branch assignments.'}
            {!isSupportAdmin && !isBillingAdmin && !isHrAdmin && 'Manage organization members, onboard staff, and issue access invitations.'}
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Invite Staff Member
          </button>
        )}
      </div>

      {/* Usage Capacity Bar (Hidden from HR Admin to prevent billing leakage) */}
      {usage && !isHrAdmin && !isSupportAdmin && (
        <div className="p-4 rounded-2xl bg-white border border-[#E8DFED] flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF6FD] text-[#4C2365] flex items-center justify-center font-bold">
              <UserCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#251A2D]">
                Licensed Seats ({usage.users.current} / {usage.users.max} Allocated)
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
                  usage.users.isLimitReached ? 'bg-[#B42318]' : 'bg-[#7F5D99]'
                }`}
                style={{
                  width: `${Math.min(100, (usage.users.current / usage.users.max) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8DFED] pb-2">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'members'
              ? 'bg-[#7F5D99] text-white shadow-xs'
              : 'text-[#6B6172] hover:text-[#4C2365] hover:bg-[#FAF6FD]'
          }`}
        >
          Active Members ({members.length})
        </button>

        {canManage && (
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'invitations'
                ? 'bg-[#7F5D99] text-white shadow-xs'
                : 'text-[#6B6172] hover:text-[#4C2365] hover:bg-[#FAF6FD]'
            }`}
          >
            Pending Invitations ({invitations.length})
          </button>
        )}
      </div>

      {/* Tab 1: Active Members */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4 hover:border-[#9E7EB5] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4C2365] to-[#7F5D99] flex items-center justify-center font-bold text-white text-lg shadow-xs">
                    {m.user.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 text-xs font-bold text-[#7F5D99] bg-[#FAF6FD] rounded-lg border border-[#E8DFED]">
                      {m.role?.label || 'Staff'}
                    </span>
                    {m.status === 'SUSPENDED' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 rounded">
                        Suspended
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#251A2D]">{m.user.fullName}</h3>
                {m.designation && (
                  <p className="text-xs text-[#7F5D99] font-medium mt-0.5">{m.designation}</p>
                )}

                <div className="space-y-1.5 text-xs text-[#6B6172] pt-3 mt-3 border-t border-[#E8DFED]">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-[#9E7EB5] shrink-0" />
                    <span className="truncate">{m.user.email}</span>
                  </div>

                  {(!isSupportAdmin && !isBillingAdmin) && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-[#9E7EB5] shrink-0" />
                      <span>{m.branch ? `${m.branch.name} (${m.branch.code || 'LOC'})` : 'Headquarters / Unassigned'}</span>
                    </div>
                  )}

                  {(isSupportAdmin || isBillingAdmin) && (
                    <div className="flex items-center gap-2 text-[11px] text-[#7F5D99]">
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Organization: {tenant?.name || 'Authorized Tenant'}</span>
                    </div>
                  )}
                </div>
              </div>

              {canManage && m.role?.name !== 'OWNER' && (
                <div className="pt-3 border-t border-[#E8DFED] flex items-center justify-between text-xs">
                  <button
                    onClick={() => openEditModal(m)}
                    className="font-semibold text-[#7F5D99] hover:text-[#4C2365] flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Assign Branch / Role
                  </button>
                  <button
                    onClick={() => handleSuspendMember(m)}
                    className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                  >
                    {m.status === 'ACTIVE' ? 'Deactivate' : 'Suspended'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Pending Invitations */}
      {activeTab === 'invitations' && (
        <div className="rounded-3xl bg-white border border-[#E8DFED] overflow-hidden shadow-xs">
          {invitations.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#6B6172]">
              No active pending invitations found. Click "Invite Staff Member" to issue new invitations.
            </div>
          ) : (
            <div className="divide-y divide-[#E8DFED]">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF6FD]/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#251A2D]">{inv.email}</span>
                      <span className="text-[11px] font-semibold text-[#7F5D99] bg-[#FAF6FD] px-2 py-0.5 rounded border border-[#E8DFED]">
                        {inv.role?.label || 'Employee'}
                      </span>
                    </div>
                    <div className="text-xs text-[#6B6172] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#9E7EB5]" />
                      <span>Expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyInviteLink(inv.token)}
                      className="px-3 py-1.5 rounded-xl border border-[#C4A4DA] bg-white text-xs font-semibold text-[#4C2365] hover:bg-[#FAF6FD] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedToken === inv.token ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#7F5D99]" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRevokeInvite(inv.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      title="Revoke invitation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DFED] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#FAF6FD] border-b border-[#E8DFED] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#4C2365]">Invite Staff Member</h3>
                <p className="text-xs text-[#6B6172]">Send an onboarding link with role and branch assignment.</p>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="p-6 space-y-3.5">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Staff Email Address *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="employee@company.com"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Assign System Role *
                </label>
                <select
                  value={inviteRoleId}
                  onChange={(e) => setInviteRoleId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:ring-2 focus:ring-[#7F5D99]"
                >
                  {roles
                    .filter((r) => r.name !== 'SUPER_ADMIN')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Assign Branch Location
                </label>
                <select
                  value={inviteBranchId}
                  onChange={(e) => setInviteBranchId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:ring-2 focus:ring-[#7F5D99]"
                >
                  <option value="">Headquarters / Unassigned</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Designation / Title
                </label>
                <input
                  type="text"
                  value={inviteDesignation}
                  onChange={(e) => setInviteDesignation(e.target.value)}
                  placeholder="e.g. Senior Floor Associate"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div className="pt-3 border-t border-[#E8DFED] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8DFED] text-xs font-semibold text-[#6B6172] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Generating...' : 'Issue Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {isEditModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DFED] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#FAF6FD] border-b border-[#E8DFED] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#4C2365]">Edit Staff Details</h3>
                <p className="text-xs text-[#6B6172]">{editingMember.user.fullName} ({editingMember.user.email})</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-3.5">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Assigned Branch Location
                </label>
                <select
                  value={editBranchId}
                  onChange={(e) => setEditBranchId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:ring-2 focus:ring-[#7F5D99]"
                >
                  <option value="">Headquarters / Unassigned</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Designation / Department
                </label>
                <input
                  type="text"
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  placeholder="e.g. Operations Lead, QA Specialist"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  System Role
                </label>
                <select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:ring-2 focus:ring-[#7F5D99]"
                >
                  {roles
                    .filter((r) => r.name !== 'SUPER_ADMIN')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Account Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:ring-2 focus:ring-[#7F5D99]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#E8DFED] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8DFED] text-xs font-semibold text-[#6B6172] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {editSaving ? 'Saving...' : 'Update Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
