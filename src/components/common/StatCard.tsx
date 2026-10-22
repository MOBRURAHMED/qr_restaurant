import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = 'positive',
  icon,
  description,
  className,
}: StatCardProps) {
  const changeColors = {
    positive: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    negative: 'text-rose-600 bg-rose-50 border-rose-200',
    neutral: 'text-zinc-600 bg-zinc-50 border-zinc-200',
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
          {icon && <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600">{icon}</div>}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <h4 className="text-2xl font-extrabold tracking-tight text-zinc-900">{value}</h4>
          {change && (
            <span
              className={cn(
                'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold',
                changeColors[changeType]
              )}
            >
              {change}
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-xs text-zinc-400">{description}</p>}
      </CardContent>
    </Card>
  );
}
