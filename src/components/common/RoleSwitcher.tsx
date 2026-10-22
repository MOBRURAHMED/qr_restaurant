'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UtensilsCrossed, LayoutDashboard, ChefHat, ShieldCheck, Home } from 'lucide-react';

export function RoleSwitcher() {
  const pathname = usePathname();

  const roles = [
    { label: 'Home', href: '/', icon: Home, match: pathname === '/' },
    { label: 'Customer Menu', href: '/r/spice-garden/t/4', icon: UtensilsCrossed, match: pathname.startsWith('/r/') },
    { label: 'Restaurant Owner', href: '/admin', icon: LayoutDashboard, match: pathname.startsWith('/admin') },
    { label: 'Kitchen KDS', href: '/staff/kds', icon: ChefHat, match: pathname.startsWith('/staff') },
    { label: 'Super Admin', href: '/super-admin', icon: ShieldCheck, match: pathname.startsWith('/super-admin') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-800 bg-[#0f1412] text-white shadow-md backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 text-xs">
        {/* Brand / Mode indicator */}
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold tracking-tight text-white">QR Dine SaaS</span>
          <span className="rounded bg-stone-800 px-1.5 py-0.5 text-[10px] font-medium text-stone-300 border border-stone-700">
            Enterprise Preview
          </span>
        </div>

        {/* Role Navigation Pills */}
        <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {roles.map((r) => {
            const Icon = r.icon;
            const active = r.match;

            return (
              <Link
                key={r.href}
                href={r.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  active
                    ? 'bg-[#1b4332] text-emerald-100 shadow-xs ring-1 ring-emerald-500/50 font-semibold'
                    : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{r.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
