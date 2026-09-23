import React from 'react';
import type { PermitStatus } from '../types/permit';
import { Badge } from './ui/badge';

interface StatusBadgeProps {
  status: PermitStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getVariant = () => {
    switch (status) {
      case 'ACTIVE':
        return 'success' as const;
      case 'AWAITING_PAYMENT':
        return 'warning' as const;
      case 'EXPIRED':
        return 'destructive' as const;
      case 'WITHDRAWN':
        return 'secondary' as const;
      case 'DRAFT':
        return 'info' as const;
      default:
        return 'outline' as const;
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
    <Badge variant={getVariant()} className="font-medium tracking-wide">
      {getLabel()}
    </Badge>
  );
};
