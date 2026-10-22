'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChefHat, 
  LayoutDashboard, 
  Sparkles, 
  ArrowRight, 
  Smartphone, 
  CheckCircle2,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Percent,
  Clock,
  Banknote,
  UtensilsCrossed,
  Store,
  ChevronRight,
  HelpCircle,
  X
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // Registration Modal & Form State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    restaurantName: '',
    fullName: '',
    phone: '',
    email: '',
    address: '',
    tables: '8',
  });

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: formData.restaurantName.trim(),
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to register restaurant');
      }

      // Success -> Redirect to Admin dashboard
      setIsRegisterOpen(false);
      router.push('/admin');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setRegError(msg);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-500 selection:text-white">
      {/* Top Banner: 0% Commission */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold py-2 px-4 text-center">
        <span>🚀 Zero Commission Table Ordering for Restaurants &amp; Cafes — Stop paying 30% aggregator cuts</span>
      </div>

      {/* Top Navigation Bar */}
      <header className="border-b border-stone-850 bg-stone-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-black text-white shadow-lg shadow-amber-600/30">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-white block leading-none">
                QR Dine <span className="text-amber-500">OS</span>
              </span>
              <span className="text-[10px] text-stone-400 font-medium">Smart Restaurant System</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-stone-300">
            <a href="#how-it-works" className="hover:text-amber-400 transition-colors">How It Works</a>
            <a href="#benefits" className="hover:text-amber-400 transition-colors">Why QR Dine</a>
            <a href="#portals" className="hover:text-amber-400 transition-colors">Live Demo</a>
            <a href="#pricing" className="hover:text-amber-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-amber-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center space-x-3 text-xs font-bold">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 transition-all hover:text-white"
            >
              Owner Login
            </Link>
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md shadow-amber-600/20 transition-all active:scale-95 flex items-center space-x-1.5"
            >
              <span>Register Restaurant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 text-center overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Turn Every Dining Table into an Instant Checkout</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Cut Waiter Delays. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
              Collect 100% Direct Profit
            </span> with Table QR Codes.
          </h1>

          <p className="text-base sm:text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Guests scan your table QR code, browse high-res dish photos, customize food, and order in seconds. Orders chime directly in your kitchen display, and payments flow straight into your UPI account.
          </p>

          {/* Value Highlights Pill Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-stone-400">
            <span className="flex items-center space-x-1.5 bg-stone-900/80 px-3 py-1.5 rounded-full border border-stone-800">
              <Percent className="w-3.5 h-3.5 text-emerald-400" />
              <span>0% Commission</span>
            </span>
            <span className="flex items-center space-x-1.5 bg-stone-900/80 px-3 py-1.5 rounded-full border border-stone-800">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Zero App Downloads</span>
            </span>
            <span className="flex items-center space-x-1.5 bg-stone-900/80 px-3 py-1.5 rounded-full border border-stone-800">
              <Banknote className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct Bank UPI / Cash</span>
            </span>
            <span className="flex items-center space-x-1.5 bg-stone-900/80 px-3 py-1.5 rounded-full border border-stone-800">
              <ChefHat className="w-3.5 h-3.5 text-blue-400" />
              <span>Real-Time Kitchen KDS</span>
            </span>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-6 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-sm shadow-xl shadow-amber-600/25 flex items-center space-x-2 transition-all active:scale-95"
            >
              <Store className="w-4 h-4" />
              <span>Register Your Restaurant Free</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <Link
              href="/r/spice-garden/t/4"
              className="px-6 py-3.5 rounded-2xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-200 font-bold text-sm shadow-md flex items-center space-x-2 transition-all active:scale-95 hover:text-white"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Try Live Customer Menu</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Real-time Demonstration Banner */}
      <section id="portals" className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-3xl bg-stone-900/70 border border-stone-800 p-6 sm:p-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">Interactive Live Test</span>
            <h2 className="text-2xl font-black text-white mt-1">Try the Full Live Restaurant Journey</h2>
            <p className="text-xs text-stone-400 mt-2">
              Open the Customer Menu on your phone and the Kitchen Screen on your laptop. Place an order on the phone and watch the kitchen ticket pop up instantly!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1: Customer */}
            <div className="p-5 rounded-2xl bg-stone-950/80 border border-stone-800 flex flex-col justify-between hover:border-amber-500/50 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300">Portal 1</span>
                </div>
                <h3 className="font-bold text-base text-white">1. Customer Table Menu</h3>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  Browse dishes with veg/non-veg filters, view photos, customize spice levels, order food, and pay.
                </p>
              </div>
              <Link
                href="/r/spice-garden/t/4"
                className="mt-6 w-full py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center justify-center space-x-1.5 border border-amber-500/30"
              >
                <span>Launch Table 4 Menu</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Step 2: Kitchen */}
            <div className="p-5 rounded-2xl bg-stone-950/80 border border-stone-800 flex flex-col justify-between hover:border-blue-500/50 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300">Portal 2</span>
                </div>
                <h3 className="font-bold text-base text-white">2. Cook Kitchen KDS</h3>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  Cooks hear chime alerts, tap &quot;Start Cooking&quot;, mark dishes &quot;Ready&quot;, and track order timers.
                </p>
              </div>
              <Link
                href="/staff/kds"
                className="mt-6 w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 font-bold text-xs flex items-center justify-center space-x-1.5 border border-blue-500/30"
              >
                <span>Open Kitchen Screen</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Step 3: Owner */}
            <div className="p-5 rounded-2xl bg-stone-950/80 border border-stone-800 flex flex-col justify-between hover:border-emerald-500/50 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">Portal 3</span>
                </div>
                <h3 className="font-bold text-base text-white">3. Owner Command Center</h3>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  Real-time sales revenue, cash/UPI collection badges, 86 out-of-stock dish toggles, and printable table QRs.
                </p>
              </div>
              <Link
                href="/admin"
                className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5 border border-emerald-500/30"
              >
                <span>Open Owner Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Restaurants Need This (Pain Points vs Solution) */}
      <section id="benefits" className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">The Problem &amp; Solution</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Why Traditional Menus Are Costing You Money</h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-2">
            Every minute your customers wait for a waiter is lost revenue and a frustrated diner.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old Traditional Restaurant */}
          <div className="p-6 sm:p-8 rounded-3xl bg-rose-950/20 border border-rose-900/40 space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-8 h-8 rounded-xl bg-rose-950/80 border border-rose-800 flex items-center justify-center font-bold">
                ✕
              </div>
              <h3 className="font-black text-lg text-white">The Old Paper Menu Way</h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-stone-300">
              <li className="flex items-start space-x-2.5">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Customers wait 10-15 minutes just to get a waiter&apos;s attention during peak lunch/dinner rushes.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Price changes or sold-out dishes require re-printing expensive paper menus or striking items with a pen.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="text-rose-500 font-bold">✕</span>
                <span>Waiters mishear spice preferences or forget food allergy instructions, resulting in wasted food and complaints.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <span className="text-rose-500 font-bold">✕</span>
                <span>End-of-meal bill payment delays keep dining tables occupied 15 minutes longer than necessary.</span>
              </li>
            </ul>
          </div>

          {/* The QR Dine Way */}
          <div className="p-6 sm:p-8 rounded-3xl bg-emerald-950/20 border border-emerald-800/40 space-y-4">
            <div className="flex items-center space-x-3 text-emerald-400">
              <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-700 flex items-center justify-center font-bold">
                ✓
              </div>
              <h3 className="font-black text-lg text-white">The QR Dine Smart Way</h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-stone-300">
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Instant ordering in 30 seconds straight from the guest&apos;s phone with zero app installation.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Update dish prices, photos, and toggle sold-out (86) items in 1 second from your phone dashboard.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Special instructions and allergies sent verbatim directly to the chef&apos;s kitchen display screen.</span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Table turnover speeds up by 25%, letting you seat more paying guests every evening.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works in 3 Steps */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 py-16 border-t border-stone-850">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">Simple 3-Step Setup</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Get Your Restaurant Live in Under 5 Minutes</h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-2">
            No hardware to buy. No technical expertise required. Works on any phone, tablet, or existing kitchen computer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
              1
            </div>
            <h3 className="font-bold text-base text-white">Create Menu &amp; Print QRs</h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Add your dishes, prices, and high-res photos. Download and print customized table QR stands directly from your dashboard.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
              2
            </div>
            <h3 className="font-bold text-base text-white">Guests Scan &amp; Order</h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Diners point their smartphone camera at the table QR. They view the menu, add dishes to cart, and place orders in 1 tap.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
              3
            </div>
            <h3 className="font-bold text-base text-white">Kitchen Cooks &amp; You Get Paid</h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Orders chime on your Kitchen Display System. Payments go directly to your UPI bank QR or are settled at the counter.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Models Section */}
      <section id="pricing" className="max-w-4xl mx-auto px-4 py-16 border-t border-stone-850">
        <div className="text-center mb-10">
          <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">Predictable Pricing</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Simple Plans with Zero Sales Commissions</h2>
          <p className="text-xs text-stone-400 mt-2">
            Unlike aggregators who demand 25–30% of every order, you pay a flat software subscription and keep 100% of your earnings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Starter Plan */}
          <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Starter Tier
              </span>
              <h3 className="text-3xl font-black text-white mt-1">₹499 <span className="text-xs font-normal text-stone-400">/ month</span></h3>
              <p className="text-xs text-stone-400 mt-1">Ideal for small cafes, juice bars &amp; quick-service counters</p>

              <ul className="mt-6 space-y-2.5 text-xs text-stone-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 10 Table QR Codes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Digital QR Menu with Veg/Non-Veg Filters</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Direct UPI QR &amp; Pay-at-Counter</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Owner Mobile Dashboard &amp; Price Editor</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>0% Commission on all orders</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center transition-all"
              >
                Register with Starter
              </button>
            </div>
          </div>

          {/* Growth Plan */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-stone-900 to-amber-950/30 border-2 border-amber-600/80 shadow-2xl flex flex-col justify-between relative">
            <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-md">
              Most Popular
            </span>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Growth Tier
              </span>
              <h3 className="text-3xl font-black text-white mt-1">₹999 <span className="text-xs font-normal text-stone-400">/ month</span></h3>
              <p className="text-xs text-stone-400 mt-1">For full-service dining restaurants, bistros &amp; bars</p>

              <ul className="mt-6 space-y-2.5 text-xs text-stone-200">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Unlimited Tables &amp; Staff Accounts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Real-time Kitchen Display System (KDS) with Audio</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Multi-Round Ordering &amp; Guest Session Isolation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Instant UPI &amp; Card Gateway Verification</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Live Daily Sales Ledger &amp; 86 Stock Toggles</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-amber-600/30 transition-all"
              >
                Start 14-Day Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="max-w-4xl mx-auto px-4 py-16 border-t border-stone-850">
        <div className="text-center mb-10">
          <span className="text-amber-500 text-xs font-bold uppercase tracking-wider">Restaurant Owner FAQ</span>
          <h2 className="text-2xl font-black text-white mt-1">Got Questions? We Have Answers.</h2>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800">
            <h4 className="font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Do my customers need to download an app from Play Store or App Store?</span>
            </h4>
            <p className="mt-2 text-stone-400 leading-relaxed">
              No! Diners simply point their existing phone camera, Google Lens, or Paytm/PhonePe at the QR code. The menu opens immediately in their default browser in under 1 second.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800">
            <h4 className="font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>How do customer payments reach me?</span>
            </h4>
            <p className="mt-2 text-stone-400 leading-relaxed">
              Directly into your own bank account! You can display your restaurant&apos;s UPI QR code (Google Pay, PhonePe, Paytm, BHIM) or allow customers to pay cash at the counter. We take 0% transaction cuts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800">
            <h4 className="font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Can diners order multiple rounds during their meal?</span>
            </h4>
            <p className="mt-2 text-stone-400 leading-relaxed">
              Yes! After placing an order, customers see a prominent &quot;+ Order More Dishes&quot; button. Their table session is preserved with a combined running total, while new orders ping the kitchen with distinct round badges.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800">
            <h4 className="font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>When a table leaves and a new customer sits, will they see the previous customer&apos;s bill?</span>
            </h4>
            <p className="mt-2 text-stone-400 leading-relaxed">
              Never. Our intelligent device session isolation ensures each customer&apos;s phone has its own private session. When a new customer scans the table QR, they see a fresh, clean menu with zero access to previous guests&apos; data.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready to Upgrade Your Restaurant Experience?
            </h2>
            <p className="text-sm text-amber-100 leading-relaxed">
              Join the modern restaurants saving waiter overhead and serving happy customers 25% faster. Start your free trial today.
            </p>
            <div className="pt-4">
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="px-8 py-4 rounded-2xl bg-white text-stone-950 font-black text-sm shadow-xl hover:bg-stone-100 transition-all active:scale-95 inline-flex items-center space-x-2"
              >
                <span>Register Restaurant Free (60 Seconds)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-850 py-10 px-4 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-amber-600 flex items-center justify-center font-black text-white text-[10px]">
              QD
            </div>
            <span className="font-bold text-stone-300">QR Dine SaaS</span>
            <span>— The Modern Hospitality Operating System</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="hover:text-stone-300 transition-colors">Merchant Admin</Link>
            <Link href="/staff/kds" className="hover:text-stone-300 transition-colors">Kitchen Display</Link>
            <Link href="/super-admin" className="hover:text-stone-300 transition-colors">Super Admin</Link>
          </div>
        </div>
        <p className="mt-6 text-[11px] text-stone-600">
          © {new Date().getFullYear()} QR Dine SaaS. Built with Next.js, Supabase, and Tailwind CSS.
        </p>
      </footer>

      {/* REGISTER RESTAURANT MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-stone-900 border border-stone-800 p-6 sm:p-8 shadow-2xl text-left">
            <button
              onClick={() => setIsRegisterOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Register Your Restaurant</h3>
                <p className="text-xs text-stone-400">Launch your digital menu &amp; QR tables in 60 seconds</p>
              </div>
            </div>

            {regError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-semibold">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Restaurant / Cafe Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Biryani &amp; Cafe"
                  value={formData.restaurantName}
                  onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Phone / WhatsApp <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Email Address <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="owner@restaurant.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    City / Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Indiranagar, Bengaluru"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {regLoading ? (
                    <span>Registering Restaurant...</span>
                  ) : (
                    <>
                      <span>Launch My Restaurant Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-center text-stone-500">
                14-day free trial • No credit card required • Cancel anytime
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
