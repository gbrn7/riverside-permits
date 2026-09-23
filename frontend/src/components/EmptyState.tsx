import React from 'react';
import { SearchX } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface EmptyStateProps {
  onReset?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onReset }) => {
  return (
    <Card className="text-center py-12 px-4 shadow-sm border-slate-200">
      <CardContent className="flex flex-col items-center justify-center p-0">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 mb-4">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">No permits found</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">
          No permit records match the current filter criteria. Try adjusting your search or reset all filters.
        </p>
        {onReset && (
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
          >
            Reset Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
