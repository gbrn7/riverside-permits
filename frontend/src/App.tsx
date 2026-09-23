import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { PermitRegister } from './components/PermitRegister';
import { PermitDetail } from './components/PermitDetail';

export const App: React.FC = () => {
  const [selectedPermitId, setSelectedPermitId] = useState<number | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('permitId');
    return idParam ? parseInt(idParam, 10) : null;
  });

  const handleSelectPermit = (id: number) => {
    setSelectedPermitId(id);
    const params = new URLSearchParams(window.location.search);
    params.set('permitId', String(id));
    window.history.pushState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  const handleBackToRegister = () => {
    setSelectedPermitId(null);
    const params = new URLSearchParams(window.location.search);
    params.delete('permitId');
    const newRelativePathQuery = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    window.history.pushState(null, '', newRelativePathQuery);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Council Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleBackToRegister}>
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block leading-tight">
                Riverside Council
              </span>
              <span className="text-xs text-slate-400 font-medium block">
                Community Hall Permit Register
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              Internal Staff Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {selectedPermitId !== null ? (
          <PermitDetail permitId={selectedPermitId} onBack={handleBackToRegister} />
        ) : (
          <PermitRegister onSelectPermit={handleSelectPermit} />
        )}
      </main>

      {/* Municipal Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Riverside Council — Public Facilities & Community Hall Management System.</p>
          <p className="mt-1 text-slate-400">RC-1 Search • RC-2 View • RC-3 Renew</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
