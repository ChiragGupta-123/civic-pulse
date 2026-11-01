import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, MapPin, Filter } from 'lucide-react';
import type { GrievanceTicketDto, GrievanceSeverity } from '../../types/grievance.types';

interface AccountabilityMapProps {
  tickets: (GrievanceTicketDto | any)[];
  onSelectTicket?: (ticket: any) => void;
  center?: [number, number];
  zoom?: number;
}

const SEVERITY_CONFIG: Record<GrievanceSeverity, { bg: string; border: string; label: string }> = {
  CRITICAL: { bg: '#F2722B', border: '#2B2A27', label: 'Critical (4h SLA)' },
  HIGH: { bg: '#D97706', border: '#2B2A27', label: 'High (24h SLA)' },
  MEDIUM: { bg: '#4A5568', border: '#2B2A27', label: 'Medium (72h SLA)' },
  LOW: { bg: '#2D8A4E', border: '#2B2A27', label: 'Low (168h SLA)' },
};

function createCustomMarkerIcon(severity: GrievanceSeverity, upvotes: number) {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.MEDIUM;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${config.bg};
        border: 1px solid ${config.border};
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        color: #FFFFFF;
        font-family: 'Red Hat Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        border-radius: 6px;
        padding: 2px 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
        transform: translate(-50%, -50%);
        cursor: pointer;
      ">
        ${upvotes > 1 ? `★ ${upvotes}` : '●'}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function AccountabilityMap({
  tickets,
  onSelectTicket,
  center = [28.6139, 77.209],
  zoom = 12,
}: AccountabilityMapProps) {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredTickets = useMemo(() => {
    if (severityFilter === 'ALL') return tickets;
    return tickets.filter((t) => t.severity === severityFilter);
  }, [tickets, severityFilter]);

  const mapCenter: [number, number] =
    filteredTickets.length > 0 && filteredTickets[0].latitude && filteredTickets[0].longitude
      ? [filteredTickets[0].latitude, filteredTickets[0].longitude]
      : center;

  return (
    <div className="overflow-hidden rounded-md h-[460px] relative border border-rule bg-paper-3">
      {/* Floating Filter Overlay */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 rounded-pill border border-rule bg-paper-2/95 p-1.5 shadow-sm backdrop-blur-sm">
        <span className="flex items-center gap-1 pl-1 pr-1 font-body text-xs text-muted font-medium">
          <Filter className="h-3 w-3" aria-hidden="true" />
          Severity:
        </span>
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
          <button
            key={sev}
            type="button"
            onClick={() => setSeverityFilter(sev)}
            className={`rounded-pill px-2.5 py-0.5 font-body text-xs font-medium transition-colors ${
              severityFilter === sev
                ? 'bg-ink text-paper-2 font-semibold'
                : 'border border-rule bg-paper-2 text-muted hover:bg-paper-3 hover:text-ink'
            }`}
          >
            {sev === 'ALL' ? 'All' : sev.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Incident Counter Pill */}
      <div className="absolute top-3 right-3 z-[1000] rounded-pill border border-rule bg-paper-2/95 px-3 py-1 font-mono text-xs text-ink font-semibold shadow-sm backdrop-blur-sm">
        {filteredTickets.length} incidents plotted
      </div>

      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}
          url={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
        />

        {filteredTickets.map((ticket) => {
          if (!ticket.latitude || !ticket.longitude) return null;
          const markerIcon = createCustomMarkerIcon(ticket.severity, ticket.upvote_count);

          const ticketKey = ticket.id || ticket.ticket_id || ticket.ticket_number;
          return (
            <Marker
              key={ticketKey}
              position={[ticket.latitude, ticket.longitude]}
              icon={markerIcon}
              eventHandlers={{
                click: () => onSelectTicket?.(ticket),
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 space-y-1.5 font-body text-xs max-w-xs">
                  <div className="flex items-center justify-between border-b border-rule pb-1">
                    <span className="badge">
                      #{ticket.ticket_number}
                    </span>
                    <span className="badge">
                      {ticket.severity ? ticket.severity.toLowerCase() : 'active'}
                    </span>
                  </div>

                  <p className="font-medium text-ink line-clamp-2">
                    {ticket.description || ticket.address_label || `Civic report #${ticket.ticket_number}`}
                  </p>

                  {ticket.address_label && (
                    <div className="text-[11px] text-muted flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">{ticket.address_label}</span>
                    </div>
                  )}

                  {ticket.upvote_count > 1 && (
                    <div className="badge">
                      <Layers className="h-2.5 w-2.5" aria-hidden="true" />
                      <span>{ticket.upvote_count} merged duplicates</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-rule text-[11px] text-muted">
                    <span>{ticket.routed_department ? `Dept: ${ticket.routed_department.code}` : `Category: ${ticket.category || 'CIVIC'}`}</span>
                    <span className="font-mono">
                      {ticket.sla_deadline
                        ? `SLA: ${new Date(ticket.sla_deadline).toLocaleDateString()}`
                        : ticket.created_at
                        ? `Reported: ${new Date(ticket.created_at).toLocaleDateString()}`
                        : 'Active'}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default AccountabilityMap;
