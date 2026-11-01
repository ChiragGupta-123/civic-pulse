import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function PageFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-[var(--container)] px-5 sm:px-8 lg:px-10', className)}>
      {children}
    </div>
  );
}

interface PageHeadProps {
  title: string;
  lede?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHead({ title, lede, meta, actions }: PageHeadProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-ink pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl text-ink">{title}</h1>
        {lede ? <p className="mt-1.5 max-w-[62ch] text-sm text-muted">{lede}</p> : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">{meta}</div> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">{actions}</div>
      ) : null}
    </header>
  );
}

export function SectionHead({
  title,
  note,
  className,
}: {
  title: string;
  note?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 pb-2', className)}>
      <h2 className="text-lg text-ink">{title}</h2>
      {note ? <span className="text-xs text-muted">{note}</span> : null}
    </div>
  );
}
