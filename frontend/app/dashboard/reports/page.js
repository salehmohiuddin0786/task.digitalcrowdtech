'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Building2,
  Users2,
  UserCheck,
  Medal,
  Award,
  Filter,
  History,
  Shield,
  Lock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function ReportsPage() {
  const { user, role, tenant } = useAuth();
  const searchParams = useSearchParams();
  const isAuditTab = searchParams?.get('tab') === 'audit';
  const isPlatformRole = Boolean(user?.isPlatformAdmin || role === 'SUPER_ADMIN' || role === 'SUPPORT_ADMIN' || role === 'BILLING_ADMIN');

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branches, setBranches] = useState([]);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBranchId) params.branchId = selectedBranchId;

      const [overviewRes, leaderboardRes, branchesRes] = await Promise.all([
        api.getOverviewReport(params),
        api.getEmployeeLeaderboard(params),
        api.getBranches().catch(() => ({ data: [] })),
      ]);

      if (overviewRes.success && overviewRes.data) {
        setReportData(overviewRes.data);
      }
      if (leaderboardRes.success && leaderboardRes.data) {
        setLeaderboard(leaderboardRes.data);
      }
      if (branchesRes.success && branchesRes.data) {
        setBranches(branchesRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    try {
      const csvText = await api.exportReportsCSV();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `TaskDigitalCrowd-Executive-Report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(err.message || 'Failed to download report');
    } finally {
      setDownloadingCsv(false);
    }
  };

  if (loading && !reportData) {
    return (
      <div className="p-12 text-center text-xs font-semibold text-[#6B6172]">
        Compiling organizational reports & productivity metrics...
      </div>
    );
  }

  const kpis = reportData?.kpis || {
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    onTimeRate: 100,
  };

  const statusDist = reportData?.statusDistribution || {};
  const priorityDist = reportData?.priorityDistribution || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8DFED]">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight flex items-center gap-2">
            {isAuditTab ? (
              <>
                <History className="w-6 h-6 text-[#7F5D99]" />
                Security & Platform Audit Logs
              </>
            ) : (
              <>
                <BarChart3 className="w-6 h-6 text-[#7F5D99]" />
                {isPlatformRole ? 'Organization Analytics & Operational Reports' : 'Reports & Operational Analytics'}
              </>
            )}
          </h1>
          <p className="text-xs text-[#6B6172] mt-0.5">
            {isAuditTab
              ? 'Immutable audit trail of authentication events, task approvals, role changes, and tenant access.'
              : isPlatformRole
              ? `Organization-wide operational rollups and analytics for ${tenant?.name || 'authorized organizations'}.`
              : 'Cross-branch KPIs, staff productivity leaderboards, and on-time task delivery ratios.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Branch / Scope Filter */}
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-[#E8DFED] bg-white text-[#251A2D] focus:outline-hidden"
          >
            <option value="">{isPlatformRole ? 'All Organization Units (Combined)' : 'All Branches'}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleDownloadCsv}
            disabled={downloadingCsv}
            className="px-3.5 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloadingCsv ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Platform Role Executive Badge */}
      {isPlatformRole && !isAuditTab && (
        <div className="p-3.5 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#4C2365] text-white flex items-center justify-center font-bold text-xs">
              HQ
            </div>
            <div>
              <span className="font-bold text-[#251A2D]">
                Platform Executive Scope: {tenant?.name || 'Digital Crowd Technologies'}
              </span>
              <p className="text-[11px] text-[#6B6172]">
                Aggregating branch operations, employee velocity, and deliverables across all enterprise workspaces.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-white border border-[#E8DFED] text-[10px] font-bold text-[#7F5D99] uppercase">
            {role} Mode
          </span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-[#6B6172] uppercase tracking-wider">
            Total Workload
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#4C2365]">
            {kpis.totalTasks}
          </div>
          <span className="text-[11px] text-[#7F5D99] font-medium block">Tasks created across units</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-[#7F5D99] uppercase tracking-wider">
            Completion Rate
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#7F5D99]">
            {kpis.completionRate}%
          </div>
          <span className="text-[11px] text-[#6B6172] font-medium block">
            {kpis.completedTasks} completed successfully
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            On-Time Delivery
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {kpis.onTimeRate}%
          </div>
          <span className="text-[11px] text-[#6B6172] font-medium block">Met agreed deadlines</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
            Overdue Tasks
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">
            {kpis.overdueTasks}
          </div>
          <span className="text-[11px] text-rose-600/80 font-medium block">Action required</span>
        </div>
      </div>

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider pb-2 border-b border-[#E8DFED]">
            Task Pipeline Distribution
          </h3>

          <div className="space-y-3">
            {[
              { key: 'PENDING', label: 'Pending Kickoff', color: 'bg-[#9E7EB5]' },
              { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-[#7F5D99]' },
              { key: 'SUBMITTED', label: 'Under Review', color: 'bg-[#4C2365]' },
              { key: 'CHANGES_REQUESTED', label: 'Changes Requested', color: 'bg-amber-500' },
              { key: 'COMPLETED', label: 'Completed', color: 'bg-emerald-600' },
              { key: 'CANCELLED', label: 'Cancelled', color: 'bg-zinc-400' },
            ].map((st) => {
              const count = statusDist[st.key] || 0;
              const percent = kpis.totalTasks > 0 ? Math.round((count / kpis.totalTasks) * 100) : 0;

              return (
                <div key={st.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#251A2D]">{st.label}</span>
                    <span className="font-bold text-[#4C2365]">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#FAF6FD] h-2 rounded-full overflow-hidden">
                    <div
                      className={`${st.color} h-full transition-all duration-300`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider pb-2 border-b border-[#E8DFED]">
            Urgency & Priority Weighting
          </h3>

          <div className="space-y-3">
            {[
              { key: 'URGENT', label: 'Urgent', color: 'bg-rose-600' },
              { key: 'HIGH', label: 'High Priority', color: 'bg-[#4C2365]' },
              { key: 'NORMAL', label: 'Normal Operational', color: 'bg-[#7F5D99]' },
              { key: 'LOW', label: 'Low Priority', color: 'bg-[#C4A4DA]' },
            ].map((pr) => {
              const count = priorityDist[pr.key] || 0;
              const percent = kpis.totalTasks > 0 ? Math.round((count / kpis.totalTasks) * 100) : 0;

              return (
                <div key={pr.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#251A2D]">{pr.label}</span>
                    <span className="font-bold text-[#4C2365]">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#FAF6FD] h-2 rounded-full overflow-hidden">
                    <div
                      className={`${pr.color} h-full transition-all duration-300`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Branch Performance Comparison */}
      <div className="rounded-3xl bg-white border border-[#E8DFED] overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between pb-2 border-b border-[#E8DFED]">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#7F5D99]" />
            <h3 className="text-sm font-bold text-[#4C2365]">Branch Operational Performance</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#251A2D]">
            <thead>
              <tr className="border-b border-[#E8DFED] text-[10px] text-[#6B6172] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3">Branch</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Total Tasks</th>
                <th className="py-2.5 px-3">Completed</th>
                <th className="py-2.5 px-3">Overdue</th>
                <th className="py-2.5 px-3">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFED]">
              {reportData?.branchBreakdown?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-xs text-[#6B6172] italic">
                    No branches configured.
                  </td>
                </tr>
              ) : (
                reportData?.branchBreakdown?.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FAF6FD]/60">
                    <td className="py-3 px-3 font-bold text-[#4C2365]">
                      {b.name} <span className="text-[10px] text-[#7F5D99]">({b.code})</span>
                    </td>
                    <td className="py-3 px-3 text-[#6B6172]">{b.city || 'HQ'}</td>
                    <td className="py-3 px-3 font-bold">{b.totalTasks}</td>
                    <td className="py-3 px-3 text-emerald-600 font-bold">{b.completedTasks}</td>
                    <td className="py-3 px-3 text-rose-600 font-bold">{b.overdueTasks}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#7F5D99] w-8">
                          {b.completionRate}%
                        </span>
                        <div className="w-24 bg-[#FAF6FD] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#7F5D99] h-full"
                            style={{ width: `${b.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Productivity Leaderboard */}
      <div className="rounded-3xl bg-white border border-[#E8DFED] overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between pb-2 border-b border-[#E8DFED]">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#7F5D99]" />
            <h3 className="text-sm font-bold text-[#4C2365]">Employee Productivity Leaderboard</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#251A2D]">
            <thead>
              <tr className="border-b border-[#E8DFED] text-[10px] text-[#6B6172] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Assigned</th>
                <th className="py-2.5 px-3">Completed</th>
                <th className="py-2.5 px-3">Overdue</th>
                <th className="py-2.5 px-3">Completion Rate</th>
                <th className="py-2.5 px-3">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFED]">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-6 text-center text-xs text-[#6B6172] italic">
                    No active staff members found.
                  </td>
                </tr>
              ) : (
                leaderboard.map((emp, idx) => (
                  <tr key={emp.userId} className="hover:bg-[#FAF6FD]/60">
                    <td className="py-3 px-3 font-bold text-[#7F5D99]">#{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#7F5D99] text-white font-bold text-[11px] flex items-center justify-center">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#251A2D]">{emp.fullName}</div>
                          <div className="text-[10px] text-[#6B6172]">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#6B6172]">{emp.role}</td>
                    <td className="py-3 px-3 font-bold">{emp.totalAssigned}</td>
                    <td className="py-3 px-3 text-emerald-600 font-bold">{emp.completed}</td>
                    <td className="py-3 px-3 text-rose-600 font-bold">{emp.overdue}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#7F5D99] w-8">
                          {emp.completionRate}%
                        </span>
                        <div className="w-20 bg-[#FAF6FD] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#7F5D99] h-full"
                            style={{ width: `${emp.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          emp.performanceTier === 'Top Performer'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : emp.performanceTier === 'On Track'
                            ? 'bg-purple-50 text-[#7F5D99] border border-purple-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {emp.performanceTier}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
