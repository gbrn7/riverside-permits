import React, { useCallback, useEffect, useState } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import type { Hall, PageResponse, PermitSummary, Purpose, SearchFilters } from '../types/permit';
import { api, ApiRequestError } from '../services/api';
import { FilterBar } from './FilterBar';
import { PermitTable } from './PermitTable';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';

const DEFAULT_FILTERS: SearchFilters = {
  permitNumber: '',
  holderName: '',
  hallId: '',
  purposeId: '',
  status: '',
  startDateFrom: '',
  startDateTo: '',
  page: 0,
  size: 10,
};

interface PermitRegisterProps {
  onSelectPermit: (id: number) => void;
}

export const PermitRegister: React.FC<PermitRegisterProps> = ({ onSelectPermit }) => {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(() => {
    // RC-2 AC-3: Restore filters from URL params if present
    const params = new URLSearchParams(window.location.search);
    return {
      permitNumber: params.get('permitNumber') || '',
      holderName: params.get('holderName') || '',
      hallId: params.get('hallId') || '',
      purposeId: params.get('purposeId') || '',
      status: params.get('status') || '',
      startDateFrom: params.get('startDateFrom') || '',
      startDateTo: params.get('startDateTo') || '',
      page: parseInt(params.get('page') || '0', 10),
      size: parseInt(params.get('size') || '10', 10),
    };
  });

  const [data, setData] = useState<PageResponse<PermitSummary>>({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state to URL search parameters for back-navigation preservation
  const syncUrlParams = (currentFilters: SearchFilters) => {
    const params = new URLSearchParams();
    if (currentFilters.permitNumber) params.set('permitNumber', currentFilters.permitNumber);
    if (currentFilters.holderName) params.set('holderName', currentFilters.holderName);
    if (currentFilters.hallId) params.set('hallId', currentFilters.hallId);
    if (currentFilters.purposeId) params.set('purposeId', currentFilters.purposeId);
    if (currentFilters.status) params.set('status', currentFilters.status);
    if (currentFilters.startDateFrom) params.set('startDateFrom', currentFilters.startDateFrom);
    if (currentFilters.startDateTo) params.set('startDateTo', currentFilters.startDateTo);
    if (currentFilters.page > 0) params.set('page', String(currentFilters.page));

    const newRelativePathQuery = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    window.history.replaceState(null, '', newRelativePathQuery);
  };

  // Fetch reference data on load
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [hallsData, purposesData] = await Promise.all([
          api.getHalls(),
          api.getPurposes(),
        ]);
        setHalls(hallsData);
        setPurposes(purposesData);
      } catch (err) {
        console.error('Failed to load reference data:', err);
      }
    };
    loadReferenceData();
  }, []);

  // Fetch permits
  const fetchPermits = useCallback(async (activeFilters: SearchFilters) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.searchPermits(activeFilters);
      setData(response);
      syncUrlParams(activeFilters);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to connect to backend server. Please verify the API is running.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermits(filters);
  }, [fetchPermits, filters.page]);

  const handleFilterChange = (newValues: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newValues, page: 0 }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPermits(filters);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    fetchPermits(DEFAULT_FILTERS);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Community Hall Permit Register</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Search, review, and renew hall booking permits across Riverside Council facilities.
          </p>
        </div>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 flex items-start space-x-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to load permits</p>
            <p className="text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        halls={halls}
        purposes={purposes}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        onSubmit={handleSearchSubmit}
        isLoading={isLoading}
      />

      {/* Results Grid / Table */}
      {!isLoading && data.totalElements === 0 ? (
        <EmptyState onReset={handleReset} />
      ) : (
        <>
          <PermitTable
            permits={data.content}
            onSelectPermit={onSelectPermit}
            isLoading={isLoading}
          />
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            size={data.size}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};
