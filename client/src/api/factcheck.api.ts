import { httpClient } from './httpClient';
import type { ApiEnvelope } from '../types/common.types';

export const factcheckApi = {
  async auditClaim(
    payload: FormData | { claim_text: string; source_url?: string }
  ): Promise<ApiEnvelope<any>> {
    const isFormData = payload instanceof FormData;
    const res = await httpClient.post<ApiEnvelope<any>>(
      '/fact-checks/audit',
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  async listFeed(params?: { page?: number; page_size?: number }): Promise<ApiEnvelope<any[]>> {
    const res = await httpClient.get<ApiEnvelope<any[]>>('/fact-checks/feed', { params });
    return res.data;
  },

  async getAudit(claimId: string): Promise<ApiEnvelope<any>> {
    const res = await httpClient.get<ApiEnvelope<any>>(`/fact-checks/${claimId}`);
    return res.data;
  },

  async registerTrustedFact(payload: {
    reference_code: string;
    canonical_fact: string;
    authority_name: string;
    source_url: string;
  }): Promise<ApiEnvelope<any>> {
    const res = await httpClient.post<ApiEnvelope<any>>('/fact-checks/registry', payload);
    return res.data;
  },
};

