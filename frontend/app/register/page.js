'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, AlertCircle, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const res = await register({
      companyName,
      fullName,
      email,
      password,
      phone,
    });
    if (!res.success) {
      setError(res.message || 'Registration failed');
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
          Register Company Workspace
        </h2>
        <p className="mt-1 text-xs text-[#6B6172]">
          Set up multi-tenant task tracking and employee branches in minutes.
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

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5">
                Company / Business Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Retail Solutions Pvt Ltd"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99] focus:border-[#7F5D99]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5">
                Owner Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99] focus:border-[#7F5D99]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5">
                Business Work Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@acmeretail.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99] focus:border-[#7F5D99]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99] focus:border-[#7F5D99]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#251A2D] uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFED] text-sm text-[#251A2D] focus:outline-hidden focus:ring-2 focus:ring-[#7F5D99] focus:border-[#7F5D99]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Provisioning Workspace...' : 'Create Company Workspace'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#6B6172]">
            Already have a registered company account?{' '}
            <Link href="/login" className="font-bold text-[#7F5D99] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
