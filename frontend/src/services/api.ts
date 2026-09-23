import type {
  Hall,
  PageResponse,
  PermitDetail,
  PermitSummary,
  Purpose,
  RenewalPreview,
  SearchFilters,
} from '../types/permit';

const API_BASE = '/api';

export class ApiRequestError extends Error {
  errorCode: string;
  status: number;

  constructor(errorCode: string, message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.errorCode = errorCode;
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    let errorJson = { error: 'UNKNOWN_ERROR', message: 'An unexpected error occurred' };
    try {
      errorJson = await response.json();
    } catch {
      // fallback
    }
    throw new ApiRequestError(errorJson.error || 'ERROR', errorJson.message || response.statusText, response.status);
  }

  return response.json();
}

export const api = {
  // RC-1: Search permits
  async searchPermits(filters: Partial<SearchFilters>): Promise<PageResponse<PermitSummary>> {
    const params = new URLSearchParams();
    if (filters.permitNumber?.trim()) params.append('permitNumber', filters.permitNumber.trim());
    if (filters.holderName?.trim()) params.append('holderName', filters.holderName.trim());
    if (filters.hallId) params.append('hallId', filters.hallId);
    if (filters.purposeId) params.append('purposeId', filters.purposeId);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDateFrom) params.append('startDateFrom', filters.startDateFrom);
    if (filters.startDateTo) params.append('startDateTo', filters.startDateTo);
    params.append('page', String(filters.page ?? 0));
    params.append('size', String(filters.size ?? 10));

    return request<PageResponse<PermitSummary>>(`/permits?${params.toString()}`);
  },

  // RC-2: View single permit
  async getPermit(id: number): Promise<PermitDetail> {
    return request<PermitDetail>(`/permits/${id}`);
  },

  // RC-3: Preview renewal
  async previewRenewal(id: number, newEndDate: string): Promise<RenewalPreview> {
    return request<RenewalPreview>(`/permits/${id}/renewals/preview`, {
      method: 'POST',
      body: JSON.stringify({ newEndDate }),
    });
  },

  // RC-3: Commit renewal
  async commitRenewal(id: number, newEndDate: string): Promise<PermitDetail> {
    return request<PermitDetail>(`/permits/${id}/renewals`, {
      method: 'POST',
      body: JSON.stringify({ newEndDate }),
    });
  },

  // Reference data
  async getHalls(): Promise<Hall[]> {
    return request<Hall[]>('/reference/halls');
  },

  async getPurposes(): Promise<Purpose[]> {
    return request<Purpose[]>('/reference/purposes');
  },

  async withdrawPermit(id: number, reason: string): Promise<PermitDetail> {
    const res = await fetch(`${API_BASE}/permits/${id}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to withdraw permit (${res.status})`);
    }
    return res.json();
  },
};
