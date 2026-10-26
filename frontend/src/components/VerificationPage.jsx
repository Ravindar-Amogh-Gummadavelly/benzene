import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Filter,
  FileCheck,
  AlertTriangle,
  Building2,
  Calendar,
  Landmark,
  ArrowRight,
  ShieldAlert,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { fetchVerifications } from '../services/verificationApi';

export default function VerificationPage({
  onReview,
  refreshTrigger = 0,
}) {
  const [verifications, setVerifications] = useState([]);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchVerifications({
        status: filter,
        search: searchTerm,
      });
      setVerifications(data);
    } catch (err) {
      console.error('Failed to load verifications from API:', err);
      setError(err.message || 'Unable to load verification records from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 200);

    return () => clearTimeout(timer);
  }, [filter, searchTerm, refreshTrigger]);

  const pendingCount = verifications.filter((v) => v.rawStatus === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight sm:text-2xl flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-blue-700" />
            Verification Queue
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Scrutiny desk for initial FDR security deposits and bank lien certificates submitted by institutions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            title="Refresh verification queue"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-700' : ''}`} />
            <span>Sync</span>
          </button>
          <span className="rounded-lg bg-blue-100 text-blue-800 px-3 py-1.5 text-xs font-bold">
            {pendingCount} Awaiting Scrutiny
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['All', 'Pending Verification', 'Discrepancy', 'Verified', 'Rejected'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  filter === tab
                    ? 'bg-blue-700 text-white shadow-2xs font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by FDR number, institution, bank..."
              className="h-9 w-full rounded-lg border border-slate-300 bg-slate-50 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">Failed to load verification queue from database</p>
              <p className="mt-0.5 text-[11px]">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="rounded bg-rose-700 px-3 py-1 font-semibold text-white hover:bg-rose-800 transition-colors shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Verification Cards */}
      <div className="grid grid-cols-1 gap-4">
        {loading && verifications.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Loading verification records from database...</p>
          </div>
        ) : verifications.length > 0 ? (
          verifications.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-800 border border-slate-200">
                      {item.fdrNumber}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">
                      {item.institution}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Amount</span>
                      <strong className="text-slate-900 text-sm">{item.amount}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Deposit Type</span>
                      <span className="font-medium text-slate-800">{item.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank &amp; Branch</span>
                      <span className="font-medium text-slate-800">{item.bank}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Submitted Date</span>
                      <span className="font-medium text-slate-800">{item.submittedDate}</span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100 mt-2">
                      <span className="font-semibold text-slate-700">Remarks: </span>
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <StatusBadge status={item.status} />
                  <button
                    type="button"
                    onClick={() => onReview(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
                  >
                    <span>Scrutinize &amp; Review</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
            <CheckCircle2 className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">No verification items matching this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
