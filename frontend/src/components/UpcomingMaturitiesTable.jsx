import React, { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import { CalendarClock, ExternalLink, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { fetchRenewals } from '../services/renewalApi';

export default function UpcomingMaturitiesTable({ onAction, refreshTrigger }) {
  const [maturities, setMaturities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadMaturities() {
      try {
        setLoading(true);
        setError(null);
        // Fetch real renewals / maturities
        const data = await fetchRenewals();
        if (isMounted) {
          // Sort by daysRemaining ascending
          const sorted = [...data].sort((a, b) => {
            if (a.daysRemaining === null) return 1;
            if (b.daysRemaining === null) return -1;
            return a.daysRemaining - b.daysRemaining;
          });
          setMaturities(sorted);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load upcoming maturities:', err);
          setError(err.message || 'Error loading maturities schedule.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMaturities();
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="flex flex-col gap-2 p-5 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="h-4.5 w-4.5 text-blue-700" />
            Upcoming Maturities &amp; Expiry Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Security deposits requiring mandatory encashment notice or renewal endorsement (PostgreSQL Source)
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAction && onAction('view_all_maturities', 'Upcoming Maturities')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 self-start sm:self-auto"
        >
          View all schedule <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-blue-600" />
          <p className="text-xs font-medium text-slate-600">Loading maturities from database...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-rose-600">
          <AlertCircle className="h-6 w-6 mx-auto text-rose-500 mb-1" />
          <span>{error}</span>
        </div>
      ) : maturities.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs italic">
          No records currently scheduled for maturity.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">FDR Number</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Bank &amp; Branch</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Maturity Date</th>
                <th className="py-3 px-4 text-center">Remaining</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {maturities.slice(0, 5).map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    <div>{row.fdrNumber}</div>
                    <div className="text-[10px] font-normal text-slate-400">
                      App: {row.applicationId || 'AICTE-REG'}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                    {row.institution}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{row.bank}</div>
                    <div className="text-[11px] text-slate-400">{row.branch || 'Main Branch'}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap text-right">
                    {row.amount}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {row.maturityDate || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        row.daysRemaining !== null && row.daysRemaining < 0
                          ? 'text-rose-600'
                          : row.daysRemaining !== null && row.daysRemaining <= 30
                          ? 'text-amber-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {row.daysRemaining !== null
                        ? row.daysRemaining < 0
                          ? `${Math.abs(row.daysRemaining)}d overdue`
                          : `${row.daysRemaining} days`
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={row.fdrStatus || row.status} />
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onAction && onAction('view_fdr', row.fdrNumber || row.fdrRecordId)}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs font-medium"
                    >
                      <span>View</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
