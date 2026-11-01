import { cn } from '@/lib/cn';
import { readSla, severityLabel, statusLabel } from '@/lib/format';
import type { Severity, TicketStatus } from '@/types/grievance.types';

const SEVERITY_BAR: Record<string, string> = {
  CRITICAL: 'bg-[var(--color-error)]',
  HIGH: 'bg-[var(--color-accent)]',
  MEDIUM: 'bg-[var(--color-contour)]',
  LOW: 'bg-[var(--color-muted)]',
};

export function SeverityMark({ severity, className }: { severity: Severity; className?: string }) {
  const key = String(severity ?? '').toUpperCase();
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-ink', className)}>
      <span
        aria-hidden
        className={cn('h-[11px] w-[3px] rounded-[1px]', SEVERITY_BAR[key] ?? 'bg-[var(--color-muted)]')}
      />
      {severityLabel(severity)}
    </span>
  );
}

export function StatusMark({ status }: { status: TicketStatus }) {
  const resolved = String(status).toUpperCase() === 'RESOLVED';
  return (
    <span className={cn('text-xs font-medium', resolved ? 'text-[var(--color-green)]' : 'text-ink-2')}>
      {statusLabel(status)}
    </span>
  );
}

export function SlaReadout({
  deadline,
  resolvedAt,
  className,
  layout = 'inline',
  showLabel = true,
}: {
  deadline: string | null | undefined;
  resolvedAt: string | null | undefined;
  className?: string;
  layout?: 'inline' | 'stack';
  showLabel?: boolean;
}) {
  const reading = readSla(deadline, resolvedAt);
  const tone =
    reading.tone === 'breached'
      ? 'text-[var(--color-error)]'
      : reading.tone === 'resolved'
        ? 'text-[var(--color-green)]'
        : reading.tone === 'due'
          ? 'text-ink'
          : 'text-ink-2';

  return (
    <span
      className={cn(
        'whitespace-nowrap',
        layout === 'stack' ? 'inline-flex flex-col items-end' : 'inline-flex items-baseline gap-1',
        className,
      )}
      title={reading.exact}
    >
      <span className={cn('mono text-sm', tone)}>{reading.value}</span>
      {showLabel && reading.label ? <span className="text-2xs text-muted">{reading.label}</span> : null}
    </span>
  );
}

export function MergedMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-2xs font-medium text-muted',
        'border border-rule rounded-[3px] px-1.5 py-0.5',
        className,
      )}
      title="Filed within 50 m of an existing report and merged into it"
    >
      Merged
    </span>
  );
}
