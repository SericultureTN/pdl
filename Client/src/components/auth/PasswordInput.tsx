import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, id = 'password', placeholder = 'Enter password', ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Lock
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          ref={ref}
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder={placeholder}
          aria-label="Password"
          className={cn(
            'flex h-14 w-full rounded-xl border border-gray-200 bg-white py-2 pl-12 pr-12 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-emerald-primary focus:outline-none focus:ring-2 focus:ring-emerald-primary/20 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-primary/30"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
