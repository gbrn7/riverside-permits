import React from 'react';
import type { PermitStatus } from '../types/permit';

interface StatusBadgeProps {
  status: PermitStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'AWAITING_PAYMENT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'EXPIRED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'WITHDRAWN':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      case 'DRAFT':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'AWAITING_PAYMENT':
        return 'Awaiting Payment';
      case 'ACTIVE':
        return 'Active';
      case 'EXPIRED':
        return 'Expired';
      case 'WITHDRAWN':
        return 'Withdrawn';
      case 'DRAFT':
        return 'Draft';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle()}`}
    >
      {getLabel()}
    </span>
  );
};
