import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  label: string;
  className?: string;
  id?: string;
  compact?: boolean;
}

export function Select({ value, onValueChange, options, label, className, id, compact = true }: SelectProps) {
  const selected = options.find((option) => option.value === value);

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        id={id}
        aria-label={label}
        className={cn(
          'inline-flex items-center justify-between gap-2 rounded-key border border-rule bg-paper-2 text-left',
          'text-ink transition-colors duration-micro ease-out hover:bg-paper-3',
          compact ? 'h-8 px-2.5 text-xs' : 'h-10 px-3 text-sm',
          className,
        )}
      >
        <span className="truncate">{selected?.label ?? label}</span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown size={13} className="shrink-0 text-muted" aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-card border border-ink bg-paper-2 shadow-lift"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-[4px] px-2 py-1.5 text-sm text-ink outline-none data-[highlighted]:bg-paper-3"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check size={13} aria-hidden className="text-ink" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
