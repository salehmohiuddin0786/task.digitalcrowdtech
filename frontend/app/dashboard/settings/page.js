'use client';

import React from 'react';
import { Settings, ShieldCheck, Building2, Bell, Smartphone, Palette } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { tenant, user, role } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight">
          Workspace Settings
        </h2>
        <p className="text-xs text-[#6B6172] mt-0.5">
          Organization profile, brand standards, and notification parameters.
        </p>
      </div>

      {/* Brand Identity Card */}
      <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365]">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#251A2D]">Official Brand Identity</h3>
            <p className="text-xs text-[#6B6172]">TaskDigitalCrowd purple and lavender design system</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
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

      {/* Organization Info */}
      <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[#251A2D]">Company Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#6B6172] uppercase">Company Name</label>
            <div className="text-sm font-semibold text-[#251A2D] mt-1 p-2.5 rounded-xl bg-[#FAF6FD] border border-[#E8DFED]">
              {tenant?.name}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-[#6B6172] uppercase">Workspace Slug</label>
            <div className="text-sm font-mono text-[#7F5D99] mt-1 p-2.5 rounded-xl bg-[#FAF6FD] border border-[#E8DFED]">
              {tenant?.slug}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-[#6B6172] uppercase">Active Plan</label>
            <div className="text-sm font-bold text-[#4C2365] mt-1 p-2.5 rounded-xl bg-[#FAF6FD] border border-[#E8DFED] uppercase">
              {tenant?.planTier} Tier
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-[#6B6172] uppercase">Timezone</label>
            <div className="text-sm font-semibold text-[#251A2D] mt-1 p-2.5 rounded-xl bg-[#FAF6FD] border border-[#E8DFED]">
              {tenant?.timezone || 'Asia/Kolkata'}
            </div>
          </div>
        </div>
      </div>

      {/* Future Mobile Push & High-Vibration Notice */}
      <div className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#7F5D99]">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#251A2D]">Future Mobile Device Integration</h3>
            <p className="text-xs text-[#6B6172]">Backend architecture ready for native Android & iOS push</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] text-xs text-[#6B6172] space-y-1">
          <p>
            • The platform database and backend includes device token registry and priority alert routing ready for the future native mobile application.
          </p>
          <p>
            • Web push notifications will respect browser vibration capabilities where supported by user hardware and OS permissions.
          </p>
        </div>
      </div>
    </div>
  );
}
