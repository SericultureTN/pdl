import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';

/** Lightweight non-blocking toast — auto-dismisses, no provider/portal needed. */
export function useToast(autoDismissMs = 4000) {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), autoDismissMs);
    return () => clearTimeout(timer);
  }, [toast, autoDismissMs]);

  const showToast = (type, message) => setToast({ type, message, key: Date.now() });
  return [toast, showToast];
}

export function ToastViewport({ toast }) {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50">
      <div
        className={clsx(
          'pointer-events-auto flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg',
          isSuccess ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        )}
      >
        {isSuccess ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
