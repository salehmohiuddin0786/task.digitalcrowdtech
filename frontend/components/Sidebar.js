'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LogOut,
  ChevronRight,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  X,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAuthorizedNavigation, ROLE_DISPLAY_LABELS } from '@/lib/navigation';

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, tenant, role, permissions, unreadCount, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = getAuthorizedNavigation(user, role, permissions, tenant);

  // Helper to determine if a nav link is active
  const isItemActive = (item) => {
    if (!pathname) return false;
    const [itemPath, itemQuery] = item.href.split('?');

    if (itemQuery) {
      // Must match both path and query parameters
      if (pathname !== itemPath) return false;
      const targetParams = new URLSearchParams(itemQuery);
      let match = true;
      targetParams.forEach((val, key) => {
        if (searchParams?.get(key) !== val) {
          match = false;
        }
      });
      return match;
    }

    if (item.exact) {
      if (pathname !== itemPath) return false;
      // If the current URL has search params (e.g. ?tab=tenants), exact /dashboard should NOT be highlighted
      const currentTab = searchParams?.get('tab');
      return !currentTab;
    }

    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  };

  const isSuperAdminMode = Boolean(user?.isPlatformAdmin && (!role || role === 'SUPER_ADMIN'));
  const currentRoleLabel = ROLE_DISPLAY_LABELS[role] || (isSuperAdminMode ? 'Platform Superadmin' : 'Member');

  return (
    <>
      {/* 1. Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* 2. Responsive Sidebar (Desktop Fixed + Mobile Drawer) */}
      <aside
        aria-label="Application Sidebar Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#4C2365] text-white flex flex-col transition-all duration-300 ease-in-out shadow-xl lg:shadow-none ${
          // Mobile state: slide in / out
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop width: collapsed vs expanded
          isCollapsed ? 'lg:w-20 w-72' : 'w-72'
        }`}
      >
        {/* Brand Header & Toggle */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-2">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 overflow-hidden group focus:outline-hidden focus:ring-2 focus:ring-[#C4A4DA] rounded-xl"
          >
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-[#7F5D99] to-[#C4A4DA] flex items-center justify-center font-extrabold text-xl text-white shadow-md group-hover:scale-105 transition-transform">
              T
            </div>
            {!isCollapsed && (
              <div className="truncate animate-fadeIn">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-tight truncate">
                  TaskDigitalCrowd
                </h1>
                <p className="text-[10px] text-[#C4A4DA] font-semibold tracking-wide uppercase truncate">
                  Digital Crowd Tech
                </p>
              </div>
            )}
          </Link>

          {/* Desktop Collapse / Expand Button */}
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            {isCollapsed ? (
              <PanelLeft className="w-4 h-4 text-[#C4A4DA]" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-[#C4A4DA]" />
            )}
          </button>

          {/* Mobile Drawer Close Button */}
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tenant / Scope Context Pill */}
        {!isCollapsed ? (
          <div className="px-4 pt-3 pb-1">
            {isSuperAdminMode ? (
              <div className="p-2.5 rounded-xl bg-purple-900/60 border border-purple-400/30 flex items-center justify-between gap-2 shadow-2xs">
                <div className="truncate">
                  <span className="block text-[9px] text-[#C4A4DA] uppercase tracking-wider font-bold">
                    Platform Scope
                  </span>
                  <span className="text-xs font-bold text-white truncate block">
                    Global Superadmin
                  </span>
                </div>
                <span className="px-2 py-0.5 text-[9px] uppercase font-extrabold tracking-wider bg-emerald-600 text-white rounded-md shadow-2xs shrink-0">
                  Master
                </span>
              </div>
            ) : tenant ? (
              <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between gap-2 shadow-2xs">
                <div className="truncate">
                  <span className="block text-[9px] text-[#C4A4DA] uppercase tracking-wider font-bold">
                    Active Workspace
                  </span>
                  <span className="text-xs font-bold text-white truncate block">
                    {tenant.name}
                  </span>
                </div>
                <span className="px-2 py-0.5 text-[9px] uppercase font-extrabold tracking-wider bg-[#7F5D99] text-white rounded-md shrink-0">
                  {tenant.planTier || 'Starter'}
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="hidden lg:flex justify-center py-2.5 border-b border-white/5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSuperAdminMode ? 'bg-emerald-400' : 'bg-[#C4A4DA]'
              }`}
              title={isSuperAdminMode ? 'Platform Superadmin' : tenant?.name || 'Workspace'}
            />
          </div>
        )}

        {/* Dynamic Navigation Items */}
        <nav
          className="flex-1 px-3 py-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20"
          role="navigation"
        >
          {navItems.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            const showBadge = (item.hasBadge || item.key === 'notifications') && unreadCount > 0;

            return (
              <div key={item.key || item.href} className="relative group">
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl transition-all outline-hidden focus:ring-2 focus:ring-[#C4A4DA] ${
                    isCollapsed
                      ? 'p-3 justify-center'
                      : 'px-3.5 py-2.5 text-xs sm:text-sm font-medium'
                  } ${
                    active
                      ? 'bg-[#7F5D99] text-white shadow-md font-bold'
                      : 'text-white/80 hover:bg-[#7F5D99]/40 hover:text-white'
                  }`}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Icon
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                        active ? 'text-white' : 'text-[#C4A4DA] group-hover:text-white'
                      }`}
                    />
                    {/* Collapsed dot badge */}
                    {isCollapsed && showBadge && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-[#4C2365]" />
                    )}
                  </div>

                  {/* Expanded Item Label */}
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 truncate tracking-tight">{item.label}</span>
                      {showBadge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white shrink-0">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                      {active && <ChevronRight className="w-3.5 h-3.5 text-[#C4A4DA] shrink-0" />}
                    </>
                  )}
                </Link>

                {/* Collapsed Hover Tooltip */}
                {isCollapsed && (
                  <div
                    role="tooltip"
                    className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg bg-[#251A2D] text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-white/10 z-60 items-center gap-1.5 pointer-events-none animate-fadeIn"
                  >
                    <span>{item.label}</span>
                    {showBadge && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#251A2D]" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Card & Sign Out */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/dashboard/settings?tab=profile"
              onClick={onClose}
              className={`flex items-center gap-2.5 truncate rounded-xl p-1 hover:bg-white/10 transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#C4A4DA] ${
                isCollapsed ? 'justify-center w-full' : 'flex-1'
              }`}
              title={user?.fullName || 'My Account Profile'}
            >
              <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-tr from-[#7F5D99] to-[#C4A4DA] flex items-center justify-center text-xs font-bold text-white shadow-xs">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              {!isCollapsed && (
                <div className="truncate text-left leading-tight">
                  <div className="text-xs font-bold text-white truncate">{user?.fullName || 'User'}</div>
                  <div className="text-[10px] text-[#C4A4DA] flex items-center gap-1 font-medium truncate mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-[#C4A4DA] shrink-0" />
                    <span className="truncate">{currentRoleLabel}</span>
                  </div>
                </div>
              )}
            </Link>

            {!isCollapsed && (
              <button
                onClick={logout}
                title="Sign Out"
                aria-label="Sign out of application"
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-rose-500/20 hover:text-rose-200 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
