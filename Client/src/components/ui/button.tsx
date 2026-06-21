import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'primary';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          variant === 'default' &&
            'h-14 w-full bg-gradient-to-r from-[#0B5D3B] to-[#0F7A4A] text-white shadow-md hover:from-[#0C6842] hover:to-[#118A55] hover:shadow-lg active:scale-[0.99]',
          variant === 'primary' &&
            'h-10 bg-gradient-to-r from-[#0B5D3B] to-[#0F7A4A] px-5 text-white shadow-md hover:from-[#0C6842] hover:to-[#118A55] hover:shadow-lg',
          variant === 'outline' &&
            'h-10 border border-slate-200 bg-white px-4 text-slate-700 shadow-sm hover:border-emerald-primary/30 hover:bg-emerald-50/50 hover:text-emerald-primary',
          variant === 'ghost' && 'bg-transparent hover:bg-gray-100',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
