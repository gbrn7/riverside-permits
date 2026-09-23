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
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-red-900 mb-2">Error Loading Permit</h2>
          <p className="text-sm text-red-700 mb-5">{errorMessage || 'Permit not found'}</p>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Register (Filters Preserved)
        </button>

        <div className="flex items-center space-x-3">
          {eligibility.eligible ? (
            <button
              type="button"
              onClick={() => setIsRenewalModalOpen(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Renew Permit
            </button>
          ) : (
            <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
              <Info className="w-3.5 h-3.5 mr-1" />
              Renewal Blocked
            </div>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-emerald-800 text-sm shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{successBanner}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-500 hover:text-emerald-700 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Ineligibility Warning Banner */}
      {!eligibility.eligible && eligibility.reason && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Renewal Not Available</p>
            <p className="text-amber-700 mt-0.5">{eligibility.reason}</p>
          </div>
        </div>
      )}

      {/* Primary Details Card (RC-2 Read-Only) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Permit Reference</span>
            <h2 className="text-2xl font-extrabold text-slate-900">{permit.permitNumber}</h2>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500">Current Status:</span>
            <StatusBadge status={permit.status} />
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <p className="text-base font-semibold text-slate-900">
                {permit.purposeName}
                {permit.isCouncilUse && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                    Council Business (£0)
                  </span>
                )}
              </p>
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
      </div>

      {/* Renewal History & Action Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Renewal History (RC-2 AC-1) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 pb-3">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Renewal History</h3>
          </div>

          {permit.renewalHistory.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-4 text-center">
              This permit has not been renewed yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {permit.renewalHistory.map((rec) => (
                <div key={rec.id} className="py-3 text-sm flex justify-between items-center">
                  <div>
                    <div className="font-medium text-slate-800">
                      Extended to: <span className="font-bold text-blue-600">{rec.newEndDate}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Previous end date: {rec.previousEndDate} • Actioned: {rec.performedAt ? new Date(rec.performedAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-900">£{rec.fee.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log / Event History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 pb-3">
            <History className="w-5 h-5 text-slate-600" />
            <h3 className="text-base font-bold text-slate-900">Audit History Log</h3>
          </div>

          {permit.history.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-4 text-center">
              No audit records logged yet.
            </p>
          ) : (
            <div className="space-y-3">
              {permit.history.map((event, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-700 tracking-wider">{event.action}</span>
                    <span className="text-slate-500">
                      {event.performedAt ? new Date(event.performedAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="font-mono text-slate-600 truncate">{event.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
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
    </div>
  );
};
