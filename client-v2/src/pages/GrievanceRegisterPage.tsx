import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Map as MapIcon, Rows3, Search } from 'lucide-react';
import { PageFrame, PageHead } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { RegisterTable } from '@/components/grievance/RegisterTable';
import { GrievanceDetail } from '@/components/grievance/GrievanceDetail';
import { GrievanceIntakeDialog } from '@/components/grievance/GrievanceIntakeDialog';
import { EmptyState, ErrorNotice, SkeletonRows } from '@/components/feedback/States';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchGrievances, fetchPublicDashboard, fetchGrievance } from '@/api/grievance.api';
import type { GrievanceTicketDto } from '@/types/grievance.types';
import { SeverityMark } from '@/components/ui/Marks';
import { categoryLabel } from '@/lib/format';
import { cn } from '@/lib/cn';

const GrievanceMap = lazy(() =>
  import('@/components/grievance/GrievanceMap').then((module) => ({
    default: module.GrievanceMap,
  })),
);

const PAGE_SIZE = 25;

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All severities' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All states' },
  { value: 'TRIAGED', label: 'Triaged' },
  { value: 'INVESTIGATING', label: 'Investigating' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

export function GrievanceRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [intakeOpen, setIntakeOpen] = useState(false);

  const view = searchParams.get('view') === 'map' ? 'map' : 'register';
  const selectedId = searchParams.get('ticket');
  const severity = searchParams.get('severity') ?? 'all';
  const status = searchParams.get('status') ?? 'all';
  const requestedPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const list = useAsyncData(
    () =>
      fetchGrievances({
        severity: severity === 'all' ? undefined : severity,
        status: status === 'all' ? undefined : status,
        page,
        page_size: PAGE_SIZE,
      }),
    [severity, status, page],
  );

  const dashboard = useAsyncData(() => fetchPublicDashboard(), []);

  const detail = useAsyncData(
    () => (selectedId ? fetchGrievance(selectedId) : Promise.resolve({ data: null })),
    [selectedId],
  );

  const tickets = list.data ?? [];
  const markers = dashboard.data?.markers ?? [];
  const activeCount = dashboard.data?.kpi.active_tickets ?? 0;

  const normalisedQuery = query.trim().toLowerCase();
  const filtered = normalisedQuery
    ? tickets.filter((ticket) =>
        [ticket.ticket_number, ticket.description, ticket.address_label, ticket.category]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalisedQuery),
      )
    : tickets;

  const totalMatches = list.meta?.total_items ?? filtered.length;
  const totalPages = Math.max(1, list.meta?.total_pages ?? 1);

  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? null;
  const record = detail.data ?? selected;

  useEffect(() => {
    if (!selectedId) return;
    // A phone cannot hold a master list and a detail column at once, so a
    // selected record becomes its own routed screen there.
    if (window.matchMedia('(max-width: 1279px)').matches) {
      navigate(`/grievances/${selectedId}`, { replace: true });
      return;
    }
    const node = document.getElementById('record-panel');
    node?.scrollIntoView({ block: 'nearest' });
  }, [selectedId, navigate]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  }

  function setFilter(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setSearchParams(next, { replace: true });
  }

  function goToPage(nextPage: number) {
    setParam('page', nextPage <= 1 ? null : String(nextPage));
  }

  function selectTicket(ticketId: string) {
    if (window.matchMedia('(max-width: 1279px)').matches) {
      navigate(`/grievances/${ticketId}`);
      return;
    }
    setParam('ticket', ticketId);
  }

  function handleCreated(ticket: GrievanceTicketDto) {
    list.reload();
    dashboard.reload();
    setParam('ticket', ticket.id);
  }

  const filtersActive = severity !== 'all' || status !== 'all' || query.trim().length > 0;

  return (
    <PageFrame>
      <PageHead
        title="Grievance register"
        lede="Every report filed against the city, the department that holds it, and the clock it runs against."
        meta={
          <div className="flex items-center gap-3">
            <span className="mono text-xs text-ink">{totalMatches}</span>
            <span className="text-xs text-muted">
              {filtersActive ? 'records match the filters' : 'records in the register'}
            </span>
            <span aria-hidden className="h-3 w-px bg-rule" />
            <span className="mono text-xs text-ink">{activeCount}</span>
            <span className="text-xs text-muted">still open</span>
          </div>
        }
        actions={
          <Button variant="primary" onClick={() => setIntakeOpen(true)}>
            File a report
          </Button>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-full items-center gap-2 rounded-key border border-muted bg-paper-2 px-2.5 transition-colors duration-micro focus-within:border-ink sm:w-auto">
          <Search size={13} aria-hidden className="text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this page"
            aria-label="Search records on this page"
            className="h-8 w-full bg-transparent text-xs text-ink outline-none placeholder:text-muted sm:w-[220px]"
          />
        </div>

        <Select
          value={severity}
          onValueChange={(value) => setFilter('severity', value === 'all' ? null : value)}
          options={SEVERITY_OPTIONS}
          label="Filter by severity"
        />
        <Select
          value={status}
          onValueChange={(value) => setFilter('status', value === 'all' ? null : value)}
          options={STATUS_OPTIONS}
          label="Filter by state"
        />

        {filtersActive ? (
          <Button
            size="sm"
            variant="quiet"
            onClick={() => {
              setQuery('');
              const next = new URLSearchParams(searchParams);
              next.delete('severity');
              next.delete('status');
              next.delete('page');
              setSearchParams(next, { replace: true });
            }}
          >
            Clear
          </Button>
        ) : null}

        <div className="flex w-full items-center gap-3 sm:ml-auto sm:w-auto">
          <div
            className="segmented w-full justify-center sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none"
            role="group"
            aria-label="Register or map view"
          >
            <button
              type="button"
              aria-pressed={view === 'register'}
              onClick={() => setParam('view', null)}
            >
              <Rows3 size={13} aria-hidden />
              Register
            </button>
            <button
              type="button"
              aria-pressed={view === 'map'}
              onClick={() => setParam('view', 'map')}
            >
              <MapIcon size={13} aria-hidden />
              Map
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'mt-5 grid items-start gap-6',
          selected ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]' : '',
        )}
      >
        <div className="min-w-0">
          {list.error ? (
            <ErrorNotice error={list.error} onRetry={list.reload} />
          ) : list.loading ? (
            <SkeletonRows rows={6} />
          ) : view === 'map' ? (
            <>
              {dashboard.error ? (
                <ErrorNotice error={dashboard.error} onRetry={dashboard.reload} />
              ) : (
                <Suspense fallback={<SkeletonRows rows={5} />}>
                  <GrievanceMap
                    markers={markers}
                    selectedId={selectedId}
                    onSelect={selectTicket}
                  />
                </Suspense>
              )}
              <ul className="mt-4 grid border-t border-ink sm:grid-cols-2 lg:grid-cols-3">
                {markers.map((marker) => {
                  const isSelected = marker.ticket_id === selectedId;
                  return (
                    <li key={marker.ticket_id}>
                      <button
                        type="button"
                        onClick={() => selectTicket(marker.ticket_id)}
                        className={cn(
                          'flex w-full items-baseline gap-2 border-b border-rule py-2 pr-3 text-left transition-colors duration-micro',
                          isSelected ? 'bg-accent-soft' : 'hover:bg-paper-3',
                        )}
                      >
                        <span className="mono shrink-0 text-2xs text-muted">{marker.ticket_number}</span>
                        <span className="min-w-0 flex-1 truncate text-xs text-ink-2">
                          {marker.address_label ?? categoryLabel(marker.category)}
                        </span>
                        <SeverityMark severity={marker.severity} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
              <RegisterTable
                tickets={filtered}
                selectedId={selectedId}
                onSelect={selectTicket}
                emptyState={
                  <EmptyState
                    title={
                      normalisedQuery && totalMatches > 0
                        ? 'No match on this page'
                        : filtersActive
                          ? 'No record matches those filters'
                          : 'The register is empty'
                    }
                    body={
                      normalisedQuery && totalMatches > 0
                        ? 'The search only reads the records loaded on this page. Move through the pages or clear the search.'
                        : filtersActive
                          ? 'Clear the filters to see every record on this sheet.'
                          : 'Nothing has been filed against the city yet. The first report opens the register.'
                    }
                    action={
                      normalisedQuery && totalMatches > 0 ? (
                        <Button
                          onClick={() => {
                            setQuery('');
                            goToPage(1);
                          }}
                        >
                          Clear the search
                        </Button>
                      ) : filtersActive ? (
                        <Button
                          onClick={() => {
                            setQuery('');
                            setSearchParams(new URLSearchParams(), { replace: true });
                          }}
                        >
                          Clear filters
                        </Button>
                      ) : (
                        <Button variant="primary" onClick={() => setIntakeOpen(true)}>
                          File the first report
                        </Button>
                      )
                    }
                  />
                }
              />

              <nav
                aria-label="Register pages"
                className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3"
              >
                <p className="text-xs text-muted">
                  <span className="mono text-ink">{filtered.length}</span> on this page,{' '}
                  <span className="mono text-ink">{totalMatches}</span>{' '}
                  {filtersActive ? 'matching the filters' : 'in the register'}
                </p>
                {totalPages > 1 ? (
                  <div className="flex items-center gap-2">
                    <span className="mr-1 text-xs text-muted">
                      Page {Math.min(page, totalPages)} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => goToPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => goToPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                ) : null}
              </nav>
            </>
          )}
        </div>

        {record ? (
          <div
            id="record-panel"
            className="min-w-0 scroll-mt-20 xl:sticky xl:top-[76px] xl:max-h-[calc(100dvh-100px)] xl:overflow-y-auto xl:pr-1 scroll-column"
          >
            <GrievanceDetail
              ticket={record}
              onClose={() => setParam('ticket', null)}
              onUpdated={() => {
                detail.reload();
                list.reload();
                dashboard.reload();
              }}
            />
          </div>
        ) : null}
      </div>

      <GrievanceIntakeDialog open={intakeOpen} onOpenChange={setIntakeOpen} onCreated={handleCreated} />
    </PageFrame>
  );
}
