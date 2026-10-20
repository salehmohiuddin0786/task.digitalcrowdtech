'use client';

import React, { useState, useEffect } from 'react';
import { UserCircle, Shield, Building2, Mail, Phone } from 'lucide-react';
import { api } from '@/lib/api';

export default function EmployeesPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getMembers();
        if (res.success) setMembers(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight">
          Staff & Team Directory
        </h2>
        <p className="text-xs text-[#6B6172] mt-0.5">
          Active workspace users, assigned branches, and access levels.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((m) => (
          <div
            key={m.id}
            className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4 hover:border-[#9E7EB5] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7F5D99] to-[#C4A4DA] flex items-center justify-center font-bold text-white text-base shadow-xs">
                {m.user.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#251A2D]">{m.user.fullName}</h3>
                <span className="text-[11px] font-semibold text-[#7F5D99] bg-[#FAF6FD] px-2 py-0.5 rounded border border-[#E8DFED]">
                  {m.role.label}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-[#6B6172] pt-2 border-t border-[#E8DFED]">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#9E7EB5]" />
                <span className="truncate">{m.user.email}</span>
              </div>
              {m.branch && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-[#9E7EB5]" />
                  <span>{m.branch.name}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
