'use client';

import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside aria-label="Demo environment notice" className="relative border-b border-amber-200/80 bg-amber-50/90 px-4 py-2 text-xs text-amber-900 transition-all backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <p>
            <span className="font-semibold">Architectural Demo Mode:</span> This interface displays realistic mock data for UI testing. Production Supabase database, authentication, and live Razorpay payments activate upon providing live environment keys.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-1 text-amber-700 hover:bg-amber-100 hover:text-amber-900 transition-colors"
          title="Dismiss Notice"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}
