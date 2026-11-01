import { useEffect, useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { TextAreaField } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { ErrorNotice } from '@/components/feedback/States';
import { updateGrievanceStatus } from '@/api/grievance.api';
import { toRequestError, type RequestError } from '@/api/httpClient';
import { useAuthStore } from '@/stores/auth.store';
import { statusLabel } from '@/lib/format';
import type { GrievanceTicketDto } from '@/types/grievance.types';

const STATUS_OPTIONS = [
  { value: 'TRIAGED', label: 'Triaged' },
  { value: 'INVESTIGATING', label: 'Investigating' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

interface OfficerStatusPanelProps {
  ticket: GrievanceTicketDto;
  onUpdated?: (ticket: GrievanceTicketDto) => void;
}

/**
 * Status transitions are an officer instrument. The control stays hidden for
 * every other role; the API enforces the same rule independently.
 */
export function OfficerStatusPanel({ ticket, onUpdated }: OfficerStatusPanelProps) {
  const role = useAuthStore((state) => state.user?.role);
  const [status, setStatus] = useState(ticket.status);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<RequestError | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setStatus(ticket.status);
  }, [ticket.id, ticket.status]);

  if (role !== 'OFFICER' && role !== 'ADMIN') return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (remarks.trim().length < 4) {
      setFieldError('A remark of at least four characters is required for the audit trail.');
      return;
    }
    setFieldError(null);
    setError(null);
    setNote(null);
    setSubmitting(true);
    try {
      const updated = await updateGrievanceStatus(ticket.id, {
        status,
        remarks: remarks.trim(),
      });
      setRemarks('');
      setNote(`State set to ${statusLabel(updated.status)}.`);
      onUpdated?.(updated);
    } catch (requestError) {
      setError(toRequestError(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <details className="border-b border-rule py-3">
      <summary className="cursor-pointer select-none text-xs text-muted hover:text-ink">
        Update state
      </summary>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3" noValidate>
        {error ? <ErrorNotice error={error} compact /> : null}

        <div>
          <p className="mb-1 text-xs text-muted">New state</p>
          <Select
            value={status}
            onValueChange={setStatus}
            options={STATUS_OPTIONS}
            label="New state"
            compact={false}
            className="w-full"
          />
        </div>

        <TextAreaField
          label="Remark for the audit trail"
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          error={fieldError ?? undefined}
          rows={3}
          maxLength={600}
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-2xs text-muted">Recorded against your account and the current time.</p>
          <Button type="submit" size="sm" variant="primary" disabled={submitting}>
            {submitting ? 'Recording…' : 'Record state'}
          </Button>
        </div>

        {note ? (
          <p className="flex items-center gap-1.5 text-xs text-[var(--color-green)]" role="status">
            <Check size={13} aria-hidden />
            {note}
          </p>
        ) : null}
      </form>
    </details>
  );
}
