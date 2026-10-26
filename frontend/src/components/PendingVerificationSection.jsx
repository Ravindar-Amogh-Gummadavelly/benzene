import React from 'react';
import StatusBadge from './StatusBadge';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function PendingVerificationSection({ verifications = [], onAction }) {
  const pendingItems = verifications.filter((v) => v.status !== 'Verified' && v.status !== 'Rejected');

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-blue-700" />
            Pending Verification Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional FDR submissions awaiting physical/e-lien certificate audit
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAction && onAction('view_all_verifications')}
          className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 hover:bg-blue-200"
        >
          {pendingItems.length} In Queue
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {pendingItems.length > 0 ? (
          pendingItems.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900">
                    {item.institution}
                  </span>
                  <span className="rounded bg-white px-2 py-0.5 text-[11px] font-mono font-medium text-slate-600 border border-slate-200">
                    {item.fdrNumber}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Bank: <strong className="text-slate-700">{item.bank}</strong></span>
                  <span>Type: <strong className="text-slate-700">{item.type}</strong></span>
                  <span>Submitted: <strong className="text-slate-700">{item.submittedDate}</strong></span>
                  <span>Amount: <strong className="text-slate-900 font-semibold">{item.amount}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <StatusBadge status={item.status} />
                <button
                  type="button"
                  onClick={() => onAction && onAction('review_record', item)}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-colors"
                >
                  <span>Review</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
            All verification queue submissions have been processed.
          </div>
        )}
      </div>
    </div>
  );
}
