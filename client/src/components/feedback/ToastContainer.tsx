import { useEffect } from 'react';
import { create } from 'zustand';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import clsx from 'clsx';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  push: (toast: Toast) => void;
  remove: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (toast) =>
    set((s) => ({ toasts: [...s.toasts, toast] })),
  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

let _idCounter = 0;

export function showToast(
  message: string,
  type: ToastType = 'info',
  durationMs = 4000,
): void {
  const id = `toast-${++_idCounter}`;
  useToastStore.getState().push({ id, message, type });
  if (durationMs > 0) {
    setTimeout(() => useToastStore.getState().remove(id), durationMs);
  }
}

const ICON_MAP: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLE_MAP: Record<ToastType, { wrapper: string; icon: string }> = {
  success: {
    wrapper: 'border-green bg-green-soft text-ink',
    icon: 'text-green',
  },
  error: {
    wrapper: 'border-error bg-paper-3 text-ink',
    icon: 'text-error',
  },
  warning: {
    wrapper: 'border-accent bg-accent-soft text-ink',
    icon: 'text-ink',
  },
  info: {
    wrapper: 'border-rule bg-paper-2 text-ink',
    icon: 'text-muted',
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove);
  const Icon = ICON_MAP[toast.type];
  const styles = STYLE_MAP[toast.type];

  useEffect(() => {
    const t = setTimeout(() => remove(toast.id), 4500);
    return () => clearTimeout(t);
  }, [toast.id, remove]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={clsx(
        'flex items-start gap-3 rounded-pill border px-4 py-3 shadow-lift',
        'animate-fade-up font-body text-xs font-medium',
        styles.wrapper,
      )}
    >
      <Icon className={clsx('mt-0.5 h-4 w-4 shrink-0', styles.icon)} aria-hidden="true" />
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        type="button"
        onClick={() => remove(toast.id)}
        className="ml-1 -mr-1 rounded-pill p-0.5 opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex w-full max-w-sm flex-col gap-2.5"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
