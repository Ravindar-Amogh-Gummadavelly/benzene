import React, { useState } from 'react';
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
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function ReleaseRequestsPage({
  releaseRequests,
  onUpdateReleaseStatus,
  onActionFeedback,
  onViewFdrByNumber,
}) {
  const [selectedRequest, setSelectedRequest] = useState(null);

  const handleApprove = (id) => {
    onUpdateReleaseStatus(id, 'Approved');
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest((prev) => ({ ...prev, status: 'Approved' }));
    }
    onActionFeedback('Release request APPROVED. Formal NOC issued and lien release letter generated.');
  };

  const handleReject = (id) => {
    onUpdateReleaseStatus(id, 'Rejected');
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest((prev) => ({ ...prev, status: 'Rejected' }));
    }
    onActionFeedback('Release request REJECTED. Compliance deficiencies notified to institution.');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight sm:text-2xl flex items-center gap-2">
            <ArrowUpRight className="h-6 w-6 text-purple-700" />
            Security Deposit Release Requests
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review and grant Council NOC for encashment or release of security deposits upon course/institution closure.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-purple-100 text-purple-800 px-3 py-1.5 text-xs font-bold">
            {releaseRequests.filter((r) => r.status === 'Pending Approval').length} Pending Bureau Approval
          </span>
        </div>
      </div>

      {/* Grid of Release cards */}
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
                    Req ID: {item.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Release Amount</span>
                    <strong className="text-slate-900 text-sm">{item.amount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank &amp; Branch</span>
                    <span className="font-semibold text-slate-800">{item.bank}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Request Date</span>
                    <span className="font-medium text-slate-700">{item.requestDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Applicant</span>
                    <span className="font-medium text-slate-700 truncate block">{item.applicantName}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-xs text-slate-600 mt-2 space-y-1">
                  <div>
                    <strong className="text-slate-700">Reason for Release: </strong>
                    <span>{item.reason}</span>
                  </div>
                  <div>
                    <strong className="text-slate-700">Bureau Scrutiny: </strong>
                    <span className="italic text-slate-500">{item.nocStatus}</span>
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
                    onClick={() => setSelectedRequest(item)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Review Details</span>
                  </button>

                  {item.status === 'Pending Approval' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 shadow-2xs transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800 shadow-2xs transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Release Request Detail Modal */}
      {selectedRequest && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileBadge className="h-5 w-5 text-purple-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Release Request Case: {selectedRequest.id}
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

            <div className="space-y-3 text-xs text-slate-600">
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

              <div className="bg-slate-50 p-3 rounded border border-slate-100 space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Reason for Refund</span>
                  <p className="text-slate-800 font-medium">{selectedRequest.reason}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Legal / Regional Scrutiny</span>
                  <p className="text-slate-800">{selectedRequest.nocStatus}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Attached Evidentiary Documents</span>
                <div className="space-y-1.5">
                  {selectedRequest.documents?.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-slate-800">{doc.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{doc.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  onViewFdrByNumber(selectedRequest.fdrNumber);
                }}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Inspect Original Deposit ({selectedRequest.fdrNumber}) →
              </button>

              <div className="flex items-center gap-2">
                {selectedRequest.status === 'Pending Approval' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedRequest.id)}
                      className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedRequest.id)}
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                    >
                      Approve Release
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
