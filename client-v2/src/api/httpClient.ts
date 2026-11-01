import axios, { AxiosError } from 'axios';
import type { ApiEnvelope, ListResult, PageMeta } from '@/types/envelope.types';
import type { ApiErrorPayload } from '@/types/envelope.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export const http = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
});

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

http.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export class RequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: Record<string, string> | null;
  readonly requestId: string | null;

  constructor(
    message: string,
    status: number,
    code: string,
    fieldErrors: Record<string, string> | null,
    requestId: string | null,
  ) {
    super(message);
    this.name = 'RequestError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.requestId = requestId;
  }
}

function readEnvelopeError(payload: unknown): ApiErrorPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidate = (payload as { error?: unknown }).error;
  if (candidate && typeof candidate === 'object') {
    return candidate as ApiErrorPayload;
  }
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === 'string') {
    return { code: 'http_error', message: detail };
  }
  if (Array.isArray(detail)) {
    return { code: 'validation_error', message: 'The request was rejected as invalid.' };
  }
  return null;
}

function normaliseError(error: unknown): RequestError {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0;
    const envelopeError = readEnvelopeError(error.response?.data);
    if (status === 401) {
      window.dispatchEvent(new CustomEvent('cp:unauthorized'));
    }
    const message =
      envelopeError?.message ??
      (status === 0
        ? 'The register could not be reached. Check that the API is running.'
        : 'The register rejected that request.');
    return new RequestError(
      message,
      status,
      envelopeError?.code ?? 'request_failed',
      envelopeError?.field_errors ?? null,
      envelopeError?.request_id ?? null,
    );
  }
  return new RequestError('Something failed before the request was sent.', 0, 'client_error', null, null);
}

export async function apiGet<T>(
  url: string,
  params?: Record<string, string | number | undefined>,
): Promise<{ data: T; meta: PageMeta | null }> {
  try {
    const response = await http.get<ApiEnvelope<T>>(url, { params });
    return { data: response.data.data, meta: response.data.meta ?? null };
  } catch (error) {
    throw normaliseError(error);
  }
}

export async function apiGetList<T>(
  url: string,
  params?: Record<string, string | number | undefined>,
): Promise<ListResult<T>> {
  const response = await apiGet<T[]>(url, params);
  return { data: Array.isArray(response.data) ? response.data : [], meta: response.meta };
}

export async function apiPost<T, TBody = unknown>(url: string, body?: TBody): Promise<T> {
  try {
    const response = await http.post<ApiEnvelope<T>>(url, body);
    return response.data.data;
  } catch (error) {
    throw normaliseError(error);
  }
}

export async function apiPatch<T, TBody = unknown>(url: string, body?: TBody): Promise<T> {
  try {
    const response = await http.patch<ApiEnvelope<T>>(url, body);
    return response.data.data;
  } catch (error) {
    throw normaliseError(error);
  }
}

export async function apiPostForm<T>(url: string, form: FormData): Promise<T> {
  try {
    const response = await http.post<ApiEnvelope<T>>(url, form);
    return response.data.data;
  } catch (error) {
    throw normaliseError(error);
  }
}

export function toRequestError(error: unknown): RequestError {
  return error instanceof RequestError ? error : normaliseError(error);
}
