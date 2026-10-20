'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, quickDemoLogin } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const res = await login(email, password);
    if (!res.success) {
      setError(res.message || 'Login failed');
    }
    setIsSubmitting(false);
  };

  const handleQuickDemo = async (roleType) => {
    setError('');
    setIsSubmitting(true);
    const res = await quickDemoLogin(roleType);
    if (!res.success) {
      setError(res.message || 'Demo login failed');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F6FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4C2365] to-[#7F5D99] flex items-center justify-center font-bold text-2xl text-white shadow-md">
            T
          </div>
          <div className="text-left">
            <span className="font-extrabold text-xl text-[#4C2365] tracking-tight block">
              TaskDigitalCrowd
            </span>
            <span className="text-[10px] text-[#7F5D99] font-bold tracking-wider uppercase">
              Digital Crowd Technologies
            </span>
          </div>
        </Link>
        <h2 className="mt-6 text-2xl font-extrabold text-[#251A2D]">
          Sign in to your Workspace
        </h2>
        <p className="mt-1 text-xs text-[#6B6172]">
          Enter your business email and password to access your team tasks.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-[#E8DFED]">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5">
                Business Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99] focus:border-[#7F5D99]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider">
                  Password
                </label>
                <span className="text-xs text-[#7F5D99] hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99] focus:border-[#7F5D99]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-8 pt-6 border-t border-[#E8DFED]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#4C2365] mb-3">
              <Sparkles className="w-4 h-4 text-[#7F5D99]" />
              <span>Instant Demo Role Switcher:</span>
            </div>
            <p className="text-[11px] text-[#6B6172] mb-3">
              Click any role below to sign in instantly and test permissions:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('OWNER')}
                disabled={isSubmitting}
                className="p-2 rounded-xl bg-[#FAF6FD] hover:bg-[#F2EDF7] border border-[#E8DFED] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#4C2365]">Business Owner</div>
                <div className="text-[10px] text-[#6B6172]">admin@digitalcrowdtech.in</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('BRANCH_MANAGER')}
                disabled={isSubmitting}
                className="p-2 rounded-xl bg-[#FAF6FD] hover:bg-[#F2EDF7] border border-[#E8DFED] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#4C2365]">Branch Manager</div>
                <div className="text-[10px] text-[#6B6172]">manager@digitalcrowdtech.in</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('TEAM_LEADER')}
                disabled={isSubmitting}
                className="p-2 rounded-xl bg-[#FAF6FD] hover:bg-[#F2EDF7] border border-[#E8DFED] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#4C2365]">Team Leader</div>
                <div className="text-[10px] text-[#6B6172]">lead@digitalcrowdtech.in</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('EMPLOYEE')}
                disabled={isSubmitting}
                className="p-2 rounded-xl bg-[#FAF6FD] hover:bg-[#F2EDF7] border border-[#E8DFED] text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#4C2365]">Staff Employee</div>
                <div className="text-[10px] text-[#6B6172]">employee@digitalcrowdtech.in</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-[#6B6172]">
            Don't have an organization account?{' '}
            <Link href="/register" className="font-bold text-[#7F5D99] hover:underline">
              Register Company
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
