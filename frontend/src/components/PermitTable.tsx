import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { PermitSummary } from '../types/permit';
import { StatusBadge } from './StatusBadge';

interface PermitTableProps {
  permits: PermitSummary[];
  onSelectPermit: (id: number) => void;
  isLoading: boolean;
}

export const PermitTable: React.FC<PermitTableProps> = ({
  permits,
  onSelectPermit,
  isLoading,
}) => {
  return (
    <div className="overflow-x-auto bg-white rounded-t-lg border-x border-t border-slate-200 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-slate-700 font-semibold">
          <tr>
            <th scope="col" className="px-4 py-3.5">Permit No</th>
            <th scope="col" className="px-4 py-3.5">Holder Name</th>
            <th scope="col" className="px-4 py-3.5">Hall</th>
            <th scope="col" className="px-4 py-3.5">Purpose</th>
            <th scope="col" className="px-4 py-3.5">Status</th>
            <th scope="col" className="px-4 py-3.5">Start Date</th>
            <th scope="col" className="px-4 py-3.5">End Date</th>
            <th scope="col" className="px-4 py-3.5 text-right">Fee</th>
            <th scope="col" className="px-4 py-3.5 text-center"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {isLoading ? (
            <tr>
              <td colSpan={9} className="py-12 text-center text-slate-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <div>Loading permits...</div>
              </td>
            </tr>
          ) : permits.map((permit) => (
            <tr
              key={permit.id}
              onClick={() => onSelectPermit(permit.id)}
              className="hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <td className="px-4 py-3 font-semibold text-blue-600 group-hover:text-blue-800 whitespace-nowrap">
                {permit.permitNumber}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                {permit.holderName}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {/* BR-7: Full descriptive name only */}
                {permit.hallName}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {/* BR-7: Full descriptive name only */}
                {permit.purposeName}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge status={permit.status} />
              </td>
              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                {permit.startDate}
              </td>
              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                {permit.endDate}
              </td>
              <td className="px-4 py-3 text-right font-medium text-slate-900 whitespace-nowrap">
                £{permit.fee.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-center text-slate-400 group-hover:text-slate-600">
                <ChevronRight className="w-4 h-4 inline-block" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
