import React from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  onReset?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onReset }) => {
  return (
    <div className="text-center py-12 px-4 bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-4">
        <SearchX className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">No permits found</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">
        No permit records match the current filter criteria. Try adjusting your search or reset all filters.
      </p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
};
