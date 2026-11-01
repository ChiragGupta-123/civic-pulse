import { httpClient } from './httpClient';
import type { ApiEnvelope, RegionalLanguageCode } from '../types/common.types';
import type { PolicyExplainerDto, PolicySummaryDto } from '../types/policy.types';

export interface PolicyExplainPayload {
  language_code: RegionalLanguageCode;
  persona_type: 'CITIZEN' | 'SMALL_BUSINESS';
  citizen_profile?: Record<string, any>;
}

export const policyApi = {
  async listPolicies(params?: {
    search?: string;
    doc_type?: string;
    target_group?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiEnvelope<PolicySummaryDto[]>> {
    const res = await httpClient.get<ApiEnvelope<PolicySummaryDto[]>>('/policies', { params });
    return res.data;
  },

  async getPolicy(id: string): Promise<ApiEnvelope<PolicySummaryDto>> {
    const res = await httpClient.get<ApiEnvelope<PolicySummaryDto>>(`/policies/${id}`);
    return res.data;
  },

  async uploadPolicy(formData: FormData): Promise<ApiEnvelope<PolicySummaryDto>> {
    const res = await httpClient.post<ApiEnvelope<PolicySummaryDto>>('/policies', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async explainPolicy(
    policyId: string,
    payload: PolicyExplainPayload
  ): Promise<ApiEnvelope<PolicyExplainerDto>> {
    const res = await httpClient.post<ApiEnvelope<PolicyExplainerDto>>(
      `/policies/${policyId}/explain`,
      payload
    );
    return res.data;
  },
};

