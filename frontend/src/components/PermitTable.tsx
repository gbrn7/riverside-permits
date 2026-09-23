import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { PermitSummary } from '../types/permit';
import { StatusBadge } from './StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Card } from './ui/card';

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
    <Card className="rounded-b-none border-b-0 overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold text-slate-700">Permit No</TableHead>
            <TableHead className="font-semibold text-slate-700">Holder Name</TableHead>
            <TableHead className="font-semibold text-slate-700">Hall</TableHead>
            <TableHead className="font-semibold text-slate-700">Purpose</TableHead>
            <TableHead className="font-semibold text-slate-700">Status</TableHead>
            <TableHead className="font-semibold text-slate-700">Start Date</TableHead>
            <TableHead className="font-semibold text-slate-700">End Date</TableHead>
            <TableHead className="font-semibold text-slate-700 text-right">Fee</TableHead>
            <TableHead className="w-[50px] text-center">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={9} className="py-12 text-center text-slate-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <div>Loading permits...</div>
              </TableCell>
            </TableRow>
          ) : (
            permits.map((permit) => (
              <TableRow
                key={permit.id}
                onClick={() => onSelectPermit(permit.id)}
                className="cursor-pointer group hover:bg-slate-50/80 transition-colors"
              >
                <TableCell className="font-semibold text-blue-600 group-hover:text-blue-800 whitespace-nowrap">
                  {permit.permitNumber}
                </TableCell>
                <TableCell className="font-medium text-slate-900 whitespace-nowrap">
                  {permit.holderName}
                </TableCell>
                <TableCell className="text-slate-700">
                  {/* BR-7: Full descriptive name only */}
                  {permit.hallName}
                </TableCell>
                <TableCell className="text-slate-700">
                  {/* BR-7: Full descriptive name only */}
                  {permit.purposeName}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <StatusBadge status={permit.status} />
                </TableCell>
                <TableCell className="text-slate-600 whitespace-nowrap">
                  {permit.startDate}
                </TableCell>
                <TableCell className="text-slate-600 whitespace-nowrap">
                  {permit.endDate}
                </TableCell>
                <TableCell className="text-right font-medium text-slate-900 whitespace-nowrap">
                  £{permit.fee.toFixed(2)}
                </TableCell>
                <TableCell className="text-center text-slate-400 group-hover:text-slate-700 transition-colors">
                  <ChevronRight className="w-4 h-4 inline-block" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
};
