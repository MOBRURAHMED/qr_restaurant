import type { Metadata } from 'next';
import './globals.css';
import { Suspense } from 'react';
import { RoleSwitcher } from '@/components/common/RoleSwitcher';
import { DemoBanner } from '@/components/common/DemoBanner';

export const metadata: Metadata = {
  title: 'QR Dine SaaS - Multi-Tenant Restaurant QR Ordering',
  description:
    'Scan table QR code to order food and pay digitally. Multi-tenant SaaS with real-time Kitchen Display System and Restaurant Owner Dashboard.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-zinc-50 text-zinc-900">
        <Suspense fallback={<div className="h-9 bg-zinc-900 border-b border-zinc-800" />}>
          <RoleSwitcher />
        </Suspense>
        <DemoBanner />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
