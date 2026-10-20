'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Check,
  AlertCircle,
  Save,
  Users,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function RolesAndPermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [activePermissions, setActivePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { role: userRole } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.getRoles(),
        api.getAllPermissions(),
      ]);

      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data);
        if (rolesRes.data.length > 0 && !selectedRoleId) {
          setSelectedRoleId(rolesRes.data[0].id);
          loadRolePermissions(rolesRes.data[0].id);
        }
      }

      if (permsRes.success && permsRes.data) {
        setGroupedPermissions(permsRes.data.grouped || {});
      }
    } catch (err) {
      setErrorMsg('Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      const res = await api.getRolePermissions(roleId);
      if (res.success && res.data) {
        setActivePermissions(res.data.permissions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectRole = (roleId) => {
    setSelectedRoleId(roleId);
    setSuccessMsg('');
    setErrorMsg('');
    loadRolePermissions(roleId);
  };

  const togglePermission = (slug) => {
    // If Owner role, critical permissions cannot be unchecked
    const selectedRole = roles.find((r) => r.id === selectedRoleId);
    if (selectedRole?.name === 'OWNER' && ['settings.manage', 'members.manage', 'tasks.view', 'tasks.create'].includes(slug)) {
      setErrorMsg(`"${slug}" is a mandatory system permission for the Business Owner.`);
      return;
    }

    setErrorMsg('');
    setActivePermissions((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.updateRolePermissions(selectedRoleId, activePermissions);
      if (res.success) {
        setSuccessMsg(res.message || 'Permissions updated successfully.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update permissions.');
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isOwner = userRole === 'OWNER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight">
            Role-Based Access Control (RBAC)
          </h2>
          <p className="text-xs text-[#6B6172] mt-0.5">
            Configure system permissions, operational boundaries, and security enforcement.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Matrix'}
          </button>
        )}
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#237A4B] text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!isOwner && (
        <div className="p-4 rounded-2xl bg-[#FAF6FD] border border-[#C4A4DA] text-xs text-[#4C2365] flex items-center gap-2 font-medium">
          <Info className="w-4 h-4 text-[#7F5D99] shrink-0" />
          <span>
            You are viewing the permission matrix in read-only mode. Only the Business Owner can modify role permissions.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Role Selector List */}
        <div className="p-4 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-[#6B6172] uppercase tracking-wider px-2 mb-2">
            System Roles
          </h3>

          {roles.map((r) => {
            const isSelected = r.id === selectedRoleId;
            return (
              <button
                key={r.id}
                onClick={() => handleSelectRole(r.id)}
                className={`w-full p-3.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col gap-1 border ${
                  isSelected
                    ? 'bg-[#FAF6FD] border-[#7F5D99] shadow-xs'
                    : 'bg-white border-transparent hover:bg-[#FAF6FD]/60 hover:border-[#E8DFED]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      isSelected ? 'text-[#4C2365]' : 'text-[#251A2D]'
                    }`}
                  >
                    {r.label}
                  </span>
                  <span className="text-[10px] font-semibold text-[#7F5D99] bg-white px-2 py-0.5 rounded-full border border-[#E8DFED]">
                    {r.memberCount} users
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6172] line-clamp-1">{r.description}</p>
              </button>
            );
          })}
        </div>

        {/* Right 3 Cols: Permissions by Module */}
        <div className="lg:col-span-3 space-y-5">
          {selectedRole && (
            <div className="p-5 rounded-3xl bg-[#4C2365] text-white shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C4A4DA] tracking-widest block">
                  Configuring Role
                </span>
                <h3 className="text-lg font-bold text-white">{selectedRole.label}</h3>
                <p className="text-xs text-white/80 mt-0.5">{selectedRole.description}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-[#C4A4DA]">
                  {activePermissions.length}
                </span>
                <span className="text-[10px] uppercase block text-white/70">Granted</span>
              </div>
            </div>
          )}

          {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
            <div
              key={moduleName}
              className="p-5 rounded-3xl bg-white border border-[#E8DFED] shadow-xs space-y-3"
            >
              <div className="flex items-center gap-2 border-b border-[#E8DFED] pb-2">
                <span className="w-2 h-2 rounded-full bg-[#7F5D99]" />
                <h4 className="text-xs font-bold text-[#4C2365] uppercase tracking-wider">
                  {moduleName} Permissions
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {perms.map((p) => {
                  const isChecked = activePermissions.includes(p.slug);
                  return (
                    <label
                      key={p.id}
                      onClick={(e) => {
                        if (!isOwner) e.preventDefault();
                      }}
                      className={`p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                        isChecked
                          ? 'bg-[#FAF6FD] border-[#C4A4DA]'
                          : 'bg-white border-[#E8DFED] hover:border-[#9E7EB5]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={!isOwner}
                        onChange={() => togglePermission(p.slug)}
                        className="mt-1 w-4 h-4 rounded text-[#7F5D99] border-[#C4A4DA] focus:ring-[#7F5D99]"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#251A2D] font-mono">{p.slug}</div>
                        <div className="text-[11px] text-[#6B6172] mt-0.5">{p.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
