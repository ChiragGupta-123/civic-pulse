import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { GrievanceTicketDto } from '@/types/grievance.types';
import { categoryLabel, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { MergedMark, SeverityMark, SlaReadout, StatusMark } from '@/components/ui/Marks';

interface RegisterTableProps {
  tickets: GrievanceTicketDto[];
  selectedId: string | null;
  onSelect: (ticketId: string) => void;
  emptyState?: ReactNode;
}

export function RegisterTable({ tickets, selectedId, onSelect, emptyState }: RegisterTableProps) {
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: '-57px 0px 0px 0px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (tickets.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="min-w-0">
      <table className="w-full border-collapse text-left md:table-fixed">
        <caption className="sr-only">
          Grievance register. Each row is a report with its department, state and statutory deadline.
        </caption>
        <thead
          ref={headerRef}
          className={cn(
            'sticky top-14 z-10 bg-paper transition-shadow duration-micro max-md:hidden',
            stuck && 'shadow-[0_1px_0_var(--color-rule)]',
          )}
        >
          <tr className="border-b border-ink">
            <th scope="col" className="w-[172px] py-2 pr-3 text-xs font-medium text-muted">
              Ticket
            </th>
            <th scope="col" className="py-2 pr-3 text-xs font-medium text-muted">
              Report
            </th>
            <th scope="col" className="w-[150px] py-2 pr-3 text-xs font-medium text-muted">
              Department
            </th>
            <th scope="col" className="w-[84px] py-2 pr-3 text-xs font-medium text-muted">
              State
            </th>
            <th scope="col" className="w-[110px] py-2 text-right text-xs font-medium text-muted">
              Deadline
            </th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const selected = ticket.id === selectedId;
            return (
              <tr
                key={ticket.id}
                onClick={() => onSelect(ticket.id)}
                className={cn(
                  'cursor-pointer border-b border-rule align-top transition-colors duration-micro',
                  'max-md:grid max-md:grid-cols-[minmax(0,1fr)_auto] max-md:items-baseline max-md:gap-x-3 max-md:gap-y-1 max-md:py-3',
                  selected ? 'bg-accent-soft' : 'hover:bg-paper-3',
                )}
              >
                <td
                  className={cn(
                    'py-3 pr-3 max-md:col-start-1 max-md:row-start-1 max-md:py-0 max-md:pr-0',
                    selected && 'shadow-[inset_2px_0_0_var(--color-accent)]',
                  )}
                >
                  <Link
                    to={`?ticket=${ticket.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onSelect(ticket.id);
                    }}
                    className="mono text-xs text-ink-2 underline-offset-4 hover:text-ink hover:underline"
                  >
                    {ticket.ticket_number}
                  </Link>
                  <p className="mt-1 text-2xs text-muted max-md:mt-0">{formatDateTime(ticket.created_at)}</p>
                </td>

                <td className="min-w-0 py-3 pr-3 max-md:col-span-2 max-md:row-start-2 max-md:py-0 max-md:pr-0">
                  <p className="truncate text-base font-medium text-ink">
                    {ticket.description}
                  </p>
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <SeverityMark severity={ticket.severity} />
                    <span className="min-w-0 text-2xs leading-relaxed text-muted">
                      {categoryLabel(ticket.category)}
                      {ticket.address_label ? `, ${ticket.address_label}` : ''}
                    </span>
                    {ticket.duplicate_of_id ? <MergedMark /> : null}
                  </div>
                </td>

                <td className="py-3 pr-3 md:w-[150px] max-md:col-span-2 max-md:row-start-3 max-md:py-0 max-md:pr-0">
                  <p className="truncate text-xs text-ink-2 max-md:inline max-md:whitespace-normal max-md:mr-1">
                    {ticket.routed_department?.name ?? 'Routing pending'}
                  </p>
                  <p className="mono mt-1 text-2xs text-muted max-md:mt-0 max-md:inline">
                    {ticket.routed_department?.code ?? '—'}
                  </p>
                </td>

                <td className="py-3 pr-3 md:w-[84px] max-md:col-span-2 max-md:row-start-4 max-md:py-0 max-md:pr-0">
                  <StatusMark status={ticket.status} />
                  {ticket.upvote_count > 1 ? (
                    <p className="mono mt-1 text-2xs text-muted max-md:mt-0 max-md:block">
                      {ticket.upvote_count} reports
                    </p>
                  ) : null}
                </td>

                <td className="py-3 text-right max-md:col-start-2 max-md:row-start-1 max-md:py-0">
                  <SlaReadout
                    deadline={ticket.sla_deadline}
                    resolvedAt={ticket.resolved_at}
                    showLabel={false}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
