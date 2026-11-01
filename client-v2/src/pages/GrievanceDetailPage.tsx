import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageFrame, PageHead } from '@/components/layout/PageFrame';
import { GrievanceDetail } from '@/components/grievance/GrievanceDetail';
import { ErrorNotice, SkeletonRows } from '@/components/feedback/States';
import { SeverityMark, StatusMark } from '@/components/ui/Marks';
import { Button } from '@/components/ui/Button';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchGrievance } from '@/api/grievance.api';
import { categoryLabel, formatCoordinate } from '@/lib/format';

export function GrievanceDetailPage() {
  const { ticketId = '' } = useParams();
  const record = useAsyncData(() => fetchGrievance(ticketId), [ticketId]);
  const ticket = record.data;

  return (
    <PageFrame>
      <div className="mb-4">
        <Link
          to="/grievances"
          className="inline-flex items-center gap-1.5 text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          <ArrowLeft size={13} aria-hidden />
          Back to the register
        </Link>
      </div>

      {record.error ? (
        <ErrorNotice error={record.error} onRetry={record.reload} />
      ) : record.loading || !ticket ? (
        <SkeletonRows rows={8} />
      ) : (
        <>
          <PageHead
            title={categoryLabel(ticket.category)}
            lede={ticket.address_label ?? 'Address not recorded'}
            meta={
              <div className="flex flex-wrap items-center gap-4">
                <span className="mono text-xs text-ink">{ticket.ticket_number}</span>
                <SeverityMark severity={ticket.severity} />
                <StatusMark status={ticket.status} />
                <span className="mono text-2xs text-muted">
                  {formatCoordinate(ticket.latitude)}, {formatCoordinate(ticket.longitude)}
                </span>
                <span className="mono text-2xs text-muted">
                  {ticket.upvote_count} {ticket.upvote_count === 1 ? 'report' : 'reports'}
                </span>
              </div>
            }
            actions={
              <Button asChild>
                <Link to={`/grievances?ticket=${ticket.id}`}>Open in the register</Link>
              </Button>
            }
          />
          <div className="mt-6">
            <GrievanceDetail ticket={ticket} variant="page" onUpdated={() => record.reload()} />
          </div>
        </>
      )}
    </PageFrame>
  );
}
