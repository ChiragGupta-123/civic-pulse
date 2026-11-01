import type { ReactNode } from 'react';
import { AlertTriangle, InboxIcon, RefreshCw } from 'lucide-react';
import type { ApiError, AsyncStatus } from '../../types/common.types';

interface AsyncStateBoundaryProps {
  status: AsyncStatus;
  error: ApiError | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  loadingLabel?: string;
  children: ReactNode;
}

function LoadingSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="surface p-5 space-y-3 animate-pulse"
        >
          <div
            className="h-3 rounded-pill bg-paper-3"
            style={{ width: `${60 - i * 8}%` }}
          />
          <div className="space-y-2">
            <div className="h-2.5 w-full rounded-pill bg-paper-3" />
            <div className="h-2.5 rounded-pill bg-paper-3" style={{ width: '80%' }} />
          </div>
          <div className="flex gap-2 pt-1">
            <div className="h-4 w-16 rounded-pill bg-paper-3" />
            <div className="h-4 w-20 rounded-pill bg-paper-3" />
          </div>
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

function ErrorCard({
  error,
  onRetry,
}: {
  error: ApiError | null;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="surface p-6 space-y-4 border-l-4 border-l-error bg-paper-2 text-ink"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-error"
          aria-hidden="true"
        />
        <div className="flex-1">
          <p className="font-display text-sm font-semibold text-ink">
            {error?.message ?? 'An operational error occurred.'}
          </p>
          {error?.code && (
            <p className="mt-1 font-mono text-xs text-muted">
              Error code: {error.code}
              {error.requestId && <> · Request ID: {error.requestId}</>}
            </p>
          )}
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-secondary"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Retry action</span>
        </button>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="surface p-12 text-center space-y-3 border-dashed border-rule">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-pill bg-paper-3 text-muted">
        <InboxIcon className="h-5 w-5 opacity-70" aria-hidden="true" />
      </div>
      <div>
        <p className="font-display text-sm font-semibold text-ink">{title}</p>
        {description && (
          <p className="mt-1 font-body text-xs text-muted max-w-sm mx-auto">{description}</p>
        )}
      </div>
    </div>
  );
}

export function AsyncStateBoundary({
  status,
  error,
  onRetry,
  emptyTitle = 'Nothing recorded yet',
  emptyDescription,
  loadingLabel = 'Loading…',
  children,
}: AsyncStateBoundaryProps) {
  if (status === 'idle' || status === 'loading') {
    return <LoadingSkeleton label={loadingLabel} />;
  }

  if (status === 'error') {
    return <ErrorCard error={error} onRetry={onRetry} />;
  }

  if (status === 'empty') {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return <>{children}</>;
}

export default AsyncStateBoundary;
