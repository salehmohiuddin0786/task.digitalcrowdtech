'use client';

import React from 'react';
import { Menu, Search, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NotificationCenter from './NotificationCenter';

export default function Header({ onMenuClick, title = 'Dashboard Overview' }) {
  const { user, role, quickDemoLogin } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-[#E8DFED]">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl text-[#6B6172] hover:text-[#4C2365] hover:bg-[#F2EDF7] lg:hidden cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#4C2365] tracking-tight">{title}</h2>
          <p className="text-[11px] text-[#6B6172] hidden sm:block">
            Assign Tasks. Track Progress. Get Work Done.
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Demo Role Switcher (Crucial for testing all 4 roles effortlessly) */}
        <div className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-[#FAF6FD] border border-[#E8DFED]">
          <span className="text-[11px] font-semibold text-[#6B6172] px-2 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-[#7F5D99]" />
            Role:
          </span>
          {['OWNER', 'BRANCH_MANAGER', 'TEAM_LEADER', 'EMPLOYEE'].map((r) => {
            const labels = {
              OWNER: 'Owner',
              BRANCH_MANAGER: 'Manager',
              TEAM_LEADER: 'Lead',
              EMPLOYEE: 'Employee',
            };
            const isActive = role === r;
            return (
              <button
                key={r}
                onClick={() => quickDemoLogin(r)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#7F5D99] text-white shadow-xs'
                    : 'text-[#6B6172] hover:text-[#4C2365] hover:bg-[#F2EDF7]'
                }`}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>

        {/* Notifications */}
        <NotificationCenter />

        {/* Profile Chip */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#E8DFED]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4C2365] to-[#7F5D99] flex items-center justify-center font-bold text-xs text-white shadow-xs">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-[#251A2D] truncate">{user?.fullName}</div>
            <div className="text-[10px] text-[#7F5D99] font-medium">{user?.email}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
