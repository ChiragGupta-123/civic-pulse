import { apiGet, apiGetList, apiPatch, apiPostForm } from './httpClient';
import type {
  GrievanceTicketDto,
  PublicDashboardDto,
  GrievanceQuery,
  GrievanceCreateRequest,
  GrievanceStatusUpdateRequest,
} from '@/types/grievance.types';

export function fetchGrievances(query: GrievanceQuery = {}) {
  return apiGetList<GrievanceTicketDto>('/grievances', {
    category: query.category || undefined,
    severity: query.severity || undefined,
    status: query.status || undefined,
    page: query.page ?? 1,
    page_size: query.page_size ?? 50,
  });
}

export function fetchGrievance(ticketId: string) {
  return apiGet<GrievanceTicketDto>(`/grievances/${ticketId}`);
}

export function fetchPublicDashboard() {
  return apiGet<PublicDashboardDto>('/grievances/public-dashboard');
}

export function createGrievance(input: GrievanceCreateRequest) {
  const form = new FormData();
  form.append('description', input.description);
  form.append('latitude', String(input.latitude));
  form.append('longitude', String(input.longitude));
  if (input.addressLabel) form.append('address_label', input.addressLabel);
  if (input.categoryHint) form.append('category_hint', input.categoryHint);
  if (input.photo) form.append('photo_file', input.photo);
  return apiPostForm<GrievanceTicketDto>('/grievances', form);
}

export function updateGrievanceStatus(ticketId: string, input: GrievanceStatusUpdateRequest) {
  return apiPatch<GrievanceTicketDto, GrievanceStatusUpdateRequest>(
    `/grievances/${ticketId}/status`,
    input,
  );
}
