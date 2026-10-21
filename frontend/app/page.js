import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Building2,
  ShieldCheck,
  Zap,
  Clock,
  Camera,
  Layers,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';

export default function LandingPage() {
  const plans = [
    {
      name: 'Starter',
      price: '₹499',
      period: '/ month',
      description: 'Ideal for single branch retail stores and small local operations.',
      badge: 'Launch Tier',
      features: ['Up to 5 Users', '1 Branch Location', 'Task Assignment & Checklists', 'Basic Activity Audit', 'Email Support'],
      highlighted: false,
    },
    {
      name: 'Business',
      price: '₹1,499',
      period: '/ month',
      description: 'Built for growing operations managing multiple locations.',
      badge: 'Most Popular',
      features: [
        'Up to 20 Users',
        '3 Branch Locations',
        'Photo & Video Proof of Work',
        'Task Approval Workflow',
        'Priority Reminders & Alerts',
        'Exportable CSV Reports',
      ],
      highlighted: true,
    },
    {
      name: 'Growth',
      price: '₹2,999',
      period: '/ month',
      description: 'Full corporate agility for multi-city retail chains and franchises.',
      badge: 'High Performance',
      features: [
        'Up to 50 Users',
        '10 Branch Locations',
        'Automated Recurring Tasks',
        'Role-Based Granular Permissions',
        'Real-time Socket.IO Alerts',
        'Dedicated Priority SLA',
      ],
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6FA] text-[#251A2D] flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E8DFED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="TaskDigitalCrowd - Digital Crowd Technologies"
              className="h-10 sm:h-12 object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#6B6172]">
            <a href="#features" className="hover:text-[#4C2365] transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-[#4C2365] transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-[#4C2365] transition-colors">
              Pricing Plans
            </a>
            <a
              href="https://digitalcrowdtech.in/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#4C2365] transition-colors"
            >
              Company
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs sm:text-sm font-bold text-[#4C2365] hover:text-[#7F5D99] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl bg-[#7F5D99] hover:bg-[#4C2365] text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF6FD] border border-[#C4A4DA] text-xs font-bold text-[#4C2365] mb-6 shadow-2xs">
            <Award className="w-3.5 h-3.5 text-[#7F5D99]" />
            Multi-Tenant Business Task Board Manager
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#251A2D] max-w-4xl mx-auto leading-tight">
            Assign Tasks. Track Progress.{' '}
            <span className="text-[#4C2365] underline decoration-[#C4A4DA] decoration-4 underline-offset-8">
              Get Work Done.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-[#6B6172] max-w-2xl mx-auto font-normal">
            Empower your store managers, teams, and field personnel with clear task instructions,
            verifiable photo/video evidence, and real-time completion tracking.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#4C2365] hover:bg-[#7F5D99] text-white font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Register Your Company <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white border border-[#E8DFED] text-[#4C2365] hover:bg-[#FAF6FD] font-bold text-sm sm:text-base transition-all shadow-xs"
            >
              Explore Live Demo
            </Link>
          </div>

          {/* Feature Highlights Banner */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white border border-[#E8DFED] shadow-xs">
              <Building2 className="w-6 h-6 text-[#7F5D99] mb-2" />
              <div className="font-bold text-sm text-[#251A2D]">Multi-Branch Control</div>
              <div className="text-xs text-[#6B6172]">Centrally monitor all your stores & locations</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E8DFED] shadow-xs">
              <Camera className="w-6 h-6 text-[#7F5D99] mb-2" />
              <div className="font-bold text-sm text-[#251A2D]">Proof of Work</div>
              <div className="text-xs text-[#6B6172]">Photo and video evidence validation</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E8DFED] shadow-xs">
              <Clock className="w-6 h-6 text-[#7F5D99] mb-2" />
              <div className="font-bold text-sm text-[#251A2D]">Recurring SOPs</div>
              <div className="text-xs text-[#6B6172]">Daily, weekly, and custom automated schedules</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E8DFED] shadow-xs">
              <Zap className="w-6 h-6 text-[#7F5D99] mb-2" />
              <div className="font-bold text-sm text-[#251A2D]">Live Socket Sync</div>
              <div className="text-xs text-[#6B6172]">Instant updates & in-website notification center</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white border-t border-[#E8DFED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#7F5D99] uppercase tracking-widest">
              Simple, Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#4C2365] mt-2">
              Plans Built for Modern Multi-Unit Businesses
            </h2>
            <p className="text-sm sm:text-base text-[#6B6172] mt-3">
              Scale smoothly from your first branch location to a nationwide chain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((p, i) => (
              <div
                key={i}
                className={`relative rounded-3xl p-8 transition-all duration-200 flex flex-col justify-between ${
                  p.highlighted
                    ? 'bg-gradient-to-b from-[#FAF6FD] to-white border-2 border-[#7F5D99] shadow-xl'
                    : 'bg-white border border-[#E8DFED] shadow-sm hover:shadow-md'
                }`}
              >
                {p.badge && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      p.highlighted ? 'bg-[#7F5D99] text-white shadow-md' : 'bg-[#FAF6FD] border border-[#C4A4DA] text-[#4C2365]'
                    }`}
                  >
                    {p.badge}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-[#251A2D]">{p.name}</h3>
                  <p className="text-xs text-[#6B6172] mt-1.5 min-h-[36px]">{p.description}</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-[#4C2365]">{p.price}</span>
                    <span className="text-xs text-[#6B6172] font-semibold">{p.period}</span>
                  </div>

                  <ul className="mt-8 space-y-3">
                    {p.features.map((feat, fi) => (
                      <li key={fi} className="flex items-center gap-2.5 text-xs text-[#251A2D] font-medium">
                        <CheckCircle2 className="w-4 h-4 text-[#237A4B] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-[#E8DFED]">
                  <Link
                    href="/register"
                    className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-center block transition-all ${
                      p.highlighted
                        ? 'bg-[#7F5D99] hover:bg-[#4C2365] text-white shadow-md'
                        : 'bg-[#FAF6FD] hover:bg-[#F2EDF7] text-[#4C2365] border border-[#E8DFED]'
                    }`}
                  >
                    Select {p.name} Plan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#4C2365] text-white py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <div className="text-lg font-bold">TaskDigitalCrowd</div>
            <p className="text-xs text-[#C4A4DA] mt-0.5">
              Owned and operated by{' '}
              <a
                href="https://digitalcrowdtech.in/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white"
              >
                Digital Crowd Technologies
              </a>
            </p>
          </div>

          <div className="text-xs text-[#C4A4DA]">
            © 2026 Digital Crowd Technologies. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
