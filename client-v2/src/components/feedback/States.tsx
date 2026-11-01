import type { ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import type { RequestError } from '@/api/httpClient';
import { Button } from '@/components/ui/Button';

export function ErrorNotice({
  error,
  onRetry,
  compact = false,
}: {
  error: RequestError;
  onRetry?: () => void;
  compact?: boolean;
}) {
  const notFound = error.status === 404;
  return (
    <div className={compact ? 'rounded-key border border-[var(--color-error)] bg-[var(--color-error-soft)] px-3 py-2' : 'sheet px-4 py-4'}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0 text-[var(--color-error)]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">
            {notFound ? 'That record is not in the register.' : 'The register did not answer.'}
          </p>
          <p className="mt-0.5 text-sm text-ink-2">
            {notFound
              ? 'No record carries that identifier. It may have been mistyped, or you followed a link to a sheet that no longer exists.'
              : error.message}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            {error.requestId ? (
              <span className="mono text-2xs text-muted">request {error.requestId}</span>
            ) : null}
            <span className="mono text-2xs text-muted">status {error.status || 'offline'}</span>
          </div>
        </div>
        {onRetry ? (
          <Button size="sm" onClick={onRetry} className="shrink-0">
            <RotateCw size={13} aria-hidden />
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-contour bg-paper-2 px-6 py-10 text-center">
      <p className="font-display text-lg text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-[46ch] text-sm text-muted">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-hidden className="animate-pulse">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 border-b border-rule px-3 py-4">
          <div className="h-3 w-[104px] rounded-[2px] bg-grid" />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-3/5 rounded-[2px] bg-grid" />
            <div className="mt-2 h-2.5 w-2/5 rounded-[2px] bg-grid" />
          </div>
          <div className="hidden h-3 w-[84px] rounded-[2px] bg-grid md:block" />
          <div className="h-3 w-[64px] rounded-[2px] bg-grid" />
        </div>
      ))}
    </div>
  );
}

export function InlineNote({ children }: { children: ReactNode }) {
  return (
    <p className="border-l-2 border-contour bg-paper-2 px-3 py-2 text-xs text-muted">{children}</p>
  );
}
