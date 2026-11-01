export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | (string & {});
export type TicketStatus = 'TRIAGED' | 'INVESTIGATING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | (string & {});

export interface TimelineEventDto {
  id: string;
  ticket_id: string;
  status: string;
  remarks: string;
  actor_id: string | null;
  proof_url: string | null;
  timestamp: string;
}

export interface RoutedDepartmentDto {
  id: string;
  code: string;
  name: string;
  contact_email: string;
}

export interface GrievanceTicketDto {
  id: string;
  ticket_number: string;
  reporter_id: string | null;
  category: string;
  description: string;
  voice_transcript: string | null;
  media_urls: string[];
  latitude: number;
  longitude: number;
  address_label: string | null;
  severity: Severity;
  severity_score: number;
  ai_triage_summary: string;
  routed_department_id: string;
  routed_department: RoutedDepartmentDto | null;
  duplicate_of_id: string | null;
  upvote_count: number;
  status: TicketStatus;
  sla_deadline: string;
  resolved_at: string | null;
  resolution_proof_urls: string[];
  created_at: string;
  updated_at: string;
  timeline: TimelineEventDto[];
}

export interface DepartmentScorecardDto {
  department_id: string;
  department_code: string;
  department_name: string;
  total_assigned: number;
  resolved_count: number;
  sla_breached_count: number;
  sla_compliance_pct: number;
}

export interface DashboardKpiDto {
  total_tickets: number;
  resolved_tickets: number;
  active_tickets: number;
  compliance_rate_pct: number;
  average_resolution_hours: number;
}

export interface GrievanceMapMarkerDto {
  ticket_id: string;
  ticket_number: string;
  category: string;
  severity: Severity;
  status: TicketStatus;
  latitude: number;
  longitude: number;
  address_label: string | null;
  upvote_count: number;
  created_at: string;
}

export interface PublicDashboardDto {
  kpi: DashboardKpiDto;
  department_scorecards: DepartmentScorecardDto[];
  markers: GrievanceMapMarkerDto[];
}

export interface GrievanceCreateRequest {
  description: string;
  latitude: number;
  longitude: number;
  addressLabel?: string;
  categoryHint?: string;
  photo?: File | null;
}

export interface GrievanceQuery {
  category?: string;
  severity?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface GrievanceStatusUpdateRequest {
  status: string;
  remarks: string;
}
