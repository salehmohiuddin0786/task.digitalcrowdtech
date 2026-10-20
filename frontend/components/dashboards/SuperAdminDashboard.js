'use client';

import React from 'react';
import Link from 'next/link';
import {
  Server,
  Building2,
  Users2,
  CheckSquare,
  Activity,
  Cpu,
  ShieldCheck,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';

export default function SuperAdminDashboard({ data, onRefresh, loading }) {
  const metrics = data?.platformMetrics || {
    totalTenants: 0,
    activeTenants: 0,
    suspendedTenants: 0,
    totalUsers: 0,
    totalTasks: 0,
    systemUptime: 0,
    heapUsedMb: 0,
    rssMb: 0,
  };

  const recentTenants = data?.recentTenants || [];

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#251A2D] via-[#4C2365] to-[#7F5D99] text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-[#C4A4DA] inline-flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              Platform Administration
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Operational
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Platform Diagnostics & Infrastructure
          </h1>
          <p className="text-xs text-white/80 mt-1 max-w-xl">
            Global multi-tenant overview, real-time node process diagnostics, and cross-organization health.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Diagnostics
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Registered Tenants"
          value={metrics.totalTenants}
          subtitle={`${metrics.activeTenants} active organizations`}
          icon={Building2}
          color="purple"
        />
        <MetricCard
          title="Total SaaS Users"
          value={metrics.totalUsers}
          subtitle="Across all companies"
          icon={Users2}
          color="indigo"
        />
        <MetricCard
          title="Tasks Managed"
          value={metrics.totalTasks}
          subtitle="Global execution pool"
          icon={CheckSquare}
          color="emerald"
        />
        <MetricCard
          title="System Memory Heap"
          value={`${metrics.heapUsedMb} MB`}
          subtitle={`RSS: ${metrics.rssMb} MB`}
          icon={Cpu}
          color="amber"
        />
      </div>

      {/* Diagnostics & Tenant Directory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Cols): Recent Tenant Workspaces */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DFED]">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#7F5D99]" />
              <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                Tenant Organizations Directory ({recentTenants.length})
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-[#6B6172]">Multi-Tenant Isolation Active</span>
          </div>

          <div className="space-y-2.5">
            {recentTenants.length === 0 ? (
              <p className="text-xs text-[#6B6172] italic py-4">No organizations registered yet.</p>
            ) : (
              recentTenants.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-[#FAF6FD]/60 border border-[#E8DFED] hover:border-[#9E7EB5] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#4C2365]">{t.name}</span>
                      <span className="text-[10px] font-mono font-bold text-[#7F5D99] bg-white px-2 py-0.5 rounded-md border border-[#E8DFED]">
                        /{t.slug}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800">
                        {t.planTier}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B6172] mt-1 flex items-center gap-3 flex-wrap">
                      <span>Users: <strong>{t.userCount}</strong></span>
                      <span>Branches: <strong>{t.branchCount}</strong></span>
                      <span>Tasks: <strong>{t.taskCount}</strong></span>
                      <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold self-start sm:self-auto ${
                      t.isSuspended
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {t.isSuspended ? 'Suspended' : 'Healthy'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right (1 Col): Node Diagnostics & System Vitals */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E8DFED]">
              <Activity className="w-4 h-4 text-[#7F5D99]" />
              <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                Node Environment Vitals
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF6FD]">
                <span className="text-[#6B6172]">Server Uptime</span>
                <span className="font-bold text-[#251A2D]">{formatUptime(metrics.systemUptime)}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF6FD]">
                <span className="text-[#6B6172]">Database Health</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  MySQL Connected
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF6FD]">
                <span className="text-[#6B6172]">Platform Security</span>
                <span className="font-bold text-[#7F5D99]">Helmet & Rate Limiter Active</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF6FD]">
                <span className="text-[#6B6172]">Socket.IO Rooms</span>
                <span className="font-bold text-[#251A2D]">Authenticated Tenant Dispatch</span>
              </div>
            </div>

            <a
              href="/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-2 py-2 px-3 rounded-xl bg-[#FAF6FD] hover:bg-[#F2EDF7] border border-[#E8DFED] text-xs font-bold text-[#7F5D99] flex items-center justify-center gap-1.5 transition-colors"
            >
              Raw Health JSON API
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
