'use client';

import React, { useState, useEffect } from 'react';
import {
  Users2,
  Building2,
  Plus,
  UserPlus,
  Trash2,
  ShieldCheck,
  X,
  AlertCircle,
  Crown,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [branches, setBranches] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create team modal
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamBranchId, setTeamBranchId] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  // Assign member modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isLeader, setIsLeader] = useState(false);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { role } = useAuth();
  const canManage = role === 'OWNER' || role === 'SUPER_ADMIN' || role === 'BRANCH_MANAGER';

  const loadAll = async () => {
    setLoading(true);
    try {
      const [teamsRes, branchRes, memberRes] = await Promise.all([
        api.getTeams(),
        api.getBranches(),
        api.getMembers(),
      ]);
      if (teamsRes.success) setTeams(teamsRes.data || []);
      if (branchRes.success) setBranches(branchRes.data || []);
      if (memberRes.success) setMembers(memberRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.createTeam({
        name: teamName,
        branchId: teamBranchId || undefined,
        description: teamDesc,
      });

      if (res.success) {
        setIsTeamModalOpen(false);
        setTeamName('');
        setTeamBranchId('');
        setTeamDesc('');
        loadAll();
      }
    } catch (err) {
      setError(err.message || 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignMember = async (e) => {
    e.preventDefault();
    if (!selectedTeamId || !selectedMemberId) return;

    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.assignTeamMember(selectedTeamId, {
        memberId: selectedMemberId,
        isLeader,
      });

      if (res.success) {
        setIsAssignModalOpen(false);
        setSelectedMemberId('');
        setIsLeader(false);
        loadAll();
      }
    } catch (err) {
      setError(err.message || 'Failed to assign member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (teamId, memberId) => {
    if (!confirm('Remove member from this team?')) return;
    try {
      await api.removeTeamMember(teamId, memberId);
      loadAll();
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Delete this team?')) return;
    try {
      await api.deleteTeam(teamId);
      loadAll();
    } catch (err) {
      alert(err.message || 'Failed to delete team');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight">
            Operational Teams & Units
          </h2>
          <p className="text-xs text-[#6B6172] mt-0.5">
            Organize staff into operational squads, assign team leaders, and coordinate workflow.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsTeamModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((t) => (
          <div
            key={t.id}
            className="p-6 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-4 hover:border-[#9E7EB5] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-center text-[#7F5D99]">
                  <Users2 className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 text-xs font-bold bg-[#FAF6FD] text-[#7F5D99] rounded-lg border border-[#E8DFED]">
                    {t.memberCount} members
                  </span>
                  {canManage && (
                    <button
                      onClick={() => handleDeleteTeam(t.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                      title="Delete team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-[#251A2D]">{t.name}</h3>
              {t.description && (
                <p className="text-xs text-[#6B6172] mt-1 line-clamp-2">{t.description}</p>
              )}

              {t.branch && (
                <div className="text-xs text-[#7F5D99] flex items-center gap-1 font-semibold mt-2">
                  <Building2 className="w-3.5 h-3.5" />
                  {t.branch.name}
                </div>
              )}

              {/* Members List */}
              <div className="mt-4 pt-3 border-t border-[#E8DFED] space-y-2">
                <span className="text-[10px] font-bold text-[#6B6172] uppercase tracking-wider block">
                  Team Roster:
                </span>
                {t.members?.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No members assigned yet</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {t.members.map((tm) => (
                      <div
                        key={tm.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#FAF6FD] text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {tm.isLeader ? (
                            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Team Leader" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-[#7F5D99] shrink-0" />
                          )}
                          <span className="font-semibold text-[#251A2D] truncate">
                            {tm.member?.user?.fullName}
                          </span>
                        </div>
                        {canManage && (
                          <button
                            onClick={() => handleRemoveMember(t.id, tm.memberId)}
                            className="text-gray-400 hover:text-rose-500 p-1 cursor-pointer"
                            title="Remove from team"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action */}
            {canManage && (
              <div className="pt-3 border-t border-[#E8DFED]">
                <button
                  onClick={() => {
                    setSelectedTeamId(t.id);
                    setIsAssignModalOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-[#C4A4DA] bg-[#FAF6FD] hover:bg-[#F2EDF7] text-xs font-bold text-[#4C2365] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#7F5D99]" />
                  Assign Member
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Team Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DFED] overflow-hidden">
            <div className="px-6 py-4 bg-[#FAF6FD] border-b border-[#E8DFED] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#4C2365]">Create New Team</h3>
                <p className="text-xs text-[#6B6172]">Group members into operational squads.</p>
              </div>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-6 space-y-3.5">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Morning Shift Cashiers"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Assigned Branch Location
                </label>
                <select
                  value={teamBranchId}
                  onChange={(e) => setTeamBranchId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:ring-2 focus:ring-[#7F5D99]"
                >
                  <option value="">Company-Wide / All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Team Description
                </label>
                <textarea
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  rows={2}
                  placeholder="Operational responsibilities and duties..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] focus:ring-2 focus:ring-[#7F5D99]"
                />
              </div>

              <div className="pt-3 border-t border-[#E8DFED] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8DFED] text-xs font-semibold text-[#6B6172] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Member Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DFED] overflow-hidden">
            <div className="px-6 py-4 bg-[#FAF6FD] border-b border-[#E8DFED] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#4C2365]">Assign Staff to Team</h3>
                <p className="text-xs text-[#6B6172]">Select an employee to add to this squad.</p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignMember} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1">
                  Select Staff Member *
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFED] text-xs text-[#251A2D] bg-white focus:ring-2 focus:ring-[#7F5D99]"
                >
                  <option value="">Select an employee...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.user.fullName} ({m.role.label}) — {m.user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#251A2D] block">Designate as Team Leader</span>
                  <span className="text-[11px] text-[#6B6172]">Grants task review and progress tracking rights</span>
                </div>
                <input
                  type="checkbox"
                  checked={isLeader}
                  onChange={(e) => setIsLeader(e.target.checked)}
                  className="w-4 h-4 text-[#7F5D99] rounded border-[#C4A4DA] focus:ring-[#7F5D99]"
                />
              </div>

              <div className="pt-3 border-t border-[#E8DFED] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E8DFED] text-xs font-semibold text-[#6B6172] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Assigning...' : 'Assign to Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
