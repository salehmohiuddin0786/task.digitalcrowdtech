'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAuthorizedNavigation } from '@/lib/navigation';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, tenant, role, permissions, logout } = useAuth();

  const navItems = getAuthorizedNavigation(user, role, permissions);

  const roleLabels = {
    OWNER: 'Business Owner',
    BRANCH_MANAGER: 'Branch Manager',
    TEAM_LEADER: 'Team Leader',
    EMPLOYEE: 'Employee',
    SUPER_ADMIN: 'Super Admin',
    VIEWER: 'Auditor / Viewer',
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#4C2365] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7F5D99] to-[#C4A4DA] flex items-center justify-center font-bold text-xl text-white shadow-md">
              T
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                TaskDigitalCrowd
              </h1>
              <p className="text-[11px] text-[#C4A4DA] font-medium tracking-wide">
                Digital Crowd Technologies
              </p>
            </div>
          </div>

          {/* Active Tenant Workspace Pill / Platform Mode */}
          {user?.isPlatformAdmin && (!role || role === 'SUPER_ADMIN') ? (
            <div className="mt-4 p-2.5 rounded-xl bg-purple-900/50 backdrop-blur-xs border border-purple-400/30 flex items-center justify-between">
              <div className="truncate">
                <span className="block text-[10px] text-[#C4A4DA] uppercase tracking-wider font-semibold">
                  Global Scope
                </span>
                <span className="text-xs font-bold text-white truncate block">
                  Platform Admin
                </span>
              </div>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-emerald-700 text-white rounded-md">
                Master
              </span>
            </div>
          ) : tenant ? (
            <div className="mt-4 p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center justify-between">
              <div className="truncate">
                <span className="block text-[10px] text-[#C4A4DA] uppercase tracking-wider font-semibold">
                  Workspace
                </span>
                <span className="text-xs font-medium text-white truncate block">
                  {tenant.name}
                </span>
              </div>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-[#7F5D99] text-white rounded-md">
                {tenant.planTier || 'Starter'}
              </span>
            </div>
          ) : null}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href.split('?')[0] && (item.href.includes('?') ? (typeof window !== 'undefined' && window.location.search === item.href.slice(item.href.indexOf('?'))) : true);
            const Icon = item.icon;
            return (
              <Link
                key={item.key || item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#7F5D99] text-white shadow-sm font-semibold'
                    : 'text-white/80 hover:bg-[#7F5D99]/40 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#C4A4DA]'}`} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-[#C4A4DA]" />}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 truncate">
              <div className="w-9 h-9 rounded-full bg-[#7F5D99] flex items-center justify-center text-sm font-semibold text-white border border-white/20">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">{user?.fullName}</div>
                <div className="text-[11px] text-[#C4A4DA] flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3 text-[#C4A4DA]" />
                  {roleLabels[role] || role || 'Member'}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
