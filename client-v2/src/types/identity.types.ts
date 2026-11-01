export interface UserDto {
  id: string;
  email: string;
  full_name: string;
  role: string;
  preferred_language: string;
  department_id: string | null;
}

export interface AuthResponseDto {
  access_token: string;
  token_type: string;
  user: UserDto;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type UserRole = 'CITIZEN' | 'BUSINESS_OWNER' | 'OFFICER' | 'ADMIN';

export const ROLE_LABEL: Record<UserRole, string> = {
  CITIZEN: 'Citizen',
  BUSINESS_OWNER: 'Business owner',
  OFFICER: 'Officer',
  ADMIN: 'Administrator',
};
