import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { PermitDetail } from '../types/permit';
import { api } from '../services/api';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';

interface WithdrawModalProps {
  permit: PermitDetail;
  onClose: () => void;
  onSuccess: (updated: PermitDetail) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ permit, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = reason.length;
  const isTooLong = charCount > 500;
  const isValid = reason.trim().length > 0 && !isTooLong;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      setLoading(true);
      setError(null);
      const updated = await api.withdrawPermit(permit.id, reason.trim());
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw permit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold">Withdraw Permit: {permit.permitNumber}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Alert variant="warning" className="border-amber-200 bg-amber-50">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
            <AlertDescription className="text-amber-800 text-xs">
              <strong className="block font-semibold mb-0.5">Statutory Council Policy:</strong>
              Withdrawing this permit immediately releases the facility reservation. 
              <strong> Refunds are not processed by this register</strong> and must be coordinated through Council Finance.
            </AlertDescription>
          </Alert>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Withdrawal Justification <span className="text-red-500">*</span>
            </label>
            <Textarea
              rows={4}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the official justification (e.g. holder requested withdrawal due to illness, severe weather)..."
              className={isTooLong ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            <div className="flex justify-between items-center text-xs mt-1">
              <span className={isTooLong ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                {charCount}/500 characters
              </span>
              {isTooLong && <span className="text-red-600 font-medium">Exceeds 500-character limit</span>}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isValid || loading}
            >
              {loading ? 'Processing...' : 'Confirm Withdrawal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
