import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { PermitDetail } from '../types/permit';
import { api } from '../services/api';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Withdraw Permit: {permit.permitNumber}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
            <p className="font-medium">Important Municipal Policy:</p>
            <p>
              Withdrawing this permit immediately releases the facility reservation. 
              <strong> Refunds are not processed by this system</strong> and must be coordinated through Council Finance.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Withdrawal Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the reason provided by the holder or council authority (e.g. holder relocation, cancellation request)..."
              className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                isTooLong ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
              }`}
            />
            <div className="flex justify-between items-center text-xs mt-1">
              <span className={isTooLong ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                {charCount}/500 characters
              </span>
              {isTooLong && <span className="text-red-600">Exceeds 500-character limit</span>}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || loading}
              className="px-4 py-2 rounded text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Withdrawal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
