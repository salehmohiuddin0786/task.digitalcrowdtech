'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Users, CheckSquare } from 'lucide-react';
import { api } from '@/lib/api';

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getBranches();
        if (res.success) setBranches(res.data || []);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight">
            Branch Locations
          </h2>
          <p className="text-xs text-[#6B6172] mt-0.5">
            Manage your stores, offices, and regional service hubs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((b) => (
          <div
            key={b.id}
            className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4 hover:border-[#9E7EB5] transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#4C2365]">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#FAF6FD] text-[#7F5D99] rounded-lg border border-[#E8DFED]">
                {b.code || 'MAIN'}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#251A2D]">{b.name}</h3>
              <p className="text-xs text-[#6B6172] flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#9E7EB5]" />
                {b.city}, {b.state || b.country}
              </p>
            </div>

            <div className="pt-4 border-t border-[#E8DFED] grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-[#FAF6FD]">
                <div className="text-xs font-bold text-[#4C2365]">{b._count?.members || 0}</div>
                <div className="text-[10px] text-[#6B6172]">Staff Members</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF6FD]">
                <div className="text-xs font-bold text-[#4C2365]">{b._count?.tasks || 0}</div>
                <div className="text-[10px] text-[#6B6172]">Active Tasks</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
