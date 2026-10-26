import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Building2,
  Landmark,
  Calendar,
  AlertCircle,
  Shield,
  Loader2,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import {
  fetchVerificationById,
  approveVerification,
  raiseVerificationDiscrepancy,
  rejectVerification,
} from '../services/verificationApi';

export default function VerificationReviewModal({
  verificationId,
  onClose,
  onActionComplete,
}) {
  const [activeTab, setActiveTab] = useState('review');
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [approveRemarks, setApproveRemarks] = useState('Deposit and bank lien verified against AICTE norms.');
  const [discrepancyNote, setDiscrepancyNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Fetch live verification details
  useEffect(() => {
    let isMounted = true;
    async function loadRecord() {
      if (!verificationId) return;
      try {
        setLoading(true);
        setErrorMessage(null);
        const data = await fetchVerificationById(verificationId);
        if (isMounted) {
          setRecord(data);
          if (data.rawStatus === 'DISCREPANCY' && data.notes) {
            setDiscrepancyNote(data.notes);
          } else if (data.rawStatus === 'REJECTED' && data.notes) {
            setRejectReason(data.notes);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load verification record:', err);
          setErrorMessage(err.message || 'Error loading verification details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadRecord();
    return () => {
      isMounted = false;
    };
  }, [verificationId]);

  if (!verificationId) return null;

  const handleVerify = async () => {
    try {
      setActionLoading(true);
      setErrorMessage(null);
      const updated = await approveVerification(verificationId, approveRemarks);
      onActionComplete('approve', updated);
      onClose();
    } catch (err) {
      console.error('Failed to approve verification:', err);
      setErrorMessage(err.message || 'Failed to approve verification.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDiscrepancy = async () => {
    if (!discrepancyNote.trim()) {
      setErrorMessage('Please provide discrepancy remarks for the institution and bank.');
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage(null);
      const updated = await raiseVerificationDiscrepancy(verificationId, discrepancyNote.trim());
      onActionComplete('discrepancy', updated);
      onClose();
    } catch (err) {
      console.error('Failed to raise discrepancy:', err);
      setErrorMessage(err.message || 'Failed to raise discrepancy.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setErrorMessage('Please specify the reason for rejecting this FDR deposit.');
      return;
    }

    try {
      setActionLoading(true);
      setErrorMessage(null);
      const updated = await rejectVerification(verificationId, rejectReason.trim());
      onActionComplete('reject', updated);
      onClose();
    } catch (err) {
      console.error('Failed to reject verification:', err);
      setErrorMessage(err.message || 'Failed to reject verification.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Review Verification Submission
              </h3>
              <p className="text-xs text-slate-300">
                {loading ? 'Connecting to ledger...' : `${record?.fdrNumber} • ${record?.institution}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 p-3.5 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {loading ? (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
              <p className="font-semibold text-slate-700 text-sm">
                Fetching verification dossier from PostgreSQL...
              </p>
            </div>
          ) : record ? (
            <>
              {/* Key metadata grid */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Amount</span>
                  <p className="text-lg font-bold text-slate-900">{record.amount}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Deposit Type</span>
                  <p className="font-semibold text-slate-800">{record.type}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Bank</span>
                  <p className="font-semibold text-slate-800">{record.bank}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Current Status</span>
                  <div className="mt-0.5">
                    <StatusBadge status={record.status} />
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 p-3.5 bg-white">
                  <h4 className="font-bold text-slate-900 mb-2">Submission Particulars</h4>
                  <p className="text-slate-600 leading-relaxed">
                    {record.notes || 'Submitted by Institute Registrar with joint lien clause in favor of AICTE Regulation Bureau.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                    <span>Submitted Date: <strong className="text-slate-700">{record.submittedDate}</strong></span>
                    <span>•</span>
                    <span>Branch: <strong className="text-slate-700">{record.branch || 'Main Commercial Branch'}</strong></span>
                    <span>•</span>
                    <span>Tenure: <strong className="text-slate-700">{record.tenure || '5 Years'}</strong></span>
                  </div>
                </div>

                {/* Verification Checklist */}
                <div className="rounded-lg border border-slate-200 p-3.5 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900">Regulatory Verification Checklist</h4>
                  <div className="space-y-1.5 text-slate-600">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span>Amount matches AICTE Approval Process Handbook (APH) norm</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span>Lien legally noted in favor of Member Secretary / Regional Officer</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span>Deposit created in Scheduled Commercial Bank</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Decision Modes */}
              <div className="space-y-3 pt-2">
                <div className="flex border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab('review')}
                    className={`py-2 px-3 border-b-2 font-bold text-xs transition-colors ${
                      activeTab === 'review'
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    1. Approve Verification
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('discrepancy')}
                    className={`py-2 px-3 border-b-2 font-bold text-xs transition-colors ${
                      activeTab === 'discrepancy'
                        ? 'border-amber-600 text-amber-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    2. Raise Discrepancy
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('reject')}
                    className={`py-2 px-3 border-b-2 font-bold text-xs transition-colors ${
                      activeTab === 'reject'
                        ? 'border-rose-600 text-rose-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    3. Reject Submission
                  </button>
                </div>

                {activeTab === 'review' && (
                  <div className="rounded-lg bg-emerald-50/70 border border-emerald-200 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Ready to Verify &amp; Register FDR</span>
                    </div>
                    <p className="text-emerald-700 leading-relaxed text-[11px]">
                      Confirming will transition this verification to <strong>Verified</strong> and update the associated FDR to <strong>Approved</strong> in PostgreSQL.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleVerify}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors disabled:opacity-75"
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Updating Database...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Confirm &amp; Verify FDR</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'discrepancy' && (
                  <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 font-bold">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Specify Discrepancy Note</span>
                    </div>
                    <p className="text-amber-700 text-[11px]">
                      A formal discrepancy status will be saved to PostgreSQL and the associated FDR will be marked <strong>Discrepancy</strong>.
                    </p>
                    <textarea
                      rows={3}
                      value={discrepancyNote}
                      onChange={(e) => setDiscrepancyNote(e.target.value)}
                      placeholder="e.g. Lien certificate does not mention AICTE as joint beneficiary, or tenure is short by 1 year."
                      className="w-full rounded border border-amber-300 bg-white p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-200"
                    />
                    <button
                      type="button"
                      onClick={handleRaiseDiscrepancy}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white shadow-xs hover:bg-amber-800 transition-colors disabled:opacity-75"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Issuing Notice...</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          <span>Issue Discrepancy Notice</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {activeTab === 'reject' && (
                  <div className="rounded-lg bg-rose-50/70 border border-rose-200 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 font-bold">
                      <XCircle className="h-4 w-4" />
                      <span>Reject Submission</span>
                    </div>
                    <p className="text-rose-700 text-[11px]">
                      Rejection will mark the verification as <strong>Rejected</strong> and flag the associated FDR record.
                    </p>
                    <textarea
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Specify regulatory rejection reason..."
                      className="w-full rounded border border-rose-300 bg-white p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-200"
                    />
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-4 py-2 font-semibold text-white shadow-xs hover:bg-rose-800 transition-colors disabled:opacity-75"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Rejecting in Database...</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          <span>Reject Submission</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
