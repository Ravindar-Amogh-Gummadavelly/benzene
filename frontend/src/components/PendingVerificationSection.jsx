import React, { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { fetchVerifications } from '../services/verificationApi';

export default function PendingVerificationSection({ onAction, refreshTrigger }) {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadQueue() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchVerifications();
        if (isMounted) {
          // Filter to those requiring attention (PENDING or DISCREPANCY)
          const pending = data.filter(
            (v) => v.status === 'Pending Verification' || v.status === 'PENDING' || v.status === 'DISCREPANCY' || v.status === 'Discrepancy'
          );
          setVerifications(pending);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load pending verifications:', err);
          setError(err.message || 'Error loading verification queue.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadQueue();
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-blue-700" />
            Pending Verification Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional FDR submissions awaiting physical/e-lien certificate audit (PostgreSQL Source)
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAction && onAction('view_all_verifications')}
          className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 hover:bg-blue-200"
        >
          {verifications.length} In Queue
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-blue-600" />
            <p className="text-xs font-medium text-slate-600">Loading pending verifications...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-xs text-rose-600">
            <AlertCircle className="h-5 w-5 mx-auto text-rose-500 mb-1" />
            <span>{error}</span>
          </div>
        ) : verifications.length > 0 ? (
          verifications.slice(0, 4).map((item) => (
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
                  <span>Branch: <strong className="text-slate-700">{item.branch || 'Main Branch'}</strong></span>
                  <span>Submitted: <strong className="text-slate-700">{item.submittedDate || 'Today'}</strong></span>
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
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-slate-400 text-xs">
            <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-500 mb-1" />
            <p className="font-semibold text-slate-700">Verification queue is clear</p>
            <p className="text-slate-500 mt-0.5">No institutional submissions are currently pending scrutiny.</p>
          </div>
        )}
      </div>
    </div>
  );
}
