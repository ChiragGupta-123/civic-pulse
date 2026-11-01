import { useState } from 'react';
import {
  RefreshCw,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { grievanceApi } from '../api/grievance.api';
import { useAsyncData } from '../hooks/useAsyncData';
import { useAuthStore } from '../stores/auth.store';
import { AccountabilityMap } from '../components/grievance/AccountabilityMap';
import { DepartmentSlaTable } from '../components/grievance/DepartmentSlaTable';
import { showToast } from '../components/feedback/ToastContainer';
import type { PublicDashboardDto, GrievanceTicketDto } from '../types/grievance.types';

export function PublicAccountabilityPage() {
  const { user, isAuthenticated } = useAuthStore();
  const isOfficerOrAdmin = isAuthenticated && (user?.role === 'OFFICER' || user?.role === 'ADMIN');

  const [selectedTicket, setSelectedTicket] = useState<GrievanceTicketDto | null>(null);
  const [officerStatus, setOfficerStatus] = useState<string>('RESOLVED');
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { data: dashboard, refetch } = useAsyncData<PublicDashboardDto>(
    async () => {
      const res = await grievanceApi.getPublicDashboard();
      return res.data;
    },
    []
  );

  const handleOfficerUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !officerRemarks.trim()) return;

    setIsUpdatingStatus(true);
    try {
      await grievanceApi.updateStatus(selectedTicket.id, {
        status: officerStatus,
        remarks: officerRemarks.trim(),
      });
      showToast(`Ticket #${selectedTicket.ticket_number} marked as ${officerStatus}.`, 'success');
      setSelectedTicket(null);
      setOfficerRemarks('');
      refetch();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Status update failed';
      showToast(msg, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const kpis = dashboard?.kpi
    ? {
        total_tickets: dashboard.kpi.total_tickets ?? 0,
        resolved_percentage: dashboard.kpi.compliance_rate_pct ?? (
          dashboard.kpi.total_tickets > 0 
            ? (dashboard.kpi.resolved_tickets / dashboard.kpi.total_tickets) * 100 
            : 100
        ),
        sla_breached_count: dashboard.department_scorecards?.reduce((acc, sc) => acc + (sc.sla_breached_count ?? 0), 0) ?? 0,
        avg_resolution_hours: dashboard.kpi.average_resolution_hours ?? 0,
      }
    : {
        total_tickets: dashboard?.kpis?.total_tickets ?? 0,
        resolved_percentage: dashboard?.kpis?.resolved_percentage ?? 0,
        sla_breached_count: dashboard?.kpis?.sla_breached_count ?? 0,
        avg_resolution_hours: dashboard?.kpis?.avg_resolution_hours ?? 0,
      };

  return (
    <div className="container-page py-8 space-y-6 animate-fade-up">
      {/* Officer Resolution Modal */}
      {selectedTicket && isOfficerOrAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-md surface p-6 space-y-4 animate-fade-up shadow-lift border-t-2 border-t-ink">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">
                  Update grievance status #{selectedTicket.ticket_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-pill p-1 text-muted hover:bg-paper-3 hover:text-ink"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleOfficerUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-muted">Target status</label>
                <select
                  value={officerStatus}
                  onChange={(e) => setOfficerStatus(e.target.value)}
                  className="input-modern"
                >
                  <option value="IN_PROGRESS">In progress: field crew dispatched</option>
                  <option value="RESOLVED">Resolved: hazard rectified</option>
                  <option value="REJECTED">Rejected: invalid or duplicate request</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-muted">Official remarks *</label>
                <textarea
                  rows={3}
                  required
                  value={officerRemarks}
                  onChange={(e) => setOfficerRemarks(e.target.value)}
                  placeholder="Details of action taken, contractor assigned, or completion certificate…"
                  className="input-modern"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-rule pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  disabled={isUpdatingStatus}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="btn-primary"
                >
                  {isUpdatingStatus ? 'Applying update…' : 'Commit status change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-rule pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-settled">Open governance data</span>
            <span className="badge">No login required</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Public civic accountability dashboard
          </h1>
          <p className="font-body text-xs sm:text-sm text-muted mt-0.5">
            Real-time municipal resolution audit, spatial hazard hotspots, and statutory SLA compliance across municipal wards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="btn-secondary self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Refresh live feeds</span>
        </button>
      </div>

      {/* Ruled Municipal KPI Register */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-medium text-ink">Total civic incidents</span>
            <MapPin className="h-4 w-4 text-muted" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-semibold text-ink">
            {kpis.total_tickets}
          </div>
          <p className="font-body text-[11px] text-muted">Recorded across municipal wards</p>
        </div>

        <div className="surface p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-medium text-ink">Resolution rate</span>
            <CheckCircle2 className="h-4 w-4 text-green" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-semibold text-green">
            {(kpis.resolved_percentage ?? 0).toFixed(1)}%
          </div>
          <p className="font-body text-[11px] text-muted">Remediated and closed</p>
        </div>

        <div className="surface p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-medium text-ink">SLA breaches</span>
            <AlertTriangle className="h-4 w-4 text-accent" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-semibold text-ink">
            {kpis.sla_breached_count}
          </div>
          <p className="font-body text-[11px] text-muted">Overdue past statutory deadline</p>
        </div>

        <div className="surface p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-medium text-ink">Avg remediation time</span>
            <Clock className="h-4 w-4 text-muted" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-semibold text-ink">
            {(kpis.avg_resolution_hours ?? 0).toFixed(1)} hrs
          </div>
          <p className="font-body text-[11px] text-muted">From intake to verified closure</p>
        </div>
      </div>

      {/* Geospatial Hotspot Map */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              Spatial hazard map
            </h3>
            <p className="font-body text-xs text-muted">
              Interactive map pins indicate verified citizen reports. Click pins to view details or trigger officer resolutions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-ink">
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" /> Critical (4h SLA)
            </span>
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full bg-contour" aria-hidden="true" /> High (24h SLA)
            </span>
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full bg-muted" aria-hidden="true" /> Medium (72h SLA)
            </span>
            <span className="flex items-center gap-1.5 text-green">
              <span className="h-2 w-2 rounded-full bg-green" aria-hidden="true" /> Low (168h SLA)
            </span>
          </div>
        </div>

        <AccountabilityMap
          tickets={dashboard?.markers || dashboard?.map_markers || []}
          onSelectTicket={(t) => {
            if (isOfficerOrAdmin) {
              setSelectedTicket(t);
            }
          }}
        />
      </div>

      {/* Department SLA Scorecards Table & Recharts */}
      <DepartmentSlaTable scorecards={dashboard?.department_scorecards || []} />
    </div>
  );
}

export default PublicAccountabilityPage;
