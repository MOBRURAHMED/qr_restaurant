import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'veg' | 'nonveg' | 'secondary';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'md', children, ...props }: BadgeProps) {
  const base = 'inline-flex items-center font-semibold rounded-full tracking-wide transition-colors select-none';

  const variants = {
    default: 'bg-zinc-100 text-zinc-800 border border-zinc-200',
    secondary: 'bg-zinc-800 text-white',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    destructive: 'bg-rose-50 text-rose-700 border border-rose-200',
    outline: 'border border-zinc-300 text-zinc-700 bg-transparent',
    veg: 'bg-emerald-50 text-emerald-700 border border-emerald-400 gap-1.5',
    nonveg: 'bg-red-50 text-red-700 border border-red-400 gap-1.5',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <div className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {variant === 'veg' && (
        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
      )}
      {variant === 'nonveg' && (
        <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
      )}
      {children}
    </div>
  );
}
