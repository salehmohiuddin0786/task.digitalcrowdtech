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
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { tenant, user, role, refreshSession } = useAuth();
  const searchParams = useSearchParams();
  const isDiagnostics = searchParams?.get('tab') === 'diagnostics' || role === 'SUPER_ADMIN';

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

  const canManageCompany = role === 'OWNER' || role === 'SUPER_ADMIN';

  useEffect(() => {
    if (tenant) {
      setCompanyName(tenant.name || '');
      setTimezone(tenant.timezone || 'Asia/Kolkata');
      setCurrency(tenant.currency || 'INR');
    }
    loadSessions();
  }, [tenant]);

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
          Workspace Settings & Security
        </h2>
        <p className="text-xs text-[#6B6172] mt-0.5">
          Organization parameters, active device sessions, and account credentials.
        </p>
      </div>

      {/* 1. Company Profile (OWNER only) */}
      {canManageCompany && (
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

      {/* 2. Change Password */}
      <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-[#E8DFED] pb-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#7F5D99]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#251A2D]">Account Password</h3>
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

      {/* 3. Active Sessions */}
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

      {/* 4. System Health & Infrastructure Diagnostics (When requested or for SuperAdmin) */}
      {isDiagnostics && (
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
