import React, { useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, DollarSign, Info, ShieldAlert, X } from 'lucide-react';
import type { PermitDetail, RenewalPreview } from '../types/permit';
import { api, ApiRequestError } from '../services/api';

interface RenewalModalProps {
  permit: PermitDetail;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: PermitDetail) => void;
}

export const RenewalModal: React.FC<RenewalModalProps> = ({
  permit,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newEndDate, setNewEndDate] = useState<string>('');
  const [step, setStep] = useState<'INPUT' | 'CONFIRM'>('INPUT');
  const [preview, setPreview] = useState<RenewalPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Step 1: Calculate Fee (Preview)
  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEndDate) {
      setErrorMessage('Please select a new end date.');
      return;
    }

    if (newEndDate <= permit.endDate) {
      setErrorMessage(`New end date must be strictly after the current end date (${permit.endDate}).`);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const previewData = await api.previewRenewal(permit.id, newEndDate);
      setPreview(previewData);
      setStep('CONFIRM');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to calculate renewal fee. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Confirm & Commit Renewal
  const handleCommit = async () => {
    if (!preview) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const updatedPermit = await api.commitRenewal(permit.id, preview.newEndDate);
      onSuccess(updatedPermit);
      handleClose();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to commit renewal. Transaction rolled back.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('INPUT');
    setPreview(null);
    setErrorMessage(null);
    setNewEndDate('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {step === 'INPUT' ? 'Extend Permit End Date' : 'Confirm Renewal & Fee'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2.5 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'INPUT' ? (
            <form onSubmit={handlePreview} className="space-y-5">
              {/* Permit Summary Context */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Permit Number:</span>
                  <span className="font-semibold text-slate-800">{permit.permitNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Holder:</span>
                  <span className="font-medium text-slate-800">{permit.holderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hall:</span>
                  <span className="font-medium text-slate-800">{permit.hallName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current End Date:</span>
                  <span className="font-semibold text-blue-600">{permit.endDate}</span>
                </div>
              </div>

              {/* New Date Picker */}
              <div>
                <label htmlFor="modalNewEndDate" className="block text-sm font-semibold text-slate-700 mb-1">
                  New End Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="modalNewEndDate"
                  type="date"
                  min={permit.endDate}
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Must be strictly after {permit.endDate}.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !newEndDate}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? 'Calculating...' : 'Preview Fee Breakdown'}
                </button>
              </div>
            </form>
          ) : preview ? (
            <div className="space-y-5">
              {/* Fee Breakdown Card */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Current End Date:</span>
                  <span className="font-medium text-slate-800">{preview.previousEndDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">New End Date:</span>
                  <span className="font-bold text-blue-600">{preview.newEndDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Days Added:</span>
                  <span className="font-medium text-slate-800">{preview.daysAdded} calendar days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Billable Days:</span>
                  <span className="font-medium text-slate-800">
                    {preview.cappedDays} days {preview.isCapped && '(Capped at 30)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Daily Rate:</span>
                  <span className="font-medium text-slate-800">£{preview.dailyRate.toFixed(2)}/day</span>
                </div>
                
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                  <span className="text-base font-bold text-slate-900">Total Renewal Fee:</span>
                  <span className="text-xl font-extrabold text-blue-600">
                    £{preview.calculatedFee.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Statutory Cap Banner (FR-14) */}
              {preview.isCapped && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start space-x-2 text-xs text-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>30-Day Policy Cap Applied:</strong> Extension of {preview.daysAdded} days exceeds the statutory cap. The holder is billed for 30 days per council fee policy.
                  </span>
                </div>
              )}

              {/* Council Use Zero-Fee Notice (FR-15) */}
              {preview.isCouncilUse && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-start space-x-2 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Council Business Exemption:</strong> Council Use permits are issued free of charge (£0.00). No invoice will be generated.
                  </span>
                </div>
              )}

              {/* Status Transition Notice (BR-5) */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start space-x-2 text-xs text-blue-800">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  On confirmation, status moves to <strong>{preview.resultingStatus === 'ACTIVE' ? 'Active' : 'Awaiting Payment'}</strong>.
                </span>
              </div>

              {/* Officer Verbal Confirmation Prompt */}
              <p className="text-xs text-slate-500 italic text-center">
                Permits Officer: Read the calculated total to the holder before confirming.
              </p>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('INPUT')}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 cursor-pointer"
                >
                  Change Date
                </button>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  {isLoading ? 'Saving...' : 'Confirm & Extend Permit'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
