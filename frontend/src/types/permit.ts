export type PermitStatus = 'DRAFT' | 'ACTIVE' | 'AWAITING_PAYMENT' | 'EXPIRED' | 'WITHDRAWN';

export interface PermitSummary {
  id: number;
  permitNumber: string;
  holderName: string;
  hallName: string;
  purposeName: string;
  status: PermitStatus;
  startDate: string;
  endDate: string;
  fee: number;
}

export interface RenewalRecord {
  id: number;
  previousEndDate: string;
  newEndDate: string;
  fee: number;
  performedAt: string;
}

export interface PermitHistory {
  action: string;
  detail: string;
  performedAt: string;
}

export interface PermitDetail {
  id: number;
  permitNumber: string;
  holderName: string;
  hallId: number;
  hallName: string;
  purposeId: number;
  purposeName: string;
  isCouncilUse: boolean;
  status: PermitStatus;
  startDate: string;
  endDate: string;
  fee: number;
  createdAt: string;
  updatedAt: string;
  renewalHistory: RenewalRecord[];
  history: PermitHistory[];
}

export interface RenewalPreview {
  permitId: number;
  permitNumber: string;
  hallName: string;
  purposeName: string;
  isCouncilUse: boolean;
  previousEndDate: string;
  newEndDate: string;
  daysAdded: number;
  cappedDays: number;
  dailyRate: number;
  calculatedFee: number;
  isCapped: boolean;
  resultingStatus: PermitStatus;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Hall {
  id: number;
  name: string;
  district: string;
  dailyRate: number;
}

export interface Purpose {
  id: number;
  code: string;
  name: string;
  isCouncilUse: boolean;
}

export interface SearchFilters {
  permitNumber: string;
  holderName: string;
  hallId: string;
  purposeId: string;
  status: string;
  startDateFrom: string;
  startDateTo: string;
  page: number;
  size: number;
}

export interface ApiError {
  error: string;
  message: string;
}
