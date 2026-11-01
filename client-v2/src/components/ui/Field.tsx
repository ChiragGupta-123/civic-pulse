import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: string;
}

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'>,
    FieldShellProps {}

export function TextField({ label, error, hint, id, className, ...props }: TextFieldProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={cn('min-w-0', className)}>
      <div className={cn('field', error && 'field--invalid')}>
        <label htmlFor={fieldId}>{label}</label>
        <input
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1 text-xs text-[var(--color-error)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'placeholder'>,
    FieldShellProps {}

export function TextAreaField({ label, error, hint, id, className, ...props }: TextAreaFieldProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={cn('min-w-0', className)}>
      <div className={cn('field', error && 'field--invalid')}>
        <label htmlFor={fieldId}>{label}</label>
        <textarea
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1 text-xs text-[var(--color-error)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
