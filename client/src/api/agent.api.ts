import { httpClient } from './httpClient';
import type { ApiEnvelope } from '../types/common.types';
import type { AgentRunDetailDto, BureaucracyServiceCode } from '../types/agent.types';

export interface AgentRunCreatePayload {
  service_code: BureaucracyServiceCode;
  portal_url?: string;
  auto_solve_hitl_otp?: string;
}

export interface HitlSupplyPayload {
  obstacle_type: 'OTP' | 'CAPTCHA';
  user_input: string;
}

export const agentApi = {
  async createRun(payload: AgentRunCreatePayload): Promise<ApiEnvelope<AgentRunDetailDto>> {
    const res = await httpClient.post<ApiEnvelope<AgentRunDetailDto>>('/agent/runs', payload);
    return res.data;
  },

  async listRuns(): Promise<ApiEnvelope<AgentRunDetailDto[]>> {
    const res = await httpClient.get<ApiEnvelope<AgentRunDetailDto[]>>('/agent/runs');
    return res.data;
  },

  async getRun(runId: string): Promise<ApiEnvelope<AgentRunDetailDto>> {
    const res = await httpClient.get<ApiEnvelope<AgentRunDetailDto>>(`/agent/runs/${runId}`);
    return res.data;
  },

  async submitHitl(
    runId: string,
    payload: HitlSupplyPayload
  ): Promise<ApiEnvelope<AgentRunDetailDto>> {
    const res = await httpClient.post<ApiEnvelope<AgentRunDetailDto>>(
      `/agent/runs/${runId}/hitl`,
      payload
    );
    return res.data;
  },
};

