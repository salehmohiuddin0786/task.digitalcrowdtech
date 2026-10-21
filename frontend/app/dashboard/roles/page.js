'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Check,
  AlertCircle,
  Save,
  Users,
  ShieldAlert,
  Info,
  Building2,
  Globe,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  ExternalLink,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const PORTAL_DEFINITIONS = [
  {
    id: 'owner',
    name: 'Company Owner Portal',
    role: 'Company Owner',
    description: 'Executive authority, billing & subscription control, company-wide governance, and top-level branch oversight.',
    entitlements: ['Full Organization Control', 'Billing & Plan Upgrades', 'Executive Insights', 'Branch Supervision', 'Team & Member Authority'],
    badgeColor: 'bg-purple-100 text-[#4C2365] border-purple-200',
  },
  {
    id: 'company_admin',
    name: 'Company Admin Portal',
    role: 'Company Admin',
    description: 'Operational administration, workflow settings, project creation, branch supervision, and department configuration.',
    entitlements: ['Branch Supervision', 'Team Creation', 'Project & Task Architecture', 'Staff Directory', 'Department Settings'],
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'manager',
    name: 'Branch Manager Portal',
    role: 'Branch Manager',
    description: 'Branch-level operational management, team lead supervision, task reviews, and branch performance oversight.',
    entitlements: ['Branch Oversight', 'Team Lead Supervision', 'Task Review & Approvals', 'Departmental Reports'],
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'hr',
    name: 'HR Portal',
    role: 'HR Admin',
    description: 'Workforce records, onboarding, staff attendance tracking, employee directory, and human resource policies.',
    entitlements: ['Staff Onboarding', 'Employee Directory', 'Attendance & Leaves', 'Performance Logs'],
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
  },
  {
    id: 'lead',
    name: 'Lead / Team Leader Portal',
    role: 'Team Lead',
    description: 'Team task delegation, project milestone tracking, work breakdown, and direct team staff assignment.',
    entitlements: ['Team Staff Assignment', 'Task Allocation', 'Project Milestone Tracking', 'Work Verification'],
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'employee',
    name: 'Employee Portal',
    role: 'Employee / Staff',
    description: 'Assigned task execution, checklist completion, daily work logging, and proof/evidence submission.',
    entitlements: ['Assigned Task Execution', 'Evidence Uploads', 'Activity Comments', 'Personal Dashboard'],
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'client',
    name: 'Client / Guest Portal',
    role: 'Client / Viewer',
    description: 'Read-only project transparency, milestone progress monitoring, and deliverable review for client partners.',
    entitlements: ['Read-only Project View', 'Milestone Progress Tracker', 'Task Completion Summaries'],
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
];

export default function RolesAndPermissionsPage() {
  const { role: userRole, user } = useAuth();
  const isPlatformAdmin = Boolean(user?.isPlatformAdmin || userRole === 'SUPER_ADMIN');
  const isOwner = userRole === 'OWNER';

  // Superadmin Tabs: 'portals' | 'matrix'
  const [activeTab, setActiveTab] = useState(isPlatformAdmin ? 'portals' : 'matrix');

  // Superadmin Organization Portal Access State
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedCompanyPortals, setSelectedCompanyPortals] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [portalSaving, setPortalSaving] = useState(false);
  const [portalSuccess, setPortalSuccess] = useState('');
  const [portalError, setPortalError] = useState('');

  // Confirmation Modal for Revoking Portals
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokingPortalsList, setRevokingPortalsList] = useState([]);
  const [revokeReason, setRevokeReason] = useState('');

  // Matrix State (Roles & Permissions)
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [activePermissions, setActivePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matrixSaving, setMatrixSaving] = useState(false);
  const [matrixSuccess, setMatrixSuccess] = useState('');
  const [matrixError, setMatrixError] = useState('');

  useEffect(() => {
    loadInitialData();
  }, [isPlatformAdmin]);

  const loadInitialData = async () => {
    setLoading(true);
    setMatrixError('');
    setPortalError('');

    try {
      const promises = [api.getRoles(), api.getAllPermissions()];
      if (isPlatformAdmin) {
        promises.push(api.getSuperadminCompanies());
      }

      const results = await Promise.allSettled(promises);
      const rolesRes = results[0]?.value;
      const permsRes = results[1]?.value;
      const companiesRes = results[2]?.value;

      if (rolesRes?.success && rolesRes.data) {
        setRoles(rolesRes.data);
        if (rolesRes.data.length > 0 && !selectedRoleId) {
          setSelectedRoleId(rolesRes.data[0].id);
          loadRolePermissions(rolesRes.data[0].id);
        }
      }

      if (permsRes?.success && permsRes.data) {
        setGroupedPermissions(permsRes.data.grouped || {});
      }

      if (companiesRes?.success && Array.isArray(companiesRes.data)) {
        setCompanies(companiesRes.data);
        if (companiesRes.data.length > 0) {
          const first = companiesRes.data[0];
          setSelectedCompanyId(first.id);
          setSelectedCompanyPortals(first.enabledPortals || PORTAL_DEFINITIONS.map((p) => p.id));
        }
      }
    } catch (err) {
      setMatrixError('Failed to load access control data.');
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      const res = await api.getRolePermissions(roleId);
      if (res.success && res.data) {
        setActivePermissions(res.data.permissions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectRole = (roleId) => {
    setSelectedRoleId(roleId);
    setMatrixSuccess('');
    setMatrixError('');
    loadRolePermissions(roleId);
  };

  const togglePermission = (slug) => {
    const selectedRole = roles.find((r) => r.id === selectedRoleId);
    if (selectedRole?.name === 'OWNER' && ['settings.manage', 'members.manage', 'tasks.view', 'tasks.create'].includes(slug)) {
      setMatrixError(`"${slug}" is a mandatory system permission for the Business Owner.`);
      return;
    }

    setMatrixError('');
    setActivePermissions((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]
    );
  };

  const handleSaveMatrix = async () => {
    setMatrixSaving(true);
    setMatrixSuccess('');
    setMatrixError('');
    try {
      const res = await api.updateRolePermissions(selectedRoleId, activePermissions);
      if (res.success) {
        setMatrixSuccess(res.message || 'Permissions updated successfully.');
      }
    } catch (err) {
      setMatrixError(err.message || 'Failed to update permissions.');
    } finally {
      setMatrixSaving(false);
    }
  };

  // -----------------------------------------------------------------
  // Superadmin Portal Access Handlers
  // -----------------------------------------------------------------
  const handleSelectCompany = (companyId) => {
    setSelectedCompanyId(companyId);
    setPortalSuccess('');
    setPortalError('');
    const comp = companies.find((c) => c.id === companyId);
    if (comp) {
      setSelectedCompanyPortals(comp.enabledPortals || PORTAL_DEFINITIONS.map((p) => p.id));
    }
  };

  const togglePortal = (portalId) => {
    setPortalError('');
    setPortalSuccess('');
    setSelectedCompanyPortals((prev) =>
      prev.includes(portalId) ? prev.filter((p) => p !== portalId) : [...prev, portalId]
    );
  };

  const handleSelectAllPortals = () => {
    setSelectedCompanyPortals(PORTAL_DEFINITIONS.map((p) => p.id));
  };

  const handleResetPortals = () => {
    const comp = companies.find((c) => c.id === selectedCompanyId);
    if (comp) {
      setSelectedCompanyPortals(comp.enabledPortals || PORTAL_DEFINITIONS.map((p) => p.id));
    }
  };

  const handleTriggerSavePortals = () => {
    setPortalError('');
    setPortalSuccess('');

    const comp = companies.find((c) => c.id === selectedCompanyId);
    if (!comp) return;

    const previous = comp.enabledPortals || PORTAL_DEFINITIONS.map((p) => p.id);
    const revoked = previous.filter((p) => !selectedCompanyPortals.includes(p));

    if (revoked.length > 0) {
      setRevokingPortalsList(revoked);
      setRevokeReason('');
      setShowRevokeModal(true);
    } else {
      executeSavePortals(selectedCompanyPortals, 'Portal policy updated by Superadmin');
    }
  };

  const executeSavePortals = async (portals, reason) => {
    setPortalSaving(true);
    setShowRevokeModal(false);
    try {
      const res = await api.updateCompanyPortals(selectedCompanyId, {
        enabledPortals: portals,
        reason: reason || 'Superadmin configured role portal access',
      });

      if (res.success) {
        setPortalSuccess(res.message || 'Company portal access updated successfully.');
        // Update local company record
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === selectedCompanyId ? { ...c, enabledPortals: portals } : c
          )
        );
      }
    } catch (err) {
      setPortalError(err.message || 'Failed to update company portal access.');
    } finally {
      setPortalSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const currentCompany = companies.find((c) => c.id === selectedCompanyId);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
    c.slug?.toLowerCase().includes(companySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight">
            Role-Based Access Control (RBAC) & Portals
          </h2>
          <p className="text-xs text-[#6B6172] mt-0.5">
            {isPlatformAdmin
              ? 'Configure company portal availability, operational boundaries, and system-wide permission matrices.'
              : 'Configure system permissions, operational boundaries, and security enforcement.'}
          </p>
        </div>

        {/* Action button depending on active tab */}
        {isPlatformAdmin && activeTab === 'portals' && (
          <button
            onClick={handleTriggerSavePortals}
            disabled={portalSaving || !selectedCompanyId}
            className="px-5 py-2.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {portalSaving ? 'Saving...' : 'Save Portal Access'}
          </button>
        )}

        {(!isPlatformAdmin || activeTab === 'matrix') && isOwner && (
          <button
            onClick={handleSaveMatrix}
            disabled={matrixSaving}
            className="px-5 py-2.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {matrixSaving ? 'Saving...' : 'Save Matrix'}
          </button>
        )}
      </div>

      {/* Superadmin Tab Navigation */}
      {isPlatformAdmin && (
        <div className="flex items-center gap-2 border-b border-[#E8DFED] pb-3">
          <button
            onClick={() => setActiveTab('portals')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'portals'
                ? 'bg-[#4C2365] text-white shadow-xs'
                : 'bg-white text-[#6B6172] hover:bg-[#FAF6FD] hover:text-[#4C2365] border border-[#E8DFED]'
            }`}
          >
            <Globe className="w-4 h-4" />
            Organization Portal Access (RBAC)
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-[#4C2365] text-white shadow-xs'
                : 'bg-white text-[#6B6172] hover:bg-[#FAF6FD] hover:text-[#4C2365] border border-[#E8DFED]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            System Roles & Permissions Matrix
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 1: Organization Portal Access (Superadmin)                      */}
      {/* =================================================================== */}
      {isPlatformAdmin && activeTab === 'portals' && (
        <div className="space-y-6">
          {portalSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#237A4B] text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span>{portalSuccess}</span>
            </div>
          )}

          {portalError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{portalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left Column: Organization Selector */}
            <div className="p-4 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#6B6172] uppercase tracking-wider">
                  Organizations ({companies.length})
                </h3>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#6B6172] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search company..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF6FD] border border-[#E8DFED] rounded-xl focus:outline-hidden focus:border-[#7F5D99]"
                />
              </div>

              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredCompanies.map((c) => {
                  const isSelected = c.id === selectedCompanyId;
                  const activeCount = Array.isArray(c.enabledPortals) ? c.enabledPortals.length : 7;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCompany(c.id)}
                      className={`w-full p-3 rounded-2xl text-left transition-all cursor-pointer flex flex-col gap-1 border ${
                        isSelected
                          ? 'bg-[#FAF6FD] border-[#7F5D99] shadow-xs'
                          : 'bg-white border-transparent hover:bg-[#FAF6FD]/60 hover:border-[#E8DFED]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#4C2365]' : 'text-[#251A2D]'}`}>
                          {c.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                            c.isSuspended
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {c.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#6B6172]">
                        <span className="capitalize">{c.subscriptionPlan || `${c.planTier} Plan`}</span>
                        <span className="font-semibold text-[#7F5D99]">{activeCount}/7 Portals</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right 3 Cols: Portals Configuration */}
            <div className="lg:col-span-3 space-y-5">
              {currentCompany ? (
                <>
                  {/* Selected Company Banner */}
                  <div className="p-5 rounded-3xl bg-[#4C2365] text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-[#C4A4DA] tracking-widest">
                          Target Organization
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                            currentCompany.isSuspended
                              ? 'bg-rose-500 text-white'
                              : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {currentCompany.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mt-0.5">{currentCompany.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 mt-1">
                        <span>Plan: <strong className="text-white">{currentCompany.subscriptionPlan}</strong></span>
                        <span>•</span>
                        <span>Trial Status: <strong className="text-white">{currentCompany.freeTrialStatus}</strong> ({currentCompany.remainingTrialDays}d left)</span>
                        <span>•</span>
                        <span>Branches: <strong className="text-white">{currentCompany.counts?.branches || 0}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAllPortals}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/20 cursor-pointer"
                      >
                        Enable All
                      </button>
                      <button
                        onClick={handleResetPortals}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/20 cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Warning if owner is unchecked */}
                  {!selectedCompanyPortals.includes('owner') && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <strong className="font-bold">Important Notice:</strong> You have unselected the Company Owner portal. Organization administrators will not be able to access the Owner Portal unless this is enabled.
                      </div>
                    </div>
                  )}

                  {/* Portals Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PORTAL_DEFINITIONS.map((portal) => {
                      const isEnabled = selectedCompanyPortals.includes(portal.id);
                      return (
                        <div
                          key={portal.id}
                          className={`p-5 rounded-3xl border transition-all card-hover-lift flex flex-col justify-between ${
                            isEnabled
                              ? 'bg-white border-[#7F5D99]/40 shadow-xs'
                              : 'bg-gray-50/70 border-gray-200 opacity-75'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`w-3 h-3 rounded-full ${
                                    isEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                                  }`}
                                />
                                <div>
                                  <h4 className="text-sm font-bold text-[#251A2D]">
                                    {portal.name}
                                  </h4>
                                  <span
                                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md mt-0.5 border ${portal.badgeColor}`}
                                  >
                                    Target Role: {portal.role}
                                  </span>
                                </div>
                              </div>

                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={() => togglePortal(portal.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7F5D99]"></div>
                              </label>
                            </div>

                            <p className="text-xs text-[#6B6172] mt-3 leading-relaxed">
                              {portal.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#E8DFED]/80">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6172] block mb-2">
                              Feature Entitlements
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {portal.entitlements.map((e, idx) => (
                                <span
                                  key={idx}
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                                    isEnabled
                                      ? 'bg-[#FAF6FD] text-[#4C2365] border border-[#E8DFED]'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {e}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center rounded-3xl bg-white border border-[#E8DFED] text-[#6B6172]">
                  <Building2 className="w-8 h-8 mx-auto text-[#9E7EB5] mb-2 opacity-50" />
                  <p className="text-sm font-semibold">Select an organization to manage portal access.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: Roles & Permissions Matrix                                  */}
      {/* =================================================================== */}
      {(!isPlatformAdmin || activeTab === 'matrix') && (
        <div className="space-y-6">
          {matrixSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#237A4B] text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span>{matrixSuccess}</span>
            </div>
          )}

          {matrixError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{matrixError}</span>
            </div>
          )}

          {!isOwner && !isPlatformAdmin && (
            <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#C4A4DA] text-xs text-[#4C2365] flex items-center gap-2 font-medium">
              <Info className="w-4 h-4 text-[#7F5D99] shrink-0" />
              <span>
                You are viewing the permission matrix in read-only mode. Only the Business Owner or Superadmin can modify permissions.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left Column: Role Selector List */}
            <div className="p-4 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-[#6B6172] uppercase tracking-wider px-2 mb-2">
                System Roles
              </h3>

              {roles.map((r) => {
                const isSelected = r.id === selectedRoleId;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelectRole(r.id)}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col gap-1 border ${
                      isSelected
                        ? 'bg-[#FAF6FD] border-[#7F5D99] shadow-xs'
                        : 'bg-white border-transparent hover:bg-[#FAF6FD]/60 hover:border-[#E8DFED]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isSelected ? 'text-[#4C2365]' : 'text-[#251A2D]'
                        }`}
                      >
                        {r.label}
                      </span>
                      <span className="text-[10px] font-semibold text-[#7F5D99] bg-white px-2 py-0.5 rounded-full border border-[#E8DFED]">
                        {r.memberCount} users
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B6172] line-clamp-1">{r.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Right 3 Cols: Permissions by Module */}
            <div className="lg:col-span-3 space-y-5">
              {selectedRole && (
                <div className="p-5 rounded-3xl bg-[#4C2365] text-white shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#C4A4DA] tracking-widest block">
                      Configuring Role
                    </span>
                    <h3 className="text-lg font-bold text-white">{selectedRole.label}</h3>
                    <p className="text-xs text-white/80 mt-0.5">{selectedRole.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-[#C4A4DA]">
                      {activePermissions.length}
                    </span>
                    <span className="text-[10px] uppercase block text-white/70">Granted</span>
                  </div>
                </div>
              )}

              {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                <div
                  key={moduleName}
                  className="p-5 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-3"
                >
                  <div className="flex items-center gap-2 border-b border-[#E8DFED] pb-2">
                    <span className="w-2 h-2 rounded-full bg-[#7F5D99]" />
                    <h4 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                      {moduleName} Permissions
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {perms.map((p) => {
                      const isChecked = activePermissions.includes(p.slug);
                      const canEdit = isOwner || isPlatformAdmin;
                      return (
                        <label
                          key={p.id}
                          onClick={(e) => {
                            if (!canEdit) e.preventDefault();
                          }}
                          className={`p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                            isChecked
                              ? 'bg-[#FAF6FD] border-[#C4A4DA]'
                              : 'bg-white border-[#E8DFED] hover:border-[#9E7EB5]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!canEdit}
                            onChange={() => togglePermission(p.slug)}
                            className="mt-1 w-4 h-4 rounded text-[#7F5D99] border-[#C4A4DA] focus:ring-[#7F5D99]"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#251A2D] font-mono">{p.slug}</div>
                            <div className="text-[11px] text-[#6B6172] mt-0.5">{p.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* Revocation Confirmation Modal                                       */}
      {/* =================================================================== */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-[#E8DFED] space-y-5 animate-modal-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-bold text-[#251A2D]">Revoke Portal Access?</h3>
              </div>
              <button
                onClick={() => setShowRevokeModal(false)}
                className="p-1 rounded-xl text-[#6B6172] hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-[#6B6172] space-y-3">
              <p>
                You are about to revoke access to the following portals for{' '}
                <strong className="text-[#251A2D]">{currentCompany?.name}</strong>:
              </p>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-rose-50 border border-rose-200">
                {revokingPortalsList.map((portalId) => {
                  const def = PORTAL_DEFINITIONS.find((p) => p.id === portalId);
                  return (
                    <span
                      key={portalId}
                      className="px-2 py-1 rounded-lg bg-white border border-rose-200 text-rose-800 text-[11px] font-bold"
                    >
                      {def?.name || portalId}
                    </span>
                  );
                })}
              </div>
              <p>
                Users assigned to these roles in this organization will immediately lose access to their respective dashboard portals.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-[#251A2D] mb-1">
                  Reason for revocation (recorded in audit log)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plan downgrade, security policy enforcement"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF6FD] border border-[#E8DFED] rounded-xl focus:outline-hidden focus:border-[#7F5D99]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DFED]">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6172] hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => executeSavePortals(selectedCompanyPortals, revokeReason)}
                disabled={portalSaving}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {portalSaving ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
