import { useState } from 'react';
import {
  MapPin,
  ListFilter,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  PlusCircle,
  Building2,
} from 'lucide-react';
import { GrievanceIntakeForm } from '../components/grievance/GrievanceIntakeForm';
import { grievanceApi } from '../api/grievance.api';
import { useAsyncData } from '../hooks/useAsyncData';
import type { GrievanceTicketDto } from '../types/grievance.types';

export function GrievancePortalPage() {
  const [activeTab, setActiveTab] = useState<'REPORT' | 'TRACK'>('REPORT');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { data: tickets, status, refetch } = useAsyncData<GrievanceTicketDto[]>(
    async () => {
      const res = await grievanceApi.listGrievances({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      return res.data || [];
    },
    [statusFilter]
  );

  return (
    <div className="container-page py-8 space-y-6 animate-fade-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-rule pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Civic grievance and hazard portal
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="badge">Pillar 2 · Civic infrastructure</span>
            <p className="font-body text-xs sm:text-sm text-muted">
              Submit infrastructure hazards with audio/photo evidence, auto-link duplicates within 50m, and track municipal SLAs.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 rounded-pill border border-rule bg-paper-2 p-1 shrink-0 shadow-subtle">
          <button
            type="button"
            onClick={() => setActiveTab('REPORT')}
            className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'REPORT'
                ? 'bg-ink text-paper-2 font-semibold'
                : 'text-muted hover:text-ink hover:bg-paper-3'
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Report issue</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TRACK')}
            className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'TRACK'
                ? 'bg-ink text-paper-2 font-semibold'
                : 'text-muted hover:text-ink hover:bg-paper-3'
            }`}
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Track tickets ({tickets?.length ?? 0})</span>
          </button>
        </div>
      </div>

      {activeTab === 'REPORT' ? (
        <div className="max-w-3xl mx-auto">
          <GrievanceIntakeForm
            onTicketCreated={() => {
              refetch();
            }}
          />
        </div>
      ) : (
        /* Track Tickets View */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="surface p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <ListFilter className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              <span className="font-medium text-muted">Status:</span>
              <div className="flex gap-1">
                {[
                  { code: 'ALL', label: 'All' },
                  { code: 'TRIAGED', label: 'Triaged' },
                  { code: 'IN_PROGRESS', label: 'In progress' },
                  { code: 'RESOLVED', label: 'Resolved' },
                ].map((st) => (
                  <button
                    key={st.code}
                    type="button"
                    onClick={() => setStatusFilter(st.code)}
                    className={`rounded-pill px-3 py-1 font-body text-xs font-medium transition-colors ${
                      statusFilter === st.code
                        ? 'bg-ink text-paper-2 font-semibold'
                        : 'border border-rule bg-paper-2 text-muted hover:bg-paper-3 hover:text-ink'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="btn-secondary min-h-[36px] py-1 px-3 text-xs"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Loading & Empty States */}
          {status === 'loading' && (
            <div className="surface p-12 text-center text-xs text-muted">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-rule border-t-ink mb-2" />
              <p>Loading civic ticket registry…</p>
            </div>
          )}

          {status === 'empty' && (
            <div className="surface p-12 text-center text-muted space-y-3">
              <MapPin className="h-8 w-8 text-muted mx-auto opacity-60" aria-hidden="true" />
              <div>
                <p className="font-semibold text-ink text-sm">No tickets found in this view</p>
                <p className="font-body text-xs text-muted mt-0.5">There are no reports matching the selected status filter.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('REPORT')}
                className="btn-primary"
              >
                Report an issue
              </button>
            </div>
          )}

          {/* Ticket Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets?.map((t) => (
              <div
                key={t.id}
                className="surface p-4 flex flex-col justify-between space-y-3 hover:border-ink transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="badge">
                      #{t.ticket_number}
                    </span>
                    <span
                      className={`badge ${
                        t.status === 'RESOLVED'
                          ? 'badge-settled'
                          : t.status === 'IN_PROGRESS'
                          ? 'badge-accent'
                          : 'badge'
                      }`}
                    >
                      {t.status.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-display text-sm font-semibold text-ink line-clamp-2">
                      {t.description}
                    </h4>
                    {t.address_label && (
                      <p className="font-body text-xs text-muted mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0 text-muted" aria-hidden="true" />
                        <span className="truncate">{t.address_label}</span>
                      </p>
                    )}
                  </div>

                  {/* Evidence Photo */}
                  {t.media_urls && t.media_urls.length > 0 && (
                    <div className="rounded-card overflow-hidden border border-rule h-28 bg-paper-3">
                      <img
                        src={t.media_urls[0]}
                        alt="Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="badge">
                      {t.category.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span className="badge">
                      {t.severity.toLowerCase()}
                    </span>
                    {t.upvote_count > 1 && (
                      <span className="badge-accent">
                        <Layers className="h-2.5 w-2.5" aria-hidden="true" /> {t.upvote_count} merged
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Routing & SLA info */}
                <div className="border-t border-rule pt-2.5 text-xs text-muted space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 truncate">
                      <Building2 className="h-3 w-3 text-muted" aria-hidden="true" />
                      {t.routed_department.code}
                    </span>
                    <span className="font-mono text-[11px]">SLA: {new Date(t.sla_deadline).toLocaleDateString()}</span>
                  </div>
                  {t.resolved_at && (
                    <div className="text-green font-medium flex items-center gap-1 pt-0.5">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Resolved on {new Date(t.resolved_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GrievancePortalPage;
