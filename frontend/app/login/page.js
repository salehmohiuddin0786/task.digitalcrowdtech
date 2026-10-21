'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

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

  return (
    <div className="min-h-screen bg-[#F8F6FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex flex-col items-center gap-2">
          <img
            src="/logo.png"
            alt="TaskDigitalCrowd - Digital Crowd Technologies"
            className="h-14 sm:h-16 object-contain mx-auto hover:opacity-95 transition-opacity"
          />
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
        </div>
      </div>
    </div>
  );
}
