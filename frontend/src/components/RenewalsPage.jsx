import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Clock,
  Building2,
  Calendar,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  Eye,
  X,
  Search,
  Filter,
  Loader2,
  AlertTriangle,
  History,
  ShieldCheck,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import {
  fetchRenewals,
  fetchRenewalById,
  completeRenewal,
} from '../services/renewalApi';

export default function RenewalsPage({
  onActionFeedback,
  onViewFdrByNumber,
  refreshTrigger = 0,
}) {
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');

  // Modal state
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [processingRenewal, setProcessingRenewal] = useState(false);
  const [extensionYears, setExtensionYears] = useState(3);
  const [renewalRemarks, setRenewalRemarks] = useState('');
  const [modalMessage, setModalMessage] = useState(null);

  // Fetch renewals from real backend API
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRenewals({
        search: searchTerm,
        urgency: urgencyFilter,
      });
      setRenewals(data);
    } catch (err) {
      console.error('Failed to load renewals from API:', err);
      setError(err.message || 'Unable to connect to Renewals API service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, urgencyFilter, refreshTrigger]);

  // Open renewal details modal and fetch fresh dossier
  const handleOpenDetails = async (item) => {
    try {
      setSelectedRenewal(item);
      setModalLoading(true);
      setModalMessage(null);
      setRenewalRemarks(`Renewed following AICTE regulation scrutiny. Lien extended in favor of AICTE.`);
      const fullDossier = await fetchRenewalById(item.fdrRecordId);
      setSelectedRenewal(fullDossier);
    } catch (err) {
      console.error('Error fetching renewal details:', err);
      setModalMessage({ type: 'error', text: err.message });
    } finally {
      setModalLoading(false);
    }
  };

  // Process renewal execution
  const handleProcessRenewal = async () => {
    if (!selectedRenewal) return;
    try {
      setProcessingRenewal(true);
      setModalMessage(null);
      const updated = await completeRenewal(selectedRenewal.fdrRecordId, {
        extensionYears: parseInt(extensionYears, 10) || 3,
        remarks: renewalRemarks.trim() || `Renewed deposit for ${extensionYears} years.`,
      });

      setSelectedRenewal(updated);
      setModalMessage({
        type: 'success',
        text: `FDR ${updated.fdrNumber} renewed successfully until ${updated.currentMaturityDate}!`,
      });
      if (onActionFeedback) {
        onActionFeedback(`Successfully renewed FDR ${updated.fdrNumber} for ${extensionYears} years.`);
      }
      // Refresh list
      loadData();
    } catch (err) {
      console.error('Failed to process renewal:', err);
      setModalMessage({ type: 'error', text: err.message || 'Failed to complete renewal.' });
    } finally {
      setProcessingRenewal(false);
    }
  };

  const overdueCount = renewals.filter((r) => r.isExpired).length;
  const expiring30Count = renewals.filter((r) => r.urgencyCategory === 'DUE_7_DAYS' || r.urgencyCategory === 'DUE_30_DAYS').length;

  return (
    <div className="space-y-6">
      {/* Page Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight sm:text-2xl flex items-center gap-2">
            <RefreshCw className="h-6 w-6 text-blue-700" />
            FDR Renewals &amp; Maturity Tracking
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time PostgreSQL tracking of deposit maturity dates, statutory extensions, and roll-over deeds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            title="Refresh renewal data from PostgreSQL"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-700' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (onActionFeedback) {
                onActionFeedback(`Dispatched batch automated renewal notices for ${expiring30Count} FDR(s) approaching maturity.`);
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
          >
            <Clock className="h-4 w-4" />
            <span>Dispatch Batch Reminder Notice</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Urgency Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'ALL', label: 'All Deposits' },
              { id: 'OVERDUE', label: `Overdue / Expired (${overdueCount})` },
              { id: 'DUE_30_DAYS', label: `Due in ≤ 30 Days (${expiring30Count})` },
              { id: 'DUE_60_DAYS', label: 'Due in ≤ 60 Days' },
              { id: 'LATER', label: 'Active / Later' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setUrgencyFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  urgencyFilter === tab.id
                    ? 'bg-blue-700 text-white shadow-2xs font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search FDR #, institution, bank..."
              className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-1.5 text-xs placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-16 text-center shadow-xs">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Calculating deposit maturity schedules...</h3>
          <p className="text-xs text-slate-500 mt-1">Connecting to PostgreSQL database ledger</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-rose-600 mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Failed to load renewals</h3>
          <p className="text-xs text-rose-700 mt-1">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="mt-4 rounded-lg bg-rose-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-800"
          >
            Retry Connection
          </button>
        </div>
      ) : renewals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Clock className="h-10 w-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No deposit records match the criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing the search query or selecting another maturity window.</p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setUrgencyFilter('ALL');
            }}
            className="mt-4 text-xs font-semibold text-blue-700 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Grid of Renewal cards */
        <div className="grid grid-cols-1 gap-4">
          {renewals.map((item) => {
            const isOverdue = item.isExpired;
            const isUrgent = item.urgencyCategory === 'DUE_7_DAYS' || item.urgencyCategory === 'DUE_30_DAYS';

            return (
              <div
                key={item.id}
                className={`rounded-xl border bg-white p-5 shadow-xs transition-all hover:border-slate-300 ${
                  isOverdue
                    ? 'border-rose-200 ring-1 ring-rose-200'
                    : isUrgent
                    ? 'border-amber-200 ring-1 ring-amber-200'
                    : 'border-slate-200'
                }`}
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
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                          <AlertTriangle className="h-3 w-3" />
                          Term Overdue
                        </span>
                      )}
                      {isUrgent && !isOverdue && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          <Clock className="h-3 w-3" />
                          Expiring Soon
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Deposit Amount</span>
                        <strong className="text-slate-900 text-sm">{item.amount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Maturity Date</span>
                        <span className={`font-semibold ${isOverdue ? 'text-rose-700' : isUrgent ? 'text-amber-700' : 'text-slate-800'}`}>
                          {item.currentMaturityDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Days Remaining</span>
                        <span className={`font-bold ${isOverdue ? 'text-rose-700' : isUrgent ? 'text-amber-700' : 'text-slate-800'}`}>
                          {item.daysRemaining !== null ? `${item.daysRemaining} days left` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank &amp; Branch</span>
                        <span className="font-medium text-slate-800 truncate block">
                          {item.bank} • {item.branch}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100 mt-2">
                      <strong className="text-slate-700">Audit Status: </strong>
                      {item.requestNotes}
                    </p>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <StatusBadge status={item.status} />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        <span>Inspect &amp; Renew</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onActionFeedback) {
                            onActionFeedback(`Dispatched statutory renewal notice to ${item.institution} for FDR ${item.fdrNumber}`);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 transition-colors"
                      >
                        <span>Issue Notice</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Renewal & Maturity Details Modal */}
      {selectedRenewal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="relative w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Maturity &amp; Renewal Dossier: {selectedRenewal.fdrNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRenewal(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalMessage && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  modalMessage.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {modalMessage.type === 'error' ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                )}
                <span>{modalMessage.text}</span>
              </div>
            )}

            {modalLoading ? (
              <div className="py-12 text-center text-slate-500">
                <Loader2 className="h-6 w-6 mx-auto animate-spin text-blue-700 mb-2" />
                <p className="text-xs">Fetching renewal history from PostgreSQL...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Institution</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedRenewal.institution}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank &amp; Branch</span>
                    <p className="font-semibold text-slate-800">{selectedRenewal.bank} • {selectedRenewal.branch}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Deposit Amount</span>
                    <p className="font-bold text-slate-900 text-sm">{selectedRenewal.amount}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Maturity</span>
                    <p className="font-semibold text-rose-700">{selectedRenewal.currentMaturityDate}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Days Remaining</span>
                    <p className="font-bold text-amber-700">{selectedRenewal.daysRemaining} days left</p>
                  </div>
                </div>

                {/* Renewal History if any */}
                {selectedRenewal.renewalHistory && selectedRenewal.renewalHistory.length > 0 && (
                  <div className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/50">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <History className="h-4 w-4 text-slate-600" />
                      <span>Previous Renewal Deeds ({selectedRenewal.renewalHistory.length})</span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {selectedRenewal.renewalHistory.map((h) => (
                        <div key={h.id} className="text-[11px] bg-white p-2 rounded border border-slate-200">
                          <div className="flex justify-between font-semibold text-slate-700">
                            <span>Extended to: {h.newMaturityDate}</span>
                            <span className="text-slate-400 font-normal">Prior: {h.oldMaturityDate}</span>
                          </div>
                          {h.remarks && <p className="text-slate-500 mt-0.5">{h.remarks}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Process Renewal Action Section */}
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4 text-blue-700" />
                    <span>Process Statutory FDR Renewal</span>
                  </div>
                  <p className="text-blue-800 text-[11px]">
                    Extending this deposit will create an immutable Renewal record and update the maturity date in PostgreSQL.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Extension Tenure
                      </label>
                      <select
                        value={extensionYears}
                        onChange={(e) => setExtensionYears(e.target.value)}
                        className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="1">1 Year Extension</option>
                        <option value="2">2 Years Extension</option>
                        <option value="3">3 Years Extension (Standard)</option>
                        <option value="5">5 Years Extension (Statutory)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Renewal Remarks / Lien Ref
                      </label>
                      <input
                        type="text"
                        value={renewalRemarks}
                        onChange={(e) => setRenewalRemarks(e.target.value)}
                        placeholder="Regulatory council approval note..."
                        className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleProcessRenewal}
                    disabled={processingRenewal}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors disabled:opacity-75"
                  >
                    {processingRenewal ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating Ledger...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Confirm &amp; Record Renewal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedRenewal(null);
                  if (onViewFdrByNumber) {
                    onViewFdrByNumber(selectedRenewal.fdrNumber);
                  }
                }}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Go to Full FDR Master Record →
              </button>
              <button
                type="button"
                onClick={() => setSelectedRenewal(null)}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
