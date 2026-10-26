import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Calendar,
  Building2,
  Landmark,
  ShieldCheck,
  RefreshCw,
  Download,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { fetchFdrById } from '../services/fdrApi';

export default function FdrDetailsModal({ fdrId, onClose, onActionFeedback }) {
  const [fdr, setFdr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDetails() {
      if (!fdrId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await fetchFdrById(fdrId);
        if (isMounted) {
          setFdr(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load FDR details:', err);
          setError(err.message || 'Error fetching FDR details from API.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [fdrId]);

  if (!fdrId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-200 bg-white shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {loading ? 'Loading FDR...' : fdr?.fdrNumber}
                </h3>
                {fdr?.aicteApplicationId && (
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300">
                    {fdr.aicteApplicationId}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Institutional Fixed Deposit Receipt Dossier (PostgreSQL Source)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {loading ? (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
              <p className="font-semibold text-slate-700 text-sm">
                Fetching record dossier via <code>GET /api/fdr/{fdrId}</code>...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
              <AlertCircle className="h-8 w-8 mx-auto text-rose-600" />
              <p className="font-bold text-rose-800">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="rounded bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          ) : fdr ? (
            <>
              {/* Status summary banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase text-slate-400">
                    FDR Deposit Amount
                  </span>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {fdr.amount}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <span className="text-[11px] block font-semibold uppercase text-slate-400">
                      Current Status
                    </span>
                    <StatusBadge status={fdr.status} />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] block font-semibold uppercase text-slate-400">
                      Verification
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                      <ShieldCheck className="h-3 w-3" />
                      {fdr.verificationStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Institution Card */}
                <div className="rounded-lg border border-slate-200 p-4 bg-white space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
                    <Building2 className="h-4 w-4 text-blue-700" />
                    <span>Institution Information</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div>
                      <span className="text-slate-400">Name:</span>
                      <p className="font-semibold text-slate-800">{fdr.institution}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">AICTE Application ID:</span>
                      <p className="font-mono text-slate-700">{fdr.aicteApplicationId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Joint Account Holder:</span>
                      <p className="text-slate-700 font-medium">{fdr.jointAccountHolder || 'Regional Officer, AICTE'}</p>
                    </div>
                  </div>
                </div>

                {/* Banking Details */}
                <div className="rounded-lg border border-slate-200 p-4 bg-white space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
                    <Landmark className="h-4 w-4 text-blue-700" />
                    <span>Bank &amp; Branch Particulars</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div>
                      <span className="text-slate-400">Bank Name:</span>
                      <p className="font-semibold text-slate-800">{fdr.bank || fdr.bankName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Branch Address:</span>
                      <p className="text-slate-700">{fdr.branch || fdr.branchName || 'Main Branch'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">IFSC Code:</span>
                      <p className="font-mono font-medium text-slate-700">{fdr.ifsc || 'SBIN0001092'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maturity & Tenure Schedule */}
              <div className="rounded-lg border border-slate-200 p-4 bg-white space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
                  <Calendar className="h-4 w-4 text-blue-700" />
                  <span>Tenure &amp; Maturity Schedule</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="rounded bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Deposit Tenure</span>
                    <p className="font-bold text-slate-900 mt-0.5">{fdr.tenure || '5 Years'}</p>
                  </div>
                  <div className="rounded bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Issue Date</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{fdr.issueDate || 'N/A'}</p>
                  </div>
                  <div className="rounded bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Maturity Date</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{fdr.maturityDate || 'N/A'}</p>
                  </div>
                  <div className="rounded bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Days Remaining</span>
                    <p
                      className={`font-bold mt-0.5 ${
                        fdr.daysRemaining !== null && fdr.daysRemaining <= 30
                          ? 'text-amber-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {fdr.daysRemaining !== null ? `${fdr.daysRemaining} days` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attached Documents info */}
              <div className="rounded-lg border border-slate-200 p-4 bg-white space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
                  <FileText className="h-4 w-4 text-blue-700" />
                  <span>Attached Documents &amp; Lien Verification Records</span>
                </div>
                {fdr.documents && fdr.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {fdr.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded border border-slate-200 bg-slate-50/70"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-medium text-slate-800 truncate">{doc.fileName || doc.name}</p>
                            <span className="text-[10px] text-slate-400">{doc.documentType || 'Uploaded Document'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No document uploads attached yet for this database record.</p>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Close Dossier
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || !fdr}
              onClick={() => onActionFeedback(`Generated official PDF Certificate for ${fdr?.fdrNumber}`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </button>
            <button
              type="button"
              disabled={loading || !fdr}
              onClick={() => onActionFeedback(`Dispatched bank verification inquiry for ${fdr?.bank}`)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Bank Verification Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
