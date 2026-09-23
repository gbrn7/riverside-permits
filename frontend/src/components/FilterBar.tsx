import React from 'react';
import { RotateCcw, Search } from 'lucide-react';
import type { Hall, Purpose, SearchFilters } from '../types/permit';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';

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
    <Card className="mb-6 shadow-sm border-slate-200">
      <CardContent className="p-5">
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Permit Number */}
            <div className="space-y-1.5">
              <label htmlFor="permitNumber" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Permit Number
              </label>
              <Input
                id="permitNumber"
                type="text"
                placeholder="e.g. P-2026-0001"
                value={filters.permitNumber}
                onChange={(e) => onFilterChange({ permitNumber: e.target.value })}
              />
            </div>

            {/* Holder Name */}
            <div className="space-y-1.5">
              <label htmlFor="holderName" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Holder Name
              </label>
              <Input
                id="holderName"
                type="text"
                placeholder="Partial match (e.g. Amelia)"
                value={filters.holderName}
                onChange={(e) => onFilterChange({ holderName: e.target.value })}
              />
            </div>

            {/* Hall Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="hallId" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Community Hall
              </label>
              <select
                id="hallId"
                value={filters.hallId}
                onChange={(e) => onFilterChange({ hallId: e.target.value })}
                className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-800"
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
            <div className="space-y-1.5">
              <label htmlFor="purposeId" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Booking Purpose
              </label>
              <select
                id="purposeId"
                value={filters.purposeId}
                onChange={(e) => onFilterChange({ purposeId: e.target.value })}
                className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-800"
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
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Permit Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => onFilterChange({ status: e.target.value })}
                className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-800"
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
            <div className="space-y-1.5">
              <label htmlFor="startDateFrom" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Start Date From
              </label>
              <Input
                id="startDateFrom"
                type="date"
                value={filters.startDateFrom}
                onChange={(e) => onFilterChange({ startDateFrom: e.target.value })}
              />
            </div>

            {/* Start Date To */}
            <div className="space-y-1.5">
              <label htmlFor="startDateTo" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Start Date To
              </label>
              <Input
                id="startDateTo"
                type="date"
                value={filters.startDateTo}
                onChange={(e) => onFilterChange({ startDateTo: e.target.value })}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                <Search className="w-4 h-4 mr-1.5" />
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                disabled={isLoading}
                title="Clear all filters and return full register"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
