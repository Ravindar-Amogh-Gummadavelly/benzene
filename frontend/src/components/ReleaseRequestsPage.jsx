import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  FileBadge,
  Building2,
  Calendar,
  AlertTriangle,
  Eye,
  FileText,
  X,
  ShieldCheck,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Check,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import {
  fetchReleases,
  fetchReleaseById,
  createReleaseRequest,
  approveReleaseRequest,
  rejectReleaseRequest,
} from '../services/releaseApi';
import { fetchFdrs } from '../services/fdrApi';

export default function ReleaseRequestsPage({
  onActionFeedback,
  onViewFdrByNumber,
  refreshTrigger = 0,
  currentUser,
}) {
  const [releaseRequests, setReleaseRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Review & Approval Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [activeModalTab, setActiveModalTab] = useState('review'); // 'review' | 'reject'

  // New Release Request Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [eligibleFdrs, setEligibleFdrs] = useState([]);
  const [loadingFdrs, setLoadingFdrs] = useState(false);
  const [selectedFdrId, setSelectedFdrId] = useState('');
  const [createRemarks, setCreateRemarks] = useState('');
  const [createError, setCreateError] = useState(null);
  const [creating, setCreating] = useState(false);

  // Fetch release requests from PostgreSQL API
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchReleases({
        status: statusFilter,
        search: searchTerm,
      });
      setReleaseRequests(data);
    } catch (err) {
      console.error('Failed to load release requests from API:', err);
      setError(err.message || 'Unable to connect to Release Requests service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, refreshTrigger]);

  // Open review modal and fetch latest dossier
  const handleOpenReview = async (item) => {
    try {
      setSelectedRequest(item);
      setModalLoading(true);
      setModalError(null);
      setActiveModalTab('review');
      setApprovalRemarks('Council statutory requirements satisfied; full lien release approved.');
      setRejectionRemarks('');
      const fullDossier = await fetchReleaseById(item.id);
      setSelectedRequest(fullDossier);
    } catch (err) {
      console.error('Failed to load release request details:', err);
      setModalError(err.message || 'Error loading release dossier.');
    } finally {
      setModalLoading(false);
    }
  };

  // Execute Approval
  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      setModalError(null);
      const updated = await approveReleaseRequest(id, approvalRemarks);
      setSelectedRequest(updated);
      if (onActionFeedback) {
        onActionFeedback(`Release request #${id} APPROVED. Council NOC issued and FDR marked RELEASED.`);
      }
      loadData();
    } catch (err) {
      console.error('Failed to approve release request:', err);
      setModalError(err.message || 'Failed to approve release request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Rejection
  const handleReject = async (id) => {
    if (!rejectionRemarks.trim()) {
      setModalError('Rejection remarks/reason are required.');
      return;
    }
    try {
      setActionLoading(true);
      setModalError(null);
      const updated = await rejectReleaseRequest(id, rejectionRemarks.trim());
      setSelectedRequest(updated);
      if (onActionFeedback) {
        onActionFeedback(`Release request #${id} REJECTED. Compliance deficiencies recorded.`);
      }
      loadData();
    } catch (err) {
      console.error('Failed to reject release request:', err);
      setModalError(err.message || 'Failed to reject release request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open "Request Release" dialog
  const handleOpenCreateDialog = async () => {
    setIsCreateOpen(true);
    setCreateError(null);
    setSelectedFdrId('');
    setCreateRemarks('Course closure completed; refund of statutory security deposit requested.');
    try {
      setLoadingFdrs(true);
      const list = await fetchFdrs();
      // Filter out FDRs that are already RELEASED or currently have active RELEASE_REQUESTED
      const eligible = list.filter((f) => f.status !== 'RELEASED');
      setEligibleFdrs(eligible);
      if (eligible.length > 0) {
        setSelectedFdrId(eligible[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load eligible FDRs:', err);
      setCreateError('Could not load FDR list.');
    } finally {
      setLoadingFdrs(false);
    }
  };

  // Submit new Release Request
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFdrId) {
      setCreateError('Please select an FDR record.');
      return;
    }
    if (!createRemarks.trim()) {
      setCreateError('Please provide a reason or remarks for release.');
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);
      const created = await createReleaseRequest({
        fdrId: parseInt(selectedFdrId, 10),
        remarks: createRemarks.trim(),
      });

      setIsCreateOpen(false);
      if (onActionFeedback) {
        onActionFeedback(`Release request #${created.id} initiated for FDR ${created.fdrNumber}.`);
      }
      loadData();
    } catch (err) {
      console.error('Failed to create release request:', err);
      setCreateError(err.message || 'Failed to initiate release request.');
    } finally {
      setCreating(false);
    }
  };

  const pendingCount = releaseRequests.filter((r) => r.status === 'Pending Approval').length;

  return (
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight sm:text-2xl flex items-center gap-2">
            <ArrowUpRight className="h-6 w-6 text-purple-700" />
            Security Deposit Release Requests
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Council NOC clearance workflow for encashment or release of statutory fixed deposits upon institutional completion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            title="Refresh from PostgreSQL"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-purple-700' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreateDialog}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-purple-800 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Request Release</span>
          </button>
          <span className="rounded-lg bg-purple-100 text-purple-800 px-3 py-1.5 text-xs font-bold">
            {pendingCount} Pending Bureau Approval
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['All', 'Pending Approval', 'Approved', 'Rejected'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  statusFilter === tab
                    ? 'bg-purple-700 text-white shadow-2xs font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search request #, FDR, bank..."
              className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-1.5 text-xs placeholder-slate-400 focus:border-purple-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-16 text-center shadow-xs">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-purple-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Loading release requests...</h3>
          <p className="text-xs text-slate-500 mt-1">Connecting to PostgreSQL database</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-rose-600 mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Failed to load release requests</h3>
          <p className="text-xs text-rose-700 mt-1">{error}</p>
          <button
            type="button"
            onClick={loadData}
            className="mt-4 rounded-lg bg-rose-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-800"
          >
            Retry Connection
          </button>
        </div>
      ) : releaseRequests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileBadge className="h-10 w-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No release requests match criteria</h3>
          <p className="text-xs text-slate-500 mt-1">No pending release dossiers in this queue window.</p>
          <button
            type="button"
            onClick={handleOpenCreateDialog}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-800"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Initiate Release Request</span>
          </button>
        </div>
      ) : (
        /* Grid of Release cards */
        <div className="grid grid-cols-1 gap-4">
          {releaseRequests.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300"
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
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      Case #{item.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Release Amount</span>
                      <strong className="text-slate-900 text-sm">{item.amount}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank &amp; Branch</span>
                      <span className="font-semibold text-slate-800">{item.bank} • {item.branch}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Request Date</span>
                      <span className="font-medium text-slate-700">{item.requestDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">FDR Status</span>
                      <span className="font-medium text-slate-800">{item.fdrStatus}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-xs text-slate-600 mt-2 space-y-1">
                    <div>
                      <strong className="text-slate-700">Reason for Release: </strong>
                      <span>{item.reason}</span>
                    </div>
                    <div>
                      <strong className="text-slate-700">Council Scrutiny: </strong>
                      <span className="italic text-slate-600">{item.nocStatus}</span>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded text-xs font-bold border ${
                        item.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenReview(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Review Details</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Release Request Review / Approval Modal */}
      {selectedRequest && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="relative w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileBadge className="h-5 w-5 text-purple-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Release Request Case: #{selectedRequest.id} — {selectedRequest.fdrNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg text-xs flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            {modalLoading ? (
              <div className="py-12 text-center text-slate-500">
                <Loader2 className="h-6 w-6 mx-auto animate-spin text-purple-700 mb-2" />
                <p className="text-xs">Fetching release particulars from PostgreSQL...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Institution</span>
                    <p className="font-bold text-slate-900 text-sm">{selectedRequest.institution}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Release Sum</span>
                    <p className="font-bold text-slate-900 text-base">{selectedRequest.amount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank &amp; Branch</span>
                    <p className="font-semibold text-slate-800">{selectedRequest.bank} • {selectedRequest.branch}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">FDR Status</span>
                    <p className="font-semibold text-slate-800">{selectedRequest.fdrStatus}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Issue Date</span>
                    <p className="text-slate-700">{selectedRequest.issueDate || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Maturity Date</span>
                    <p className="text-slate-700">{selectedRequest.maturityDate || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Reason for Refund</span>
                    <p className="text-slate-800 font-medium">{selectedRequest.reason}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Council Determination</span>
                    <p className="text-slate-800">{selectedRequest.nocStatus}</p>
                  </div>
                </div>

                {/* Evidentiary Checklist */}
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1.5">Attached Evidentiary Documents</span>
                  <div className="space-y-1.5">
                    {selectedRequest.documents?.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-white border border-slate-200">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-slate-800">{doc.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{doc.size}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decision Actions for Pending Requests */}
                {selectedRequest.status === 'Pending Approval' && (
                  <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-3.5 space-y-3">
                    {currentUser?.role === 'INSTITUTION_USER' ? (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-850 text-xs">
                        <p className="font-semibold text-amber-900">Regulatory Review in Progress</p>
                        <p className="text-amber-800 text-[11px] mt-0.5">
                          This release request is under review by the AICTE Approving Officer. Institution users cannot approve or reject release requests.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex border-b border-purple-200 pb-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setActiveModalTab('review')}
                            className={`text-xs font-bold transition-colors pb-1 border-b-2 ${
                              activeModalTab === 'review'
                                ? 'border-purple-700 text-purple-900'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            1. Approve Release &amp; Issue NOC
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveModalTab('reject')}
                            className={`text-xs font-bold transition-colors pb-1 border-b-2 ${
                              activeModalTab === 'reject'
                                ? 'border-rose-700 text-rose-900'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            2. Reject Request
                          </button>
                        </div>

                        {activeModalTab === 'review' ? (
                          <div className="space-y-2">
                            <p className="text-purple-800 text-[11px]">
                              Approving will transition FDR {selectedRequest.fdrNumber} to <strong>RELEASED</strong> in PostgreSQL and generate an immutable Council audit record.
                            </p>
                            <input
                              type="text"
                              value={approvalRemarks}
                              onChange={(e) => setApprovalRemarks(e.target.value)}
                              placeholder="Council NOC approval remarks..."
                              className="w-full rounded border border-purple-300 bg-white p-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleApprove(selectedRequest.id)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors disabled:opacity-75"
                            >
                              {actionLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Authorizing Release...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Authorize Release &amp; Mark RELEASED</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-rose-800 text-[11px]">
                              Specify statutory rejection reason. FDR will remain active in the system.
                            </p>
                            <textarea
                              rows={2}
                              value={rejectionRemarks}
                              onChange={(e) => setRejectionRemarks(e.target.value)}
                              placeholder="Specify reasons for rejection (mandatory)..."
                              className="w-full rounded border border-rose-300 bg-white p-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleReject(selectedRequest.id)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-4 py-2 font-semibold text-white shadow-xs hover:bg-rose-800 transition-colors disabled:opacity-75"
                            >
                              {actionLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Recording Rejection...</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4" />
                                  <span>Confirm Rejection</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  if (onViewFdrByNumber) {
                    onViewFdrByNumber(selectedRequest.fdrNumber);
                  }
                }}
                className="text-xs font-semibold text-purple-700 hover:underline"
              >
                Inspect Master FDR Record ({selectedRequest.fdrNumber}) →
              </button>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Initiate New Release Request Modal */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-purple-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Initiate Security Deposit Release Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-lg text-xs flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Select Eligible FDR Deposit
                </label>
                {loadingFdrs ? (
                  <div className="p-2 border rounded text-slate-400">Loading active FDRs...</div>
                ) : (
                  <select
                    value={selectedFdrId}
                    onChange={(e) => setSelectedFdrId(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  >
                    {eligibleFdrs.map((fdr) => (
                      <option key={fdr.id} value={fdr.id}>
                        {fdr.fdrNumber} — {fdr.institution} ({fdr.amount}, Status: {fdr.status})
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Only non-released FDR deposits can be submitted for Council release review.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reason for Security Deposit Release
                </label>
                <textarea
                  rows={3}
                  value={createRemarks}
                  onChange={(e) => setCreateRemarks(e.target.value)}
                  placeholder="e.g. Mandatory 10-year term fulfilled, academic program closure relief, or council resolution..."
                  className="w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !selectedFdrId}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-4 py-2 font-semibold text-white shadow-xs hover:bg-purple-800 transition-colors disabled:opacity-75"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting to Ledger...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Submit Release Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
