import type { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="scrim fixed inset-0 z-40" />
        <DialogPrimitive.Content
          className={cn(
            'dialog-panel fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2',
            'max-h-[calc(100dvh-48px)] overflow-y-auto scroll-column rounded-card border border-ink bg-paper-2 shadow-lift',
            size === 'lg' ? 'max-w-[720px]' : 'max-w-[520px]',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="font-display text-xl text-ink">{title}</DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm text-muted">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="key key--quiet key--icon -mr-2 -mt-1"
                aria-label="Close"
              >
                <X size={16} aria-hidden />
              </button>
            </DialogPrimitive.Close>
          </div>
          <div className="px-5 py-4">{children}</div>
          {footer ? <div className="border-t border-rule px-5 py-3">{footer}</div> : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const DialogClose = DialogPrimitive.Close;
