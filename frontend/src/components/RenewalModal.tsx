import React, { useState } from 'react';
import { Calendar, CheckCircle2, DollarSign, Info, ShieldAlert, X, AlertCircle } from 'lucide-react';
import type { PermitDetail, RenewalPreview } from '../types/permit';
import { api, ApiRequestError } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
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
            <Alert variant="destructive" className="mb-5">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
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
              <div className="space-y-1.5">
                <label htmlFor="modalNewEndDate" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  New End Date <span className="text-red-500">*</span>
                </label>
                <Input
                  id="modalNewEndDate"
                  type="date"
                  min={permit.endDate}
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  required
                />
                <p className="text-xs text-slate-500">
                  Must be strictly after {permit.endDate}.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !newEndDate}
                >
                  {isLoading ? 'Calculating...' : 'Preview Fee Breakdown'}
                </Button>
              </div>
            </form>
          ) : preview ? (
            <div className="space-y-4">
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
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Billable Days:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-800">{preview.cappedDays} days</span>
                    {preview.isCapped && (
                      <Badge variant="warning" className="text-[10px] py-0">
                        30-Day Cap
                      </Badge>
                    )}
                  </div>
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
                <Alert variant="warning" className="py-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5" />
                  <AlertDescription className="text-amber-800 text-xs">
                    <strong>30-Day Statutory Cap:</strong> Extension of {preview.daysAdded} days exceeds statutory maximum. Holder is invoiced for 30 days per council fee regulations.
                  </AlertDescription>
                </Alert>
              )}

              {/* Council Use Zero-Fee Notice (FR-15) */}
              {preview.isCouncilUse && (
                <Alert variant="success" className="py-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <AlertDescription className="text-emerald-800 text-xs">
                    <strong>Council Business Exemption:</strong> Council Use permits are issued free of charge (£0.00). No invoice will be generated.
                  </AlertDescription>
                </Alert>
              )}

              {/* Status Transition Notice (BR-5) */}
              <Alert variant="info" className="py-2.5">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <AlertDescription className="text-blue-800 text-xs">
                  On confirmation, status moves to <strong>{preview.resultingStatus === 'ACTIVE' ? 'Active' : 'Awaiting Payment'}</strong>.
                </AlertDescription>
              </Alert>

              {/* Officer Verbal Confirmation Prompt */}
              <p className="text-xs text-slate-500 italic text-center">
                Permits Officer: Read the calculated total to the holder on the phone before confirming.
              </p>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('INPUT')}
                  disabled={isLoading}
                >
                  Change Date
                </Button>
                <Button
                  type="button"
                  variant="success"
                  onClick={handleCommit}
                  disabled={isLoading}
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  {isLoading ? 'Saving...' : 'Confirm & Extend Permit'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
