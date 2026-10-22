'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChefHat, 
  LayoutDashboard, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Smartphone, 
  CheckCircle2
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center font-black text-white shadow-md">
              QD
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              QR Dine <span className="text-amber-500">SaaS</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs font-semibold">
            <Link
              href="/admin"
              className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 transition-all"
            >
              Merchant Login
            </Link>
            <Link
              href="/r/spice-garden/t/4"
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-all flex items-center space-x-1.5"
            >
              <span>Try Live Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 text-center overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Complete QR Ordering &amp; Kitchen OS for Restaurants</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Turn every dining table into an <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">instant checkout</span>
          </h1>

          <p className="text-base text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Customers scan table QR codes to view dishes, order food, and pay instantly via UPI or at the counter. Zero app downloads. Zero waiter delays.
          </p>

          {/* Quick Portal Switcher Pills */}
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/r/spice-garden/t/4"
              className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-xl shadow-amber-600/20 flex items-center space-x-2 transition-all active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>Customer Mobile Menu (Table 4)</span>
            </Link>

            <Link
              href="/staff/kds"
              className="px-5 py-3 rounded-2xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-200 font-bold text-sm shadow-md flex items-center space-x-2 transition-all active:scale-95"
            >
              <ChefHat className="w-4 h-4 text-amber-400" />
              <span>Kitchen Display System (KDS)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Platform Portals Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12 border-t border-stone-850">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-white">Explore the 4 Connected Portals</h2>
          <p className="text-xs text-stone-400 mt-1">
            Built as a unified multi-tenant platform for customers, chefs, owners, and SaaS operators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Customer */}
          <Link
            href="/r/spice-garden/t/4"
            className="group p-5 rounded-3xl bg-stone-900/80 border border-stone-800 hover:border-amber-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                1. Customer Mobile Web
              </h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Mobile-first QR catalog with veg/non-veg filters, cart drawer, UPI checkout &amp; live order tracking.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between text-xs font-semibold text-amber-500">
              <span>Launch Table 4</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Kitchen */}
          <Link
            href="/staff/kds"
            className="group p-5 rounded-3xl bg-stone-900/80 border border-stone-800 hover:border-blue-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">
                2. Kitchen Display (KDS)
              </h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Real-time tickets with cooking chimes, elapsed prep timers, and instant one-tap status updates.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between text-xs font-semibold text-blue-400">
              <span>Open KDS Screen</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Owner */}
          <Link
            href="/admin"
            className="group p-5 rounded-3xl bg-stone-900/80 border border-stone-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors">
                3. Restaurant Owner
              </h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Sales KPI dashboard, stock toggle (86 dishes), price editor, and printable table QR generator.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>View Admin Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Super Admin */}
          <Link
            href="/super-admin"
            className="group p-5 rounded-3xl bg-stone-900/80 border border-stone-800 hover:border-purple-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-white group-hover:text-purple-400 transition-colors">
                4. SaaS Super-Admin
              </h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Manage all restaurant tenants, configure recurring subscriptions (₹499/₹999), and track MRR.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between text-xs font-semibold text-purple-400">
              <span>Super Admin Portal</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Pricing Models Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 border-t border-stone-850">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-white">SaaS Pricing Plans for Restaurants</h2>
          <p className="text-xs text-stone-400 mt-1">
            Predictable recurring software fees with one-time setup onboarding
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Starter Plan */}
          <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Starter Tier
              </span>
              <h3 className="text-2xl font-black text-white mt-1">₹499 / mo</h3>
              <p className="text-xs text-stone-400 mt-1">Best for small cafes &amp; quick-service counters</p>

              <ul className="mt-6 space-y-2.5 text-xs text-stone-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Up to 10 Table QR Codes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Digital QR Menu with Images &amp; Veg Filters</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Pay-at-Counter Order Placement</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Owner Mobile Dashboard</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <span className="block text-[11px] text-stone-400 mb-2">+ ₹1,500 One-time Setup &amp; Table Tent Stand Printing</span>
              <Link
                href="/admin"
                className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Growth Plan */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-stone-900 to-amber-950/30 border-2 border-amber-600/80 shadow-xl flex flex-col justify-between relative">
            <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-amber-600 text-white font-extrabold text-[10px] tracking-wider uppercase">
              Most Popular
            </span>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Growth Tier
              </span>
              <h3 className="text-2xl font-black text-white mt-1">₹999 / mo</h3>
              <p className="text-xs text-stone-400 mt-1">For full-service dining restaurants &amp; bistros</p>

              <ul className="mt-6 space-y-2.5 text-xs text-stone-200">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Unlimited Tables &amp; Staff Logins</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Real-time Kitchen Display System (KDS) with Audio</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Instant UPI &amp; Card Gateway Verification</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Sales Ledger &amp; Item Stock (86) Controls</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <span className="block text-[11px] text-stone-400 mb-2">+ ₹2,500 Full Menu Digitization &amp; Onboarding</span>
              <Link
                href="/admin"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-md"
              >
                Choose Growth
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-850 py-8 px-4 text-center text-xs text-stone-400">
        <p>© 2026 QR Dine SaaS. Built with Next.js 14, Supabase, and Tailwind CSS.</p>
      </footer>
    </div>
  );
}
