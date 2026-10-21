'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NotificationCenter from './NotificationCenter';

export default function Header({ onMenuClick, title = 'Dashboard Overview' }) {
  const { user } = useAuth();

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
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notifications */}
        <NotificationCenter />

        {/* Profile Chip */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-[#E8DFED]">
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
