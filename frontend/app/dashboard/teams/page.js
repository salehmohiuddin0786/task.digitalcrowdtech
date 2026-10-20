'use client';

import React, { useState, useEffect } from 'react';
import { Users2, Building2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getTeams();
        if (res.success) setTeams(res.data || []);
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
          Operational Teams
        </h2>
        <p className="text-xs text-[#6B6172] mt-0.5">
          Functional teams and internal departments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((t) => (
          <div
            key={t.id}
            className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#7F5D99]">
              <Users2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#251A2D]">{t.name}</h3>
            {t.description && <p className="text-xs text-[#6B6172]">{t.description}</p>}
            {t.branch && (
              <div className="text-xs text-[#7F5D99] flex items-center gap-1 font-medium">
                <Building2 className="w-3.5 h-3.5" />
                {t.branch.name}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
