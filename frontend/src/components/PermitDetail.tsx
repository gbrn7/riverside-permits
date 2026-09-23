import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  History,
  Info,
  MapPin,
  RefreshCw,
  Tag,
  User,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { PermitDetail as PermitDetailType } from '../types/permit';
import { api, ApiRequestError } from '../services/api';
import { StatusBadge } from './StatusBadge';
import { RenewalModal } from './RenewalModal';
import { WithdrawModal } from './WithdrawModal';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';

interface PermitDetailProps {
  permitId: number;
  onBack: () => void;
}

export const PermitDetail: React.FC<PermitDetailProps> = ({ permitId, onBack }) => {
  const [permit, setPermit] = useState<PermitDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const fetchPermit = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getPermit(permitId);
      setPermit(data);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to load permit details.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [permitId]);

  useEffect(() => {
    fetchPermit();
  }, [fetchPermit]);

  // Determine renewal eligibility (BR-1 & BR-2)
  const getEligibility = (): { eligible: boolean; reason?: string } => {
    if (!permit) return { eligible: false };

    if (permit.status === 'ACTIVE') {
      return { eligible: true };
    }

    if (permit.status === 'EXPIRED') {
      const today = new Date();
      const end = new Date(permit.endDate);
      const diffDays = Math.floor((today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 90) {
        return { eligible: true };
      }
      return {
        eligible: false,
        reason: `Permit expired ${diffDays} days ago, which exceeds the 90-day grace window. A new application is required.`,
      };
    }

    if (permit.status === 'AWAITING_PAYMENT') {
      return {
        eligible: false,
        reason: 'Permit is currently awaiting payment for a previous renewal. Payment must clear before renewing again.',
      };
    }

    if (permit.status === 'WITHDRAWN') {
      return {
        eligible: false,
        reason: 'Permit is in terminal WITHDRAWN status and cannot be renewed.',
      };
    }

    if (permit.status === 'DRAFT') {
      return {
        eligible: false,
        reason: 'Permit has not yet been approved.',
      };
    }

    return { eligible: false, reason: 'Permit cannot be renewed in its current state.' };
  };

  const eligibility = getEligibility();

  const handleRenewalSuccess = (updatedPermit: PermitDetailType) => {
    setPermit(updatedPermit);
    setSuccessBanner(
      `Permit renewed successfully to ${updatedPermit.endDate}! Status is now ${
        updatedPermit.status === 'ACTIVE' ? 'Active' : 'Awaiting Payment'
      }.`
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-base font-medium">Loading permit details...</p>
      </div>
    );
  }

  if (errorMessage || !permit) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-lg mx-auto text-center p-6">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" />
          <AlertTitle className="text-lg font-bold mb-2">Error Loading Permit</AlertTitle>
          <AlertDescription className="mb-5">{errorMessage || 'Permit not found'}</AlertDescription>
          <Button variant="outline" onClick={onBack} className="mx-auto">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Register
          </Button>
        </Alert>
      </div>
    );
  }

  const isEligibleForWithdrawal =
    permit &&
    permit.status !== 'WITHDRAWN' &&
    new Date(permit.startDate) > new Date();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Register (Filters Preserved)
        </Button>

        <div className="flex items-center gap-3">
          {isEligibleForWithdrawal && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsWithdrawModalOpen(true)}
              className="text-red-700 border-red-300 hover:bg-red-50"
            >
              <AlertTriangle className="w-4 h-4 mr-1.5 text-red-600" />
              Withdraw Permit
            </Button>
          )}

          {eligibility.eligible ? (
            <Button
              type="button"
              onClick={() => setIsRenewalModalOpen(true)}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Renew Permit
            </Button>
          ) : (
            <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium text-slate-500 gap-1">
              <Info className="w-3.5 h-3.5" />
              Renewal Blocked
            </Badge>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <Alert variant="success" className="mb-6 flex items-start justify-between shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <AlertTitle className="font-semibold">Update Successful</AlertTitle>
              <AlertDescription>{successBanner}</AlertDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs h-7"
          >
            Dismiss
          </Button>
        </Alert>
      )}

      {/* Ineligibility Warning Banner */}
      {!eligibility.eligible && eligibility.reason && (
        <Alert variant="warning" className="mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div>
            <AlertTitle className="font-semibold">Renewal Not Available</AlertTitle>
            <AlertDescription className="text-amber-800">{eligibility.reason}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* Primary Details Card (RC-2 Read-Only) */}
      <Card className="shadow-sm border-slate-200 overflow-hidden mb-8">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Permit Reference</span>
              <CardTitle className="text-2xl font-extrabold text-slate-900 mt-0.5">{permit.permitNumber}</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Current Status:</span>
              <StatusBadge status={permit.status} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Holder */}
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-slate-400 mt-1" />
              <div>
                <p className="text-xs uppercase font-medium text-slate-500">Permit Holder</p>
                <p className="text-base font-semibold text-slate-900">{permit.holderName}</p>
              </div>
            </div>

            {/* Hall */}
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-1" />
              <div>
                <p className="text-xs uppercase font-medium text-slate-500">Community Hall</p>
                <p className="text-base font-semibold text-slate-900">{permit.hallName}</p>
              </div>
            </div>

            {/* Purpose */}
            <div className="flex items-start space-x-3">
              <Tag className="w-5 h-5 text-slate-400 mt-1" />
              <div>
                <p className="text-xs uppercase font-medium text-slate-500">Booking Purpose</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base font-semibold text-slate-900">{permit.purposeName}</span>
                  {permit.isCouncilUse && (
                    <Badge variant="success" className="text-xs">
                      Council Business (£0)
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Start Date */}
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-1" />
              <div>
                <p className="text-xs uppercase font-medium text-slate-500">Start Date</p>
                <p className="text-base font-semibold text-slate-900">{permit.startDate}</p>
              </div>
            </div>

            {/* End Date */}
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <p className="text-xs uppercase font-medium text-slate-500">End Date</p>
                <p className="text-base font-bold text-blue-700">{permit.endDate}</p>
              </div>
            </div>

            {/* Total Current Fee */}
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-slate-400 mt-1" />
              <div>
                <p className="text-xs uppercase font-medium text-slate-500">Total Fee</p>
                <p className="text-base font-extrabold text-slate-900">£{permit.fee.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Renewal History & Action Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Renewal History (RC-2 AC-1) */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base font-bold text-slate-900">Renewal History</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {permit.renewalHistory.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-4 text-center">
                This permit has not been renewed yet.
              </p>
            ) : (
              <div className="space-y-3">
                {permit.renewalHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-sm"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        Extended to {rec.newEndDate}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Previous end date: {rec.previousEndDate} • Actioned: {rec.performedAt ? new Date(rec.performedAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">£{rec.fee.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Log / Event History */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <CardTitle className="text-base font-bold text-slate-900">Audit History Log</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {permit.history.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-4 text-center">
                No audit records logged yet.
              </p>
            ) : (
              <div className="space-y-3">
                {permit.history.map((event, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-700 tracking-wider uppercase">{event.action}</span>
                      <span className="text-slate-500">
                        {event.performedAt ? new Date(event.performedAt).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="font-mono text-slate-600 truncate">{event.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Renewal Two-Step Modal */}
      {isRenewalModalOpen && (
        <RenewalModal
          permit={permit}
          isOpen={isRenewalModalOpen}
          onClose={() => setIsRenewalModalOpen(false)}
          onSuccess={handleRenewalSuccess}
        />
      )}

      {/* Withdrawal Modal (RC-4) */}
      {isWithdrawModalOpen && (
        <WithdrawModal
          permit={permit}
          onClose={() => setIsWithdrawModalOpen(false)}
          onSuccess={(updated) => {
            setIsWithdrawModalOpen(false);
            setPermit(updated);
            setSuccessBanner(`Permit ${updated.permitNumber} has been successfully withdrawn. Hall reservation released.`);
          }}
        />
      )}
    </div>
  );
};
