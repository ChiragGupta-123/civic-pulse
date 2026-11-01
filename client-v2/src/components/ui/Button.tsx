import type { ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';
type Size = 'md' | 'sm' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'key--primary',
  secondary: '',
  quiet: 'key--quiet',
  danger: 'key--danger',
};

const SIZE_CLASS: Record<Size, string> = {
  md: '',
  sm: 'key--sm',
  icon: 'key--icon',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  asChild = false,
  className,
  type,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      className={cn('key', VARIANT_CLASS[variant], SIZE_CLASS[size], className)}
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  );
}
