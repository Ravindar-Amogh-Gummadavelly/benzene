import React from 'react';

const statusStyles = {
  'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20',
  'Under Verification': 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-600/20',
  'Under Bureau Review': 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-600/20',
  'Expiring Soon': 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/20',
  'Expired': 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20',
  'Discrepancy': 'bg-red-50 text-red-700 border-red-200 ring-red-600/20',
  'Released': 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-600/20',
  'Pending Verification': 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20',
  'Bank Confirmation Pending': 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-600/20',
  'Verified': 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20',
  'Approved': 'bg-teal-50 text-teal-700 border-teal-200 ring-teal-600/20',
  'Rejected': 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20',
  'Renewed': 'bg-teal-50 text-teal-700 border-teal-200 ring-teal-600/20',
  'Approaching Maturity': 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/20',
  'Overdue for Renewal': 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20',
  'Pending Renewal Notice': 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20',
  'Active Term': 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20',
};

export default function StatusBadge({ status, className = '' }) {
  const currentStyle = statusStyles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${currentStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
