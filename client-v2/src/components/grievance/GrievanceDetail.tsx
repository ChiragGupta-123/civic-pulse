import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import type { GrievanceTicketDto } from '@/types/grievance.types';
import { categoryLabel, formatCoordinate, formatDateTime, readSla } from '@/lib/format';
import { MergedMark, SeverityMark, SlaReadout, StatusMark } from '@/components/ui/Marks';
import { Button } from '@/components/ui/Button';
import { OfficerStatusPanel } from '@/components/grievance/OfficerStatusPanel';
import { cn } from '@/lib/cn';

interface GrievanceDetailProps {
  ticket: GrievanceTicketDto;
  onClose?: () => void;
  onUpdated?: (ticket: GrievanceTicketDto) => void;
  variant?: 'panel' | 'page';
}

function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2 last:border-b-0">
      <dt className="shrink-0 text-xs text-muted">{label}</dt>
      <dd className="min-w-0 text-right text-sm text-ink-2">{value}</dd>
    </div>
  );
}

export function GrievanceDetail({ ticket, onClose, onUpdated, variant = 'panel' }: GrievanceDetailProps) {
  const sla = readSla(ticket.sla_deadline, ticket.resolved_at);

  return (
    <article
      className={cn(
        'min-w-0',
        variant === 'panel'
          ? 'rounded-entry border border-ink bg-paper-2 shadow-lift'
          : 'bg-transparent',
      )}
    >
      {variant === 'panel' ? (
        <>
          <div className="flex items-start justify-between gap-3 px-4 pt-4">
            <div className="min-w-0">
              <p className="mono text-2xs text-muted">{ticket.ticket_number}</p>
              <h2 className="mt-1 text-2xl text-ink">{categoryLabel(ticket.category)}</h2>
              <p className="mt-1 text-sm text-muted">
                {ticket.address_label ?? 'Address not recorded'}
              </p>
            </div>
            {onClose ? (
              <Button
                variant="quiet"
                size="icon"
                aria-label="Close record"
                onClick={onClose}
                className="-mr-1 -mt-1"
              >
                <X size={16} aria-hidden />
              </Button>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-rule px-4 py-2">
            <SeverityMark severity={ticket.severity} />
            <StatusMark status={ticket.status} />
            {ticket.duplicate_of_id ? <MergedMark /> : null}
            <span className="ml-auto mono text-2xs text-muted">
              {ticket.upvote_count} {ticket.upvote_count === 1 ? 'report' : 'reports'}
            </span>
          </div>
        </>
      ) : null}

      <section className={cn('border-b border-rule py-3', variant === 'panel' ? 'px-4' : '')}>
        <p className="text-xs text-muted">Statutory clock</p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <SlaReadout
            deadline={ticket.sla_deadline}
            resolvedAt={ticket.resolved_at}
            className={variant === 'page' ? '[&_.mono]:text-2xl' : '[&_.mono]:text-xl'}
          />
          <span className="mono text-2xs text-muted">{formatDateTime(ticket.sla_deadline)}</span>
        </div>
        {sla.tone === 'breached' ? (
          <p className="mt-1 text-xs text-[var(--color-error)]">
            The department has missed this deadline. It stays in the register until resolved.
          </p>
        ) : null}
      </section>

      {variant === 'page' ? (
        <div className="grid gap-x-8 gap-y-0 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <BodySections ticket={ticket} onUpdated={onUpdated} />
          </div>
          <aside className="mt-4 lg:mt-0">
            <RouteLedger ticket={ticket} />
          </aside>
        </div>
      ) : (
        <>
          <div className="px-4">
            <BodySections ticket={ticket} onUpdated={onUpdated} />
            <RouteLedger ticket={ticket} />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-rule px-4 py-3">
            <Button asChild size="sm">
              <Link to={`/grievances/${ticket.id}`}>Open full record</Link>
            </Button>
            <span className="mono text-2xs text-muted">record {ticket.id.slice(0, 8)}</span>
          </div>
        </>
      )}
    </article>
  );
}

function BodySections({
  ticket,
  onUpdated,
}: {
  ticket: GrievanceTicketDto;
  onUpdated?: (ticket: GrievanceTicketDto) => void;
}) {
  return (
    <>
      <section className="border-b border-rule py-3">
        <p className="text-sm leading-relaxed text-ink-2">{ticket.description}</p>
        {ticket.voice_transcript ? (
          <p className="mt-2 border-l-2 border-contour pl-3 text-sm italic text-muted">
            “{ticket.voice_transcript}”
          </p>
        ) : null}
      </section>

      {ticket.ai_triage_summary ? (
        <section className="border-b border-rule py-3">
          <p className="text-xs text-muted">Triage note</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">{ticket.ai_triage_summary}</p>
        </section>
      ) : null}

      {ticket.duplicate_of_id ? (
        <section className="border-b border-rule py-3">
          <p className="text-xs text-muted">Spatial merge</p>
          <p className="mt-1 text-sm text-ink-2">
            Filed within 50 m of an earlier report and counted once against that record.
          </p>
        </section>
      ) : null}

      {ticket.media_urls.length > 0 ? (
        <section className="border-b border-rule py-3">
          <p className="text-xs text-muted">Evidence</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {ticket.media_urls.slice(0, 3).map((url, index) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden border border-rule bg-paper-3"
              >
                <img
                  src={url}
                  alt={`${categoryLabel(ticket.category)} evidence`}
                  className="h-20 w-full object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {ticket.resolution_proof_urls.length > 0 ? (
        <section className="border-b border-rule py-3">
          <p className="text-xs text-muted">Resolution proof</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {ticket.resolution_proof_urls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden border border-rule bg-paper-3"
              >
                <img
                  src={url}
                  alt="Resolution proof filed by the department"
                  className="h-20 w-full object-cover"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-b border-rule py-3">
        <p className="text-xs text-muted">Audit trail</p>
        {ticket.timeline.length === 0 ? (
          <p className="mt-1 text-sm text-muted">No status changes recorded yet.</p>
        ) : (
          <ol className="mt-1.5">
            {ticket.timeline.map((event) => (
              <li key={event.id} className="border-t border-rule py-2 first:border-t-0 first:pt-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-ink">{categoryLabel(event.status)}</span>
                  <span className="mono shrink-0 text-2xs text-muted">{formatDateTime(event.timestamp)}</span>
                </div>
                {event.remarks ? (
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{event.remarks}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <OfficerStatusPanel ticket={ticket} onUpdated={onUpdated} />
    </>
  );
}

function RouteLedger({ ticket }: { ticket: GrievanceTicketDto }) {
  return (
    <section className="py-3">
      <p className="text-xs text-muted">Route</p>
      <dl className="mt-1">
        <FieldRow label="Department" value={ticket.routed_department?.name ?? 'Routing pending'} />
        <FieldRow label="Code" value={<span className="mono text-xs">{ticket.routed_department?.code ?? '—'}</span>} />
        <FieldRow
          label="Coordinates"
          value={
            <span className="mono text-xs">
              {formatCoordinate(ticket.latitude)}, {formatCoordinate(ticket.longitude)}
            </span>
          }
        />
        <FieldRow label="Filed" value={<span className="mono text-xs">{formatDateTime(ticket.created_at)}</span>} />
      </dl>
      {ticket.routed_department?.contact_email ? (
        <p className="mt-2 text-xs text-muted">
          Department contact{' '}
          <a
            href={`mailto:${ticket.routed_department.contact_email}`}
            className="text-ink underline underline-offset-2"
          >
            {ticket.routed_department.contact_email}
          </a>
        </p>
      ) : null}
    </section>
  );
}
