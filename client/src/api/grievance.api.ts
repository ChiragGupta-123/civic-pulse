import { httpClient } from './httpClient';
import type { ApiEnvelope } from '../types/common.types';
import type { GrievanceTicketDto, PublicDashboardDto } from '../types/grievance.types';

export const grievanceApi = {
  async submitGrievance(formData: FormData): Promise<ApiEnvelope<GrievanceTicketDto>> {
    const res = await httpClient.post<ApiEnvelope<GrievanceTicketDto>>('/grievances', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async listGrievances(params?: {
    category?: string;
    severity?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiEnvelope<GrievanceTicketDto[]>> {
    const res = await httpClient.get<ApiEnvelope<GrievanceTicketDto[]>>('/grievances', { params });
    return res.data;
  },

  async getGrievance(id: string): Promise<ApiEnvelope<GrievanceTicketDto>> {
    const res = await httpClient.get<ApiEnvelope<GrievanceTicketDto>>(`/grievances/${id}`);
    return res.data;
  },

  async updateStatus(
    id: string,
    payload: FormData | { status: string; remarks: string }
  ): Promise<ApiEnvelope<GrievanceTicketDto>> {
    const isFormData = payload instanceof FormData;
    const res = await httpClient.patch<ApiEnvelope<GrievanceTicketDto>>(
      `/grievances/${id}/status`,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  async getPublicDashboard(): Promise<ApiEnvelope<PublicDashboardDto>> {
    const res = await httpClient.get<ApiEnvelope<PublicDashboardDto>>('/grievances/public-dashboard');
    return res.data;
  },
};

