import React, { useState } from 'react';
import {
  X,
  FileCheck,
  PlusCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { createFdr } from '../services/fdrApi';

export default function NewFdrModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fdrNumber: `FDR/AICTE/2026/${Math.floor(1000 + Math.random() * 9000)}`,
    applicationId: 'AICTE-NRC-104928',
    institution: 'Delhi Technological Institute',
    bank: 'State Bank of India',
    branch: 'Connaught Place, New Delhi',
    amount: '3500000',
    tenure: '5 Years',
    issueDate: new Date().toISOString().split('T')[0],
    maturityDate: '2031-10-26',
    status: 'ACTIVE',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorList, setErrorList] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorList([]);

    if (!formData.institution.trim() || !formData.branch.trim()) {
      setErrorMessage('Please fill all mandatory fields (Institution and Branch).');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        fdrNumber: formData.fdrNumber.trim(),
        aicteApplicationId: formData.applicationId.trim(),
        institution: formData.institution.trim(),
        bank: formData.bank.trim(),
        branch: formData.branch.trim(),
        amount: formData.amount,
        issueDate: formData.issueDate,
        maturityDate: formData.maturityDate,
        status: formData.status,
      };

      const created = await createFdr(payload);
      onSuccess(created);
    } catch (err) {
      console.error('Failed to create FDR in database:', err);
      setErrorMessage(err.message || 'Server error occurred while creating FDR.');
      if (err.errors && Array.isArray(err.errors)) {
        setErrorList(err.errors);
      }
    } finally {
      setLoading(false);
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
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Add New Fixed Deposit Receipt (FDR)
              </h3>
              <p className="text-xs text-slate-300">
                Register a new institutional security deposit directly into the PostgreSQL database
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Validation Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 p-4 text-xs text-rose-800 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {errorList.length > 0 && (
              <ul className="list-disc pl-6 space-y-0.5 text-[11px] text-rose-700">
                {errorList.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                FDR Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="fdrNumber"
                value={formData.fdrNumber}
                onChange={handleChange}
                required
                className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                AICTE Application ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="applicationId"
                value={formData.applicationId}
                onChange={handleChange}
                required
                className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-800 mb-1">
                Institution Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="institution"
                placeholder="e.g. Delhi Technological Institute"
                value={formData.institution}
                onChange={handleChange}
                required
                className="w-full rounded border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Bank Name <span className="text-rose-500">*</span>
              </label>
              <select
                name="bank"
                value={formData.bank}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              >
                <option value="State Bank of India">State Bank of India</option>
                <option value="Punjab National Bank">Punjab National Bank</option>
                <option value="Bank of Baroda">Bank of Baroda</option>
                <option value="Canara Bank">Canara Bank</option>
                <option value="Union Bank of India">Union Bank of India</option>
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Bank of India">Bank of India</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Branch &amp; City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="branch"
                placeholder="e.g. Connaught Place, New Delhi"
                value={formData.branch}
                onChange={handleChange}
                required
                className="w-full rounded border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Deposit Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="amount"
                placeholder="e.g. 3500000"
                value={formData.amount}
                onChange={handleChange}
                required
                className="w-full rounded border border-slate-300 px-3 py-2 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="UNDER_VERIFICATION">UNDER_VERIFICATION</option>
                <option value="APPROVED">APPROVED</option>
                <option value="DISCREPANCY">DISCREPANCY</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Issue Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                required
                className="w-full rounded border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Maturity Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="maturityDate"
                value={formData.maturityDate}
                onChange={handleChange}
                required
                className="w-full rounded border border-slate-300 px-3 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-[11px] text-blue-800 flex items-center gap-2">
            <FileCheck className="h-4 w-4 shrink-0 text-blue-700" />
            <span>This form dispatches a real <code>POST /api/fdr</code> request to the Node.js + Express backend and saves to PostgreSQL.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors disabled:opacity-75"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving to PostgreSQL...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  <span>Save &amp; Submit FDR</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
