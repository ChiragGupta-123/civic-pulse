import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function Drawer({ open, onOpenChange, title, children }: DrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="scrim fixed inset-0 z-40" />
        <DialogPrimitive.Content
          className="drawer-panel fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] flex-col border-r border-ink bg-paper shadow-lift"
        >
          <div className="flex h-14 items-center justify-between border-b border-rule px-4">
            <DialogPrimitive.Title className="font-display text-base text-ink">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <button type="button" className="key key--quiet key--icon" aria-label="Close menu">
                <X size={16} aria-hidden />
              </button>
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto scroll-column py-2">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
