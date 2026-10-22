import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer select-none';

    const variants = {
      primary: 'bg-emerald-900 text-white hover:bg-emerald-950 shadow-sm focus-visible:ring-emerald-800 rounded-xl',
      accent: 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm focus-visible:ring-amber-500 rounded-xl',
      secondary: 'bg-stone-800 text-white hover:bg-stone-900 shadow-sm focus-visible:ring-stone-700 rounded-xl',
      outline: 'border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 focus-visible:ring-stone-400 rounded-xl',
      ghost: 'text-stone-700 hover:bg-stone-100 focus-visible:ring-stone-300 rounded-lg',
      destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm focus-visible:ring-red-500 rounded-xl',
      success: 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm focus-visible:ring-emerald-600 rounded-xl',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-10',
      lg: 'text-base px-6 py-3 gap-2.5 h-12',
      icon: 'h-9 w-9 p-0 rounded-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
