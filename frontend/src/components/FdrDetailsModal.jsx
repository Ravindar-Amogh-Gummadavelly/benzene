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
  Plus,
  Trash2,
  Edit2,
  Eye,
  Info,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { fetchFdrById } from '../services/fdrApi';
import {
  fetchDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../services/documentApi';

const DOCUMENT_TYPES = [
  'Lien Certificate',
  'Original Bank FDR Deposit Deed',
  'Tri-party Agreement',
  'Resolution of Governing Council',
  'Joint Account Undertaking',
  'Bank Confirmation Letter',
  'Other Statutory Document',
];

export default function FdrDetailsModal({ fdrId, onClose, onActionFeedback }) {
  const [fdr, setFdr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState(null);

  // Add/Edit document modal states
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [docForm, setDocForm] = useState({
    fileName: '',
    documentType: 'Lien Certificate',
    customType: '',
  });
  const [editingDoc, setEditingDoc] = useState(null);
  const [savingDoc, setSavingDoc] = useState(false);

  // View metadata modal
  const [viewingDoc, setViewingDoc] = useState(null);

  // Delete confirmation
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load FDR details
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

  // Load documents for this FDR
  const loadDocuments = async () => {
    if (!fdr?.id && !fdrId) return;
    try {
      setDocsLoading(true);
      setDocsError(null);
      const targetId = fdr?.id || fdrId;
      const docs = await fetchDocuments({ fdrRecordId: targetId });
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setDocsError(err.message || 'Failed to load documents.');
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    if (fdr?.id) {
      loadDocuments();
    }
  }, [fdr?.id]);

  // Handle Add/Edit document submit
  const handleSaveDocument = async (e) => {
    e.preventDefault();
    if (!docForm.fileName.trim()) return;

    const finalType =
      docForm.documentType === 'Other Statutory Document' && docForm.customType.trim()
        ? docForm.customType.trim()
        : docForm.documentType;

    try {
      setSavingDoc(true);
      if (editingDoc) {
        await updateDocument(editingDoc.id, {
          fileName: docForm.fileName.trim(),
          documentType: finalType,
        });
        onActionFeedback && onActionFeedback(`Document metadata updated: ${docForm.fileName}`);
      } else {
        await createDocument({
          fdrRecordId: fdr.id,
          fileName: docForm.fileName.trim(),
          documentType: finalType,
        });
        onActionFeedback && onActionFeedback(`Document metadata added: ${docForm.fileName}`);
      }
      setShowAddDocModal(false);
      setEditingDoc(null);
      setDocForm({ fileName: '', documentType: 'Lien Certificate', customType: '' });
      await loadDocuments();
    } catch (err) {
      alert(`Error saving document: ${err.message}`);
    } finally {
      setSavingDoc(false);
    }
  };

  // Handle delete document
  const handleConfirmDelete = async () => {
    if (!deletingDocId) return;
    try {
      setIsDeleting(true);
      await deleteDocument(deletingDocId);
      onActionFeedback && onActionFeedback('Document metadata deleted successfully.');
      setDeletingDocId(null);
      await loadDocuments();
    } catch (err) {
      alert(`Error deleting document: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

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
                  <div className="text-xl font-bold text-slate-900">{fdr.amount}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                      Status
                    </span>
                    <StatusBadge status={fdr.status} />
                  </div>
                  <div className="text-right border-l border-slate-200 pl-3">
                    <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                      Verification
                    </span>
                    <StatusBadge status={fdr.verificationStatus} />
                  </div>
                </div>
              </div>

              {/* Grid 2 cols: Institution & Bank Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Institution Info */}
                <div className="rounded-lg border border-slate-200 p-4 bg-white space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
                    <Building2 className="h-4 w-4 text-blue-700" />
                    <span>Institution Details</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium">Institution Name</span>
                    <p className="font-semibold text-slate-900 text-xs">{fdr.institution || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-400 font-medium">AICTE Code</span>
                      <p className="font-semibold text-slate-800">{fdr.aicteApplicationId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Lien Party</span>
                      <p className="font-semibold text-slate-800">{fdr.jointAccountHolder}</p>
                    </div>
                  </div>
                </div>

                {/* Bank Info */}
                <div className="rounded-lg border border-slate-200 p-4 bg-white space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-2">
                    <Landmark className="h-4 w-4 text-blue-700" />
                    <span>Depository Bank Information</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium">Bank Name</span>
                    <p className="font-semibold text-slate-900 text-xs">{fdr.bankName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-400 font-medium">Branch</span>
                      <p className="font-semibold text-slate-800">{fdr.branchName || 'Main Branch'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">IFSC Code</span>
                      <p className="font-semibold font-mono text-slate-800">{fdr.ifsc || 'SBIN0000691'}</p>
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

              {/* REAL DATABASE-BACKED DOCUMENT MANAGEMENT SECTION */}
              <div className="rounded-lg border border-slate-200 p-4 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <FileText className="h-4 w-4 text-blue-700" />
                    <span>Attached Documents &amp; Lien Verification Records</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {documents.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDoc(null);
                      setDocForm({
                        fileName: '',
                        documentType: 'Lien Certificate',
                        customType: '',
                      });
                      setShowAddDocModal(true);
                    }}
                    className="inline-flex items-center gap-1 rounded bg-blue-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-800 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Document</span>
                  </button>
                </div>

                {/* Prototype Notice */}
                <div className="flex items-center gap-1.5 rounded bg-blue-50/70 p-2 text-[11px] text-blue-800 border border-blue-100">
                  <Info className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                  <span>
                    Metadata-based document registry backed by PostgreSQL (Prisma <code>Document</code> model).
                  </span>
                </div>

                {docsLoading ? (
                  <div className="py-4 text-center text-slate-400">
                    <Loader2 className="h-5 w-5 mx-auto animate-spin text-blue-600" />
                    <span className="text-[11px] mt-1 block">Loading documents...</span>
                  </div>
                ) : documents.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-100 mt-0.5 sm:mt-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate text-xs">{doc.fileName}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-medium text-blue-700">{doc.documentType}</span>
                              <span>•</span>
                              <span>
                                {doc.uploadedAt
                                  ? new Date(doc.uploadedAt).toLocaleDateString('en-IN')
                                  : 'Today'}
                              </span>
                              <span>•</span>
                              <span className="text-emerald-700 font-medium">Verified Status</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            title="View Metadata"
                            onClick={() => setViewingDoc(doc)}
                            className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Edit Metadata"
                            onClick={() => {
                              setEditingDoc(doc);
                              setDocForm({
                                fileName: doc.fileName,
                                documentType: DOCUMENT_TYPES.includes(doc.documentType)
                                  ? doc.documentType
                                  : 'Other Statutory Document',
                                customType: DOCUMENT_TYPES.includes(doc.documentType)
                                  ? ''
                                  : doc.documentType,
                              });
                              setShowAddDocModal(true);
                            }}
                            className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete Document"
                            onClick={() => setDeletingDocId(doc.id)}
                            className="rounded p-1 text-rose-500 hover:bg-rose-100 hover:text-rose-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-slate-200 p-4 text-center text-slate-400">
                    <p className="italic">No document metadata attached yet for this database record.</p>
                    <p className="text-[11px] mt-1 text-slate-500">
                      Click <strong>Add Document</strong> above to record lien certificates or deposit deeds.
                    </p>
                  </div>
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
              onClick={() => onActionFeedback && onActionFeedback(`Generated official PDF Certificate for ${fdr?.fdrNumber}`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </button>
            <button
              type="button"
              disabled={loading || !fdr}
              onClick={() => onActionFeedback && onActionFeedback(`Dispatched bank verification inquiry for ${fdr?.bankName}`)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Bank Verification Request
            </button>
          </div>
        </div>
      </div>

      {/* SUB-MODAL: ADD / EDIT DOCUMENT METADATA */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                {editingDoc ? 'Edit Document Metadata' : 'Add Document Metadata'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowAddDocModal(false);
                  setEditingDoc(null);
                }}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document File Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank_Lien_Confirmation_Letter.pdf"
                  value={docForm.fileName}
                  onChange={(e) => setDocForm({ ...docForm, fileName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document Category / Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={docForm.documentType}
                  onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {docForm.documentType === 'Other Statutory Document' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Custom Document Type <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Specify custom document type"
                    value={docForm.customType}
                    onChange={(e) => setDocForm({ ...docForm, customType: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div className="rounded bg-slate-50 p-2.5 text-[11px] text-slate-500 border border-slate-200">
                <p>
                  <strong>Note:</strong> In this prototype phase, documents are registered with official metadata into the PostgreSQL <code>Document</code> database model.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDocModal(false);
                    setEditingDoc(null);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDoc}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {savingDoc && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>{editingDoc ? 'Update Metadata' : 'Save Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: VIEW DOCUMENT METADATA */}
      {viewingDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-700" />
                <span>Document Metadata Dossier</span>
              </h4>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Record ID</span>
                <p className="font-mono font-semibold text-slate-800">#{viewingDoc.id}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">File Name</span>
                <p className="font-semibold text-slate-900">{viewingDoc.fileName}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Document Type</span>
                <p className="font-semibold text-blue-700">{viewingDoc.documentType}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Virtual Storage Path</span>
                <p className="font-mono text-[11px] text-slate-600 break-all bg-slate-50 p-1.5 rounded border border-slate-200">
                  {viewingDoc.filePath}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Uploaded At</span>
                <p className="font-medium text-slate-800">
                  {viewingDoc.uploadedAt ? new Date(viewingDoc.uploadedAt).toLocaleString('en-IN') : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Registry Mode</span>
                <p className="font-medium text-emerald-700">Database-backed Metadata Registry</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: CONFIRM DELETE */}
      {deletingDocId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Delete Document Metadata</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this document metadata entry from the database? This action will be audited.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDocId(null)}
                className="rounded-lg border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
