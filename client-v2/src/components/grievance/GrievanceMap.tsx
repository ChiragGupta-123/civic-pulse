import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import type { GrievanceMapMarkerDto } from '@/types/grievance.types';
import { SeverityMark } from '@/components/ui/Marks';
import { categoryLabel } from '@/lib/format';

const SEVERITY_TOKEN: Record<string, string> = {
  CRITICAL: '--color-error',
  HIGH: '--color-accent',
  MEDIUM: '--color-contour',
  LOW: '--color-muted',
};

function tokenColor(name: string): string {
  if (typeof window === 'undefined') return '#000';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';
}

function KeepSized() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    map.invalidateSize();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function FitToMarkers({ markers, selectedId }: { markers: GrievanceMapMarkerDto[]; selectedId: string | null }) {  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    const selected = markers.find((marker) => marker.ticket_id === selectedId);
    if (selected) {
      map.setView([selected.latitude, selected.longitude], Math.max(map.getZoom(), 15), { animate: true });
      return;
    }
    const bounds = markers.map((marker) => [marker.latitude, marker.longitude]) as [number, number][];
    const asBounds = bounds as LatLngBoundsExpression;
    map.fitBounds(asBounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, markers, selectedId]);

  return null;
}

interface GrievanceMapProps {
  markers: GrievanceMapMarkerDto[];
  selectedId: string | null;
  onSelect: (ticketId: string) => void;
}

export function GrievanceMap({ markers, selectedId, onSelect }: GrievanceMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (markers.length === 0) return [28.6139, 77.209];
    const lat = markers.reduce((sum, marker) => sum + marker.latitude, 0) / markers.length;
    const lng = markers.reduce((sum, marker) => sum + marker.longitude, 0) / markers.length;
    return [lat, lng];
  }, [markers]);

  return (
    <div className="min-w-0 border border-ink bg-paper-2">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        className="h-[380px] w-full sm:h-[460px] lg:h-[540px]"
        aria-label="Map of reported grievances"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <FitToMarkers markers={markers} selectedId={selectedId} />
        <KeepSized />
        {markers.map((marker) => {
          const selected = marker.ticket_id === selectedId;
          const color = tokenColor(SEVERITY_TOKEN[String(marker.severity).toUpperCase()] ?? '--color-muted');
          return (
            <CircleMarker
              key={marker.ticket_id}
              center={[marker.latitude, marker.longitude]}
              radius={selected ? 10 : 6}
              pathOptions={{
                color: selected ? tokenColor('--color-ink') : color,
                weight: selected ? 2 : 1.25,
                fillColor: color,
                fillOpacity: selected ? 1 : 0.8,
              }}
              eventHandlers={{ click: () => onSelect(marker.ticket_id) }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <span className="mono text-2xs">{marker.ticket_number}</span>
                <br />
                {categoryLabel(marker.category)}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-3 py-2">
        <p className="text-2xs text-muted">
          {markers.length} {markers.length === 1 ? 'record' : 'records'} pinned where they were filed
        </p>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((severity) => (
            <li key={severity}>
              <SeverityMark severity={severity} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
