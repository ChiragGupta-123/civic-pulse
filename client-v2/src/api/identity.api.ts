import { apiGet, apiPost } from './httpClient';
import type { AuthResponseDto, LoginRequest, UserDto } from '@/types/identity.types';

export function loginRequest(payload: LoginRequest) {
  return apiPost<AuthResponseDto, LoginRequest>('/auth/login', payload);
}

export function fetchCurrentUser() {
  return apiGet<UserDto>('/auth/me');
}
