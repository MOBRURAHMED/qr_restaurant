'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Store, 
  Activity, 
  CheckCircle, 
  TrendingUp,
  Plus,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface TenantClient {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  phone: string;
  plan: 'Starter' | 'Growth';
  priceMonthly: number;
  tables: number;
  status: 'active' | 'pending' | 'suspended';
  joinedDate: string;
}

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<TenantClient[]>([
    {
      id: 'ten-1',
      name: 'Spice Garden Bistro',
      slug: 'spice-garden',
      ownerName: 'Mobrur Rahman',
      phone: '+91 98765 43210',
      plan: 'Growth',
      priceMonthly: 999,
      tables: 12,
      status: 'active',
      joinedDate: 'Oct 2026',
    },
    {
      id: 'ten-2',
      name: 'Urban Chai & Co',
      slug: 'urban-chai-co',
      ownerName: 'Tanvi Kapoor',
      phone: '+91 98765 12345',
      plan: 'Starter',
      priceMonthly: 499,
      tables: 8,
      status: 'active',
      joinedDate: 'Oct 2026',
    },
    {
      id: 'ten-3',
      name: 'Royal Awadh Darbar',
      slug: 'royal-awadh',
      ownerName: 'Farhan Ali',
      phone: '+91 98765 88990',
      plan: 'Growth',
      priceMonthly: 999,
      tables: 20,
      status: 'pending',
      joinedDate: 'New Lead',
    },
  ]);

  const toggleStatus = (id: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'active' ? 'suspended' : 'active';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const mrr = tenants
    .filter((t) => t.status === 'active')
    .reduce((sum, t) => sum + t.priceMonthly, 0);

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center font-bold text-white shadow-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Platform Super-Admin
              </h1>
              <p className="text-xs text-stone-400">
                Multi-Tenant Restaurant SaaS Management Engine
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="text-xs text-stone-400 hover:text-white transition-colors"
            >
              Public Portal
            </Link>
            <button className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white flex items-center space-x-1.5 shadow-md">
              <Plus className="w-4 h-4" />
              <span>Onboard New Restaurant</span>
            </button>
          </div>
        </div>

        {/* Global SaaS Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/60">
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-xs font-semibold">Active Restaurants</span>
              <Store className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-white">
              {tenants.filter((t) => t.status === 'active').length}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">1 pending verification</p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/60">
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-xs font-semibold">Current MRR</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400">₹{mrr.toLocaleString()}</p>
            <p className="text-[11px] text-stone-400 mt-1">Monthly Recurring SaaS Revenue</p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/60">
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-xs font-semibold">Total Tables Live</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white">
              {tenants.reduce((sum, t) => sum + t.tables, 0)}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">Active QR touchpoints</p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/60">
            <div className="flex items-center justify-between text-stone-400 mb-1">
              <span className="text-xs font-semibold">Platform Uptime</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">99.98%</p>
            <p className="text-[11px] text-emerald-400 mt-1">All systems operational</p>
          </div>
        </div>

        {/* Tenant Directory Table */}
        <div className="bg-stone-800/60 rounded-2xl border border-stone-700/60 overflow-hidden">
          <div className="p-4 border-b border-stone-700/60 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Subscribed Restaurant Tenants</h2>
            <span className="text-xs text-stone-400">Total {tenants.length} Tenants</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-900/80 text-stone-400 font-semibold border-b border-stone-700/60">
                <tr>
                  <th className="p-3.5">Restaurant</th>
                  <th className="p-3.5">Owner / Contact</th>
                  <th className="p-3.5">Plan</th>
                  <th className="p-3.5">Tables</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-700/40">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-stone-800/40">
                    <td className="p-3.5">
                      <p className="font-bold text-white text-sm">{t.name}</p>
                      <span className="font-mono text-stone-400 text-[11px]">/r/{t.slug}</span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-medium text-stone-200">{t.ownerName}</p>
                      <p className="text-stone-400 text-[11px]">{t.phone}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800">
                        {t.plan} (₹{t.priceMonthly}/mo)
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-stone-200">{t.tables} tables</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          t.status === 'active'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : t.status === 'pending'
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                            : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <Link
                        href={`/r/${t.slug}/t/1`}
                        target="_blank"
                        className="p-1.5 inline-flex rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200"
                        title="View Customer Menu"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => toggleStatus(t.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          t.status === 'active'
                            ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {t.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
