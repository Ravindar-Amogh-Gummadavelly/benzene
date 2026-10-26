import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';

export default function ComingSoonPage({ title, description, onBackToDashboard }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Construction className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-xs text-slate-500 leading-relaxed">
        {description || 'This module is scheduled for development in Phase 2 of the AICTE Regulation Bureau modernization program.'}
      </p>
      <div className="mt-6">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
