import { Link } from 'react-router-dom';
import { PageFrame, PageHead, SectionHead } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { ErrorNotice } from '@/components/feedback/States';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchPublicDashboard } from '@/api/grievance.api';
import { formatHours, formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';

const PILLARS = [
  {
    name: 'Grievance register',
    note: 'Multimodal intake, spatial merge at 50 m, departmental clocks and the public sheet.',
    to: '/grievances',
    state: 'Live',
    live: true,
  },
  {
    name: 'Policy studio',
    note: 'Gazette ingestion, clause citations, eligibility matrix and regional voice explainers.',
    to: '/policies',
    state: 'Phase 2',
    live: false,
  },
  {
    name: 'Bureaucracy agent',
    note: 'A headless worker fills the form, streams its screen, and stops for your OTP.',
    to: '/agent',
    state: 'Phase 2',
    live: false,
  },
  {
    name: 'Fact verification',
    note: 'Claim audits, error-level forensics and the C2PA provenance ledger.',
    to: '/fact-check',
    state: 'Phase 2',
    live: false,
  },
];

function Figure({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-paper px-4 py-3 sm:px-5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-1.5">
        <span className="mono text-2xl text-ink sm:text-3xl">{value}</span>
        {unit ? <span className="mono text-2xs text-muted">{unit}</span> : null}
      </dd>
    </div>
  );
}

export function HomePage() {
  const dashboard = useAsyncData(() => fetchPublicDashboard(), []);
  const kpi = dashboard.data?.kpi;
  const scorecards = [...(dashboard.data?.department_scorecards ?? [])].sort(
    (a, b) => b.total_assigned - a.total_assigned || a.department_name.localeCompare(b.department_name),
  );

  return (
    <PageFrame>
      <PageHead
        title="Operations register"
        lede="The city's open business, held on one sheet: what was reported, which department carries it, and how much of its clock is left."
        meta={
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">Updated</span>
            <span className="mono text-xs text-ink">
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span aria-hidden className="h-3 w-px bg-rule" />
            <span className="text-xs text-muted">
              {dashboard.error
                ? 'Department report unavailable'
                : `${scorecards.length} ${scorecards.length === 1 ? 'department' : 'departments'} reporting`}
            </span>
          </div>
        }
        actions={
          <Button asChild variant="primary">
            <Link to="/grievances">Open the register</Link>
          </Button>
        }
      />

      {dashboard.error ? (
        <div className="mt-5">
          <ErrorNotice error={dashboard.error} onRetry={dashboard.reload} />
        </div>
      ) : null}

      <dl className="mt-6 grid grid-cols-2 gap-px border-b border-rule bg-rule lg:grid-cols-4">
        <Figure
          label="In the register"
          value={kpi ? formatNumber(kpi.total_tickets) : '—'}
        />
        <Figure
          label="Still open"
          value={kpi ? formatNumber(kpi.active_tickets) : '—'}
        />
        <Figure
          label="Resolved on time"
          value={kpi ? formatPercent(kpi.compliance_rate_pct) : '—'}
        />
        <Figure
          label="Mean resolution"
          value={kpi ? formatHours(kpi.average_resolution_hours) : '—'}
        />
      </dl>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section className="min-w-0">
          <SectionHead
            title="Department ledger"
            note={dashboard.loading ? 'Reading…' : `${scorecards.length} departments`}
          />
          <table className="ledger w-full border-collapse text-left">
            <caption className="sr-only">
              Assigned, resolved and breached counts with SLA compliance for each department.
            </caption>
            <thead>
              <tr className="border-y border-rule">
                <th scope="col" className="py-2 pr-3 text-xs font-medium text-muted">
                  Department
                </th>
                <th scope="col" className="w-[62px] py-2 pr-3 text-right text-xs font-medium text-muted">
                  Held
                </th>
                <th scope="col" className="w-[62px] py-2 pr-3 text-right text-xs font-medium text-muted">
                  Closed
                </th>
                <th scope="col" className="w-[72px] py-2 pr-3 text-right text-xs font-medium text-muted">
                  Breached
                </th>
                <th scope="col" className="w-[112px] py-2 text-right text-xs font-medium text-muted">
                  On time
                </th>
              </tr>
            </thead>
            <tbody>
              {scorecards.map((department) => {
                const late = department.sla_breached_count > 0;
                return (
                  <tr key={department.department_id} className="border-b border-rule">
                    <td className="min-w-0 py-2.5 pr-3">
                      <p className="truncate text-sm text-ink">{department.department_name}</p>
                      <p className="mono mt-0.5 text-2xs text-muted">{department.department_code}</p>
                    </td>
                    <td className="mono py-2.5 pr-3 text-right text-sm text-ink-2" data-figure data-label="Held">
                      {formatNumber(department.total_assigned)}
                    </td>
                    <td className="mono py-2.5 pr-3 text-right text-sm text-ink-2" data-figure data-label="Closed">
                      {formatNumber(department.resolved_count)}
                    </td>
                    <td
                      className={cn(
                        'mono py-2.5 pr-3 text-right text-sm',
                        late ? 'text-[var(--color-error)]' : 'text-ink-2',
                      )}
                      data-figure
                      data-label="Breached"
                    >
                      {formatNumber(department.sla_breached_count)}
                    </td>
                    <td className="py-2.5" data-figure data-label="On time">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          aria-hidden
                          className="hidden h-1 w-12 overflow-hidden rounded-full bg-grid sm:block"
                        >
                          <span
                            className="block h-1 bg-green"
                            style={{
                              width: `${Math.max(0, Math.min(100, department.sla_compliance_pct))}%`,
                            }}
                          />
                        </span>
                        <span className="mono w-[46px] text-right text-sm text-ink-2">
                          {formatPercent(department.sla_compliance_pct)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!dashboard.loading && scorecards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border-b border-rule py-6 text-sm text-muted">
                    No department holds a record yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <section className="min-w-0">
          <SectionHead title="What the register holds" note="Four workstreams" />
          <ol className="border-t border-ink">
            {PILLARS.map((pillar) => (
              <li key={pillar.name} className="border-b border-rule">
                <Link
                  to={pillar.to}
                  className="flex items-start justify-between gap-3 py-3 transition-colors duration-micro hover:bg-paper-3"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{pillar.name}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                      {pillar.note}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 shrink-0 text-2xs',
                      pillar.live ? 'text-[var(--color-green)]' : 'text-muted',
                    )}
                  >
                    {pillar.state}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Counts are read from the public dashboard endpoint. Nothing on this sheet is estimated.
          </p>
        </section>
      </div>
    </PageFrame>
  );
}
