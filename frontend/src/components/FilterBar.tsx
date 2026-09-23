import React from 'react';
import { RotateCcw, Search } from 'lucide-react';
import type { Hall, Purpose, SearchFilters } from '../types/permit';

interface FilterBarProps {
  filters: SearchFilters;
  halls: Hall[];
  purposes: Purpose[];
  onFilterChange: (newFilters: Partial<SearchFilters>) => void;
  onReset: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  halls,
  purposes,
  onFilterChange,
  onReset,
  onSubmit,
  isLoading,
}) => {
  return (
    <form onSubmit={onSubmit} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Permit Number */}
        <div>
          <label htmlFor="permitNumber" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Permit Number
          </label>
          <input
            id="permitNumber"
            type="text"
            placeholder="e.g. P-2026-0001"
            value={filters.permitNumber}
            onChange={(e) => onFilterChange({ permitNumber: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Holder Name */}
        <div>
          <label htmlFor="holderName" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Holder Name
          </label>
          <input
            id="holderName"
            type="text"
            placeholder="Partial match (e.g. Amelia)"
            value={filters.holderName}
            onChange={(e) => onFilterChange({ holderName: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Hall Dropdown */}
        <div>
          <label htmlFor="hallId" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Community Hall
          </label>
          <select
            id="hallId"
            value={filters.hallId}
            onChange={(e) => onFilterChange({ hallId: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Halls</option>
            {halls.map((hall) => (
              <option key={hall.id} value={hall.id}>
                {hall.name} (£{hall.dailyRate.toFixed(2)}/day)
              </option>
            ))}
          </select>
        </div>

        {/* Purpose Dropdown */}
        <div>
          <label htmlFor="purposeId" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Booking Purpose
          </label>
          <select
            id="purposeId"
            value={filters.purposeId}
            onChange={(e) => onFilterChange({ purposeId: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Purposes</option>
            {purposes.map((purpose) => (
              <option key={purpose.id} value={purpose.id}>
                {purpose.name} {purpose.isCouncilUse ? '(Free)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div>
          <label htmlFor="status" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Permit Status
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="AWAITING_PAYMENT">Awaiting Payment</option>
            <option value="EXPIRED">Expired</option>
            <option value="WITHDRAWN">Withdrawn</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>

        {/* Start Date From */}
        <div>
          <label htmlFor="startDateFrom" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Start Date From
          </label>
          <input
            id="startDateFrom"
            type="date"
            value={filters.startDateFrom}
            onChange={(e) => onFilterChange({ startDateFrom: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Start Date To */}
        <div>
          <label htmlFor="startDateTo" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Start Date To
          </label>
          <input
            id="startDateTo"
            type="date"
            value={filters.startDateTo}
            onChange={(e) => onFilterChange({ startDateTo: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-end space-x-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
          >
            <Search className="w-4 h-4 mr-1.5" />
            Search
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
            title="Clear all filters and return full register"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset
          </button>
        </div>
      </div>
    </form>
  );
};
