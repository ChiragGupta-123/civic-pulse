export interface ApiErrorPayload {
  code: string;
  message: string;
  field_errors?: Record<string, string> | null;
  request_id?: string | null;
}

export interface PageMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: ApiErrorPayload | null;
  meta?: PageMeta | null;
}

export interface ListResult<T> {
  data: T[];
  meta: PageMeta | null;
}

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
