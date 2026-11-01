import { httpClient } from './httpClient';
import type { ApiEnvelope } from '../types/common.types';
import type {
  AuthResponseDto,
  CitizenVaultDto,
  CitizenVaultUpsertRequest,
  DepartmentDto,
  LoginRequest,
  RegisterRequest,
  UserDto,
} from '../types/identity.types';

export const identityApi = {
  async register(payload: RegisterRequest): Promise<ApiEnvelope<AuthResponseDto>> {
    const res = await httpClient.post<ApiEnvelope<AuthResponseDto>>('/auth/register', payload);
    return res.data;
  },

  async login(payload: LoginRequest): Promise<ApiEnvelope<AuthResponseDto>> {
    const res = await httpClient.post<ApiEnvelope<AuthResponseDto>>('/auth/login', payload);
    return res.data;
  },

  async getMe(): Promise<ApiEnvelope<UserDto>> {
    const res = await httpClient.get<ApiEnvelope<UserDto>>('/auth/me');
    return res.data;
  },

  async getVault(): Promise<ApiEnvelope<CitizenVaultDto>> {
    const res = await httpClient.get<ApiEnvelope<CitizenVaultDto>>('/vault');
    return res.data;
  },

  async upsertVault(payload: CitizenVaultUpsertRequest): Promise<ApiEnvelope<CitizenVaultDto>> {
    const res = await httpClient.put<ApiEnvelope<CitizenVaultDto>>('/vault', payload);
    return res.data;
  },

  async getDepartments(): Promise<ApiEnvelope<DepartmentDto[]>> {
    const res = await httpClient.get<ApiEnvelope<DepartmentDto[]>>('/departments');
    return res.data;
  },
};

