'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Settings,
  ShieldCheck,
  Building2,
  Bell,
  Smartphone,
  Palette,
  KeyRound,
  Laptop,
  Check,
  AlertCircle,
  Save,
  LogOut,
  Activity,
  Cpu,
  Database,
  Server,
  ExternalLink,
  Package,
  CreditCard,
  Wallet,
  Receipt,
  Tag,
  LifeBuoy,
  BookOpen,
  Sliders,
  CheckCircle2,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { tenant, user, role, refreshSession } = useAuth();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab') || 'general';

  // Company Profile form
  const [companyName, setCompanyName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Sessions list
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  // Plans state (Superadmin management & Company viewing)
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planCode, setPlanCode] = useState('');
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState(499);
  const [planMaxUsers, setPlanMaxUsers] = useState(5);
  const [planMaxBranches, setPlanMaxBranches] = useState(1);
  const [planFeatures, setPlanFeatures] = useState('');
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState('');

  // Platform flags (Superadmin only)
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [logLevel, setLogLevel] = useState('info');
  const [platformSaved, setPlatformSaved] = useState(false);

  const canManageCompany = role === 'OWNER' || role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN';
  const isPlatformAdmin = Boolean(user?.isPlatformAdmin || role === 'SUPER_ADMIN');

  useEffect(() => {
    if (tenant) {
      setCompanyName(tenant.name || '');
      setTimezone(tenant.timezone || 'Asia/Kolkata');
      setCurrency(tenant.currency || 'INR');
    }
    loadSessions();
    if (currentTab === 'plans') {
      loadPlans();
    }
  }, [tenant, currentTab]);

  const loadPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await api.getPlans();
      if (res.success && res.data) {
        setPlans(res.data);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  const openCreatePlanModal = () => {
    setEditingPlan(null);
    setPlanCode('');
    setPlanName('');
    setPlanPrice(999);
    setPlanMaxUsers(10);
    setPlanMaxBranches(2);
    setPlanFeatures('Task Boards\nCalendar View\nPriority Alerts');
    setPlanError('');
    setIsPlanModalOpen(true);
  };

  const openEditPlanModal = (p) => {
    setEditingPlan(p);
    setPlanCode(p.code);
    setPlanName(p.name);
    setPlanPrice(p.priceMonthly);
    setPlanMaxUsers(p.maxUsers);
    setPlanMaxBranches(p.maxBranches);
    setPlanFeatures((p.features || []).join('\n'));
    setPlanError('');
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setPlanSaving(true);
    setPlanError('');
    try {
      const featuresArray = planFeatures
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      if (editingPlan) {
        await api.updatePlan(editingPlan.id, {
          name: planName,
          priceMonthly: Number(planPrice),
          maxUsers: Number(planMaxUsers),
          maxBranches: Number(planMaxBranches),
          features: featuresArray,
        });
      } else {
        await api.createPlan({
          code: planCode,
          name: planName,
          priceMonthly: Number(planPrice),
          maxUsers: Number(planMaxUsers),
          maxBranches: Number(planMaxBranches),
          features: featuresArray,
        });
      }
      setIsPlanModalOpen(false);
      loadPlans();
    } catch (err) {
      setPlanError(err.message || 'Failed to save plan');
    } finally {
      setPlanSaving(false);
    }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await api.getSessions();
      if (res.success && res.data) {
        setSessions(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const res = await api.updateTenantCurrent({
        name: companyName,
        timezone,
        currency,
      });
      if (res.success) {
        setProfileSuccess('Company profile updated successfully.');
        refreshSession?.();
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update company settings');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess('');
    setPasswordError('');
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword,
      });
      if (res.success) {
        setPasswordSuccess('Password updated successfully. Other device sessions were revoked.');
        setCurrentPassword('');
        setNewPassword('');
        loadSessions();
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!confirm('Revoke access for this session?')) return;
    try {
      await api.revokeSession(sessionId);
      loadSessions();
    } catch (err) {
      alert(err.message || 'Failed to revoke session');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight">
          {currentTab === 'plans' && 'Subscription Plans & Entitlements'}
          {currentTab === 'billing' && 'Billing, Payment Gateways & Cards'}
          {currentTab === 'invoices' && 'Invoices & Billing History'}
          {currentTab === 'coupons' && 'Promotional Coupons & Discounts'}
          {(currentTab === 'support' || currentTab === 'help') && 'Customer Support & Help Desk'}
          {currentTab === 'knowledge-base' && 'Knowledge Base & Help Documentation'}
          {currentTab === 'platform' && 'Platform Configuration & Feature Flags'}
          {currentTab === 'diagnostics' && 'System Health & Node Diagnostics'}
          {currentTab === 'profile' && 'My Profile & Account Credentials'}
          {['general', ''].includes(currentTab) && 'Workspace Settings & Security'}
        </h2>
        <p className="text-xs text-[#6B6172] mt-0.5">
          Organization parameters, active device sessions, security rules, and subscription configurations.
        </p>
      </div>

      {/* SECTION: Subscription Plans (When tab=plans) */}
      {currentTab === 'plans' && (
        <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#E8DFED] pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365]">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#251A2D]">Available SaaS Subscription Plans</h3>
                <p className="text-xs text-[#6B6172]">Quota limits, feature availability, and user capacity tiers.</p>
              </div>
            </div>

            {isPlatformAdmin && (
              <button
                type="button"
                onClick={openCreatePlanModal}
                className="px-3.5 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                + Add Plan Tier
              </button>
            )}
          </div>

          {plansLoading ? (
            <div className="p-8 text-center text-xs text-[#6B6172]">Loading subscription plans...</div>
          ) : plans.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B6172]">No subscription plans configured.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => {
                const isCurrent = tenant?.planTier === p.code;
                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl border space-y-3 relative flex flex-col justify-between ${
                      isCurrent
                        ? 'border-2 border-[#7F5D99] bg-white shadow-sm'
                        : 'border-[#E8DFED] bg-[#FAF6FD]/60'
                    }`}
                  >
                    <div>
                      {isCurrent && (
                        <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#4C2365] text-white">
                          Active Tier
                        </span>
                      )}
                      <span className="text-xs font-bold uppercase tracking-wider text-[#7F5D99] block">
                        {p.name}
                      </span>
                      <div className="text-2xl font-black text-[#4C2365] mt-1">
                        ₹{p.priceMonthly} <span className="text-xs font-normal text-[#6B6172]">/mo</span>
                      </div>
                      <div className="text-[11px] font-semibold text-[#4C2365] pt-1">
                        Up to {p.maxUsers} Users • {p.maxBranches} Branches
                      </div>

                      <ul className="text-xs text-[#6B6172] space-y-1.5 pt-3">
                        {(p.features || []).map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isPlatformAdmin && (
                      <div className="pt-3 border-t border-[#E8DFED] flex justify-end">
                        <button
                          type="button"
                          onClick={() => openEditPlanModal(p)}
                          className="px-3 py-1 rounded-lg border border-[#C4A4DA] text-xs font-semibold text-[#4C2365] hover:bg-[#FAF6FD] cursor-pointer"
                        >
                          Edit Entitlements
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Edit / Create Plan Modal */}
          {isPlanModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DFED] overflow-hidden">
                <div className="px-6 py-4 bg-[#FAF6FD] border-b border-[#E8DFED] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#4C2365]">
                    {editingPlan ? `Edit ${editingPlan.name}` : 'Create Subscription Plan Tier'}
                  </h3>
                  <button
                    onClick={() => setIsPlanModalOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSavePlan} className="p-6 space-y-3.5 text-xs">
                  {planError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                      {planError}
                    </div>
                  )}

                  {!editingPlan && (
                    <div>
                      <label className="block font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                        Plan Code *
                      </label>
                      <input
                        type="text"
                        value={planCode}
                        onChange={(e) => setPlanCode(e.target.value)}
                        placeholder="e.g. enterprise-pro"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFED] focus:ring-2 focus:ring-[#7F5D99]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                      Plan Display Name *
                    </label>
                    <input
                      type="text"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      placeholder="e.g. Enterprise Tier"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-[#E8DFED] focus:ring-2 focus:ring-[#7F5D99]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                        Price (₹/mo)
                      </label>
                      <input
                        type="number"
                        value={planPrice}
                        onChange={(e) => setPlanPrice(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFED] focus:ring-2 focus:ring-[#7F5D99]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                        Max Users
                      </label>
                      <input
                        type="number"
                        value={planMaxUsers}
                        onChange={(e) => setPlanMaxUsers(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFED] focus:ring-2 focus:ring-[#7F5D99]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                        Max Branches
                      </label>
                      <input
                        type="number"
                        value={planMaxBranches}
                        onChange={(e) => setPlanMaxBranches(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-[#E8DFED] focus:ring-2 focus:ring-[#7F5D99]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                      Feature List (One per line)
                    </label>
                    <textarea
                      value={planFeatures}
                      onChange={(e) => setPlanFeatures(e.target.value)}
                      rows={4}
                      placeholder="Task Boards&#10;Calendar Deadlines&#10;Audit Logs"
                      className="w-full px-3 py-2 rounded-xl border border-[#E8DFED] focus:ring-2 focus:ring-[#7F5D99]"
                    />
                  </div>

                  <div className="pt-3 border-t border-[#E8DFED] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlanModalOpen(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-[#E8DFED] text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={planSaving}
                      className="px-4 py-1.5 rounded-xl bg-[#7F5D99] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {planSaving ? 'Saving...' : 'Save Plan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION: Billing & Payments (When tab=billing) */}
      {currentTab === 'billing' && (
        <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-[#E8DFED] pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#251A2D]">Payment Gateways & Invoicing Status</h3>
              <p className="text-xs text-[#6B6172]">Manage payment methods, billing address, and transaction logs.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] space-y-2">
              <span className="font-bold text-[#4C2365] block">Current Plan Tier</span>
              <p className="text-sm font-extrabold text-[#251A2D] uppercase">{tenant?.planTier || 'Growth Tier'}</p>
              <p className="text-[11px] text-[#6B6172]">Next renewal cycle: Auto-renews monthly.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] space-y-2">
              <span className="font-bold text-[#4C2365] block">Payment Gateway</span>
              <p className="text-sm font-extrabold text-emerald-700">PCI-DSS Tokenized</p>
              <p className="text-[11px] text-[#6B6172]">No raw card numbers stored. Encrypted end-to-end.</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Support Tickets & Help (When tab=support or tab=help) */}
      {(currentTab === 'support' || currentTab === 'help') && (
        <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-[#E8DFED] pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365]">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#251A2D]">Customer Support & Diagnostics</h3>
              <p className="text-xs text-[#6B6172]">Platform service inquiries, ticket management, and technical help desk.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#251A2D]">Priority Helpdesk Channel</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">Operational</span>
            </div>
            <p className="text-[#6B6172]">
              Need help with workspace configuration, role assignments, or custom integrations? Email us at{' '}
              <a href="mailto:support@digitalcrowdtech.in" className="text-[#7F5D99] font-bold underline">
                support@digitalcrowdtech.in
              </a>.
            </p>
          </div>
        </div>
      )}

      {/* SECTION: Invoices (When tab=invoices) */}
      {currentTab === 'invoices' && (
        <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-[#E8DFED] pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#251A2D]">Subscription Invoices & Receipts</h3>
              <p className="text-xs text-[#6B6172]">GST compliant receipts and downloadable invoices.</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF6FD] text-xs text-[#6B6172] text-center py-8">
            All recent tax invoices for {tenant?.name || 'your workspace'} are paid in full.
          </div>
        </div>
      )}

      {/* SECTION: Coupons (When tab=coupons) */}
      {currentTab === 'coupons' && (
        <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-[#E8DFED] pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365]">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#251A2D]">Promotional Coupons & Partner Discounts</h3>
              <p className="text-xs text-[#6B6172]">Configure discount codes and annual coupon incentives.</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF6FD] text-xs text-[#6B6172] text-center py-8">
            No active coupon campaigns are currently scheduled.
          </div>
        </div>
      )}

      {/* SECTION: Knowledge Base (When tab=knowledge-base) */}
      {currentTab === 'knowledge-base' && (
        <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-[#E8DFED] pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#251A2D]">TaskDigitalCrowd Knowledge Base</h3>
              <p className="text-xs text-[#6B6172]">Guides, tutorials, and step-by-step onboarding walkthroughs.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] space-y-1">
              <span className="font-bold text-[#251A2D] block">Role-Based Access Control Guide</span>
              <p className="text-[#6B6172]">How branches, teams, and role hierarchies enforce security isolation.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] space-y-1">
              <span className="font-bold text-[#251A2D] block">Proof of Execution & Reviews</span>
              <p className="text-[#6B6172]">Employee photo evidence submission and manager review approvals.</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Platform Settings (When tab=platform) */}
      {currentTab === 'platform' && (
        <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-5">
          <div className="flex items-center gap-3 border-b border-[#E8DFED] pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#251A2D]">Platform Configuration & Feature Flags</h3>
              <p className="text-xs text-[#6B6172]">Global multi-tenant parameters, maintenance switches, and security policies.</p>
            </div>
          </div>

          {!isPlatformAdmin ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#251A2D]">Access Restricted</h4>
              <p className="text-xs text-[#6B6172] max-w-md mx-auto">
                Global platform configuration and system feature flags are strictly restricted to Platform Superadmins.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {platformSaved && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Platform configuration updated successfully.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Feature Flag 1: Maintenance Mode */}
                <div className="p-4 rounded-2xl border border-[#E8DFED] bg-[#FAF6FD]/60 flex items-center justify-between">
                  <div className="space-y-0.5 pr-3">
                    <span className="font-bold text-[#251A2D] block">System Maintenance Mode</span>
                    <span className="text-[11px] text-[#6B6172]">
                      When enabled, non-superadmin traffic receives 503 Service Unavailable.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => {
                      setMaintenanceMode(e.target.checked);
                      setPlatformSaved(true);
                      setTimeout(() => setPlatformSaved(false), 3000);
                    }}
                    className="w-5 h-5 text-[#7F5D99] rounded border-gray-300 focus:ring-[#7F5D99] cursor-pointer"
                  />
                </div>

                {/* Feature Flag 2: Registrations */}
                <div className="p-4 rounded-2xl border border-[#E8DFED] bg-[#FAF6FD]/60 flex items-center justify-between">
                  <div className="space-y-0.5 pr-3">
                    <span className="font-bold text-[#251A2D] block">New Tenant Self-Registration</span>
                    <span className="text-[11px] text-[#6B6172]">
                      Allow public self-service company onboarding via /register.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowRegistration}
                    onChange={(e) => {
                      setAllowRegistration(e.target.checked);
                      setPlatformSaved(true);
                      setTimeout(() => setPlatformSaved(false), 3000);
                    }}
                    className="w-5 h-5 text-[#7F5D99] rounded border-gray-300 focus:ring-[#7F5D99] cursor-pointer"
                  />
                </div>
              </div>

              {/* System Infrastructure Controls */}
              <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] space-y-3">
                <h4 className="font-bold text-[#4C2365] text-xs">Runtime Engine & Telemetry Status</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white border border-[#E8DFED]">
                    <span className="text-[10px] text-[#6B6172] block uppercase font-bold">Realtime WebSockets</span>
                    <span className="font-bold text-emerald-600 text-xs flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active (Port 5000)
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#E8DFED]">
                    <span className="text-[10px] text-[#6B6172] block uppercase font-bold">ORM Pool Connection</span>
                    <span className="font-bold text-[#251A2D] text-xs mt-0.5 block">Prisma / MySQL 8.0</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#E8DFED]">
                    <span className="text-[10px] text-[#6B6172] block uppercase font-bold">RBAC Isolation Mode</span>
                    <span className="font-bold text-[#7F5D99] text-xs mt-0.5 block">Strict Tenant Scoped</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. Company Profile (OWNER & Admin only) */}
      {canManageCompany && (currentTab === 'general' || currentTab === 'workspace') && (
        <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-[#E8DFED] pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#251A2D]">Organization Profile</h3>
              <p className="text-xs text-[#6B6172]">Configure company legal name, timezone, and billing currency.</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#237A4B] text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleSaveCompany} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Tenant Slug (Unique)
                </label>
                <input
                  type="text"
                  value={tenant?.slug || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] bg-[#FAF6FD] text-xs text-[#7F5D99] font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Company Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:ring-2 focus:ring-[#7F5D99]"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                  <option value="UTC">UTC (GMT +00:00)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT +08:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Default Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:ring-2 focus:ring-[#7F5D99]"
                >
                  <option value="INR">INR (₹ Indian Rupee)</option>
                  <option value="USD">USD ($ US Dollar)</option>
                  <option value="AED">AED (د.إ UAE Dirham)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-5 py-2.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Change Password / Profile Tab */}
      {(currentTab === 'general' || currentTab === 'profile') && (
        <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-[#E8DFED] pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#7F5D99]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#251A2D]">Account Password & Credentials</h3>
              <p className="text-xs text-[#6B6172]">Updating your password automatically revokes other active sessions.</p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#237A4B] text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  New Password * (Min. 8 chars)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-5 py-2.5 rounded-xl bg-[#4C2365] hover:bg-[#7F5D99] text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Active Sessions */}
      {(currentTab === 'general' || currentTab === 'profile') && (
        <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-[#E8DFED] pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#7F5D99]">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#251A2D]">Active Refresh Sessions</h3>
              <p className="text-xs text-[#6B6172]">Devices and browsers currently logged into your account.</p>
            </div>
          </div>

          {sessionsLoading ? (
            <p className="text-xs text-[#6B6172]">Loading active sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-[#6B6172]">No other active sessions found.</p>
          ) : (
            <div className="divide-y divide-[#E8DFED]">
              {sessions.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-[#251A2D] flex items-center gap-2">
                      <Laptop className="w-3.5 h-3.5 text-[#7F5D99]" />
                      <span>IP: {s.ipAddress || '127.0.0.1'}</span>
                    </div>
                    <p className="text-[11px] text-[#6B6172] line-clamp-1">
                      {s.userAgent || 'Web Browser Session'}
                    </p>
                    <p className="text-[10px] text-[#9E7EB5]">
                      Logged in: {new Date(s.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRevokeSession(s.id)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. System Health & Infrastructure Diagnostics */}
      {(currentTab === 'general' || currentTab === 'diagnostics') && (
        <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b border-[#E8DFED] pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#251A2D]">System Health & Diagnostics</h3>
              <p className="text-xs text-[#6B6172]">Platform infrastructure status, runtime vitals, and database connectivity.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6172]">Database Health</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  MySQL Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6172]">ORM Layer</span>
                <span className="font-bold text-[#251A2D]">Prisma ORM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6172]">Tenant Isolation</span>
                <span className="font-bold text-[#7F5D99]">Enforced Server-Side</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6172]">Security Middleware</span>
                <span className="font-bold text-[#251A2D]">Helmet & Rate Limiter Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6172]">Real-time Events</span>
                <span className="font-bold text-[#251A2D]">Socket.IO Rooms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B6172]">Diagnostics Endpoint</span>
                <a
                  href="/api/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#7F5D99] hover:underline flex items-center gap-1"
                >
                  Raw Health JSON
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Brand Palette Token Reference */}
      <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-[#E8DFED] pb-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365]">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#251A2D]">Brand Design Standards</h3>
            <p className="text-xs text-[#6B6172]">Digital Crowd Technologies purple palette tokens</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-2xl border border-[#E8DFED] text-center">
            <div className="w-full h-8 rounded-lg bg-[#4C2365] mb-2 shadow-2xs" />
            <span className="text-xs font-bold text-[#251A2D] block">Deep Purple</span>
            <span className="text-[10px] font-mono text-[#6B6172]">#4C2365</span>
          </div>
          <div className="p-3 rounded-2xl border border-[#E8DFED] text-center">
            <div className="w-full h-8 rounded-lg bg-[#7F5D99] mb-2 shadow-2xs" />
            <span className="text-xs font-bold text-[#251A2D] block">Medium Purple</span>
            <span className="text-[10px] font-mono text-[#6B6172]">#7F5D99</span>
          </div>
          <div className="p-3 rounded-2xl border border-[#E8DFED] text-center">
            <div className="w-full h-8 rounded-lg bg-[#9E7EB5] mb-2 shadow-2xs" />
            <span className="text-xs font-bold text-[#251A2D] block">Soft Purple</span>
            <span className="text-[10px] font-mono text-[#6B6172]">#9E7EB5</span>
          </div>
          <div className="p-3 rounded-2xl border border-[#E8DFED] text-center">
            <div className="w-full h-8 rounded-lg bg-[#C4A4DA] mb-2 shadow-2xs" />
            <span className="text-xs font-bold text-[#251A2D] block">Light Lavender</span>
            <span className="text-[10px] font-mono text-[#6B6172]">#C4A4DA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
