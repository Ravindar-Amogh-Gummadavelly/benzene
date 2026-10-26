import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  FileSpreadsheet,
  Download,
  Building2,
  Calendar,
  Landmark,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { fetchFdrs } from '../services/fdrApi';

export default function FdrManagementPage({
  onViewFdr,
  onAddNewFdr,
  initialFilter = 'All',
  refreshTrigger = 0,
}) {
  const [fdrList, setFdrList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(initialFilter);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Available statuses in database
  const statusOptions = [
    { label: 'All Statuses', value: 'All' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Under Verification', value: 'UNDER_VERIFICATION' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Expiring Soon', value: 'EXPIRING_SOON' },
    { label: 'Discrepancy', value: 'DISCREPANCY' },
    { label: 'Release Requested', value: 'RELEASE_REQUESTED' },
    { label: 'Released', value: 'RELEASED' },
    { label: 'Expired', value: 'EXPIRED' },
  ];

  // Derive institutions from loaded records for the dropdown filter
  const [institutionsList, setInstitutionsList] = useState([]);

  // Fetch FDRs from real backend API
  const loadFdrs = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchFdrs({
        status: selectedStatus,
        institutionId: selectedInstitutionId,
        search: searchTerm,
      });

      setFdrList(data);

      // Collect unique institutions if empty or update them
      if (institutionsList.length === 0 && data.length > 0) {
        const unique = [];
        const seen = new Set();
        data.forEach((item) => {
          if (item.institutionId && !seen.has(item.institutionId)) {
            seen.add(item.institutionId);
            unique.push({ id: item.institutionId, name: item.institution });
          }
        });
        setInstitutionsList(unique);
      }
    } catch (err) {
      console.error('Failed to load FDRs from API:', err);
      setError(err.message || 'Unable to connect to backend FDR API service.');
    } finally {
      setLoading(false);
    }
  };

  // Sync initialFilter prop if it changes
  useEffect(() => {
    if (initialFilter) {
      setSelectedStatus(initialFilter);
    }
  }, [initialFilter]);

  // Load whenever search, status, institutionId or refreshTrigger changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadFdrs();
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedStatus, selectedInstitutionId, refreshTrigger]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight sm:text-2xl flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-blue-700" />
            FDR Management Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Search, inspect, and manage institutional Fixed Deposit Receipts loaded directly from the PostgreSQL Bureau ledger.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadFdrs}
            title="Refresh from PostgreSQL"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-700' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            type="button"
            onClick={onAddNewFdr}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Add New FDR
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by FDR Number, Institution, Bank, or Branch..."
              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            >
              {statusOptions.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Institution Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedInstitutionId}
              onChange={(e) => setSelectedInstitutionId(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 truncate focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All Institutions</option>
              {institutionsList.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter stats pill */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
          <span>
            {loading ? (
              <span className="inline-flex items-center gap-1.5 text-blue-700 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Querying PostgreSQL database...
              </span>
            ) : (
              <span>
                Found <strong className="text-slate-900">{fdrList.length}</strong> database record
                {fdrList.length === 1 ? '' : 's'}
              </span>
            )}
          </span>
          {(searchTerm || selectedStatus !== 'All' || selectedInstitutionId !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('All');
                setSelectedInstitutionId('All');
              }}
              className="text-blue-700 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">Failed to connect to real FDR API</p>
              <p className="mt-0.5 text-[11px]">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadFdrs}
            className="rounded bg-rose-700 px-3 py-1 font-semibold text-white hover:bg-rose-800 transition-colors shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Records Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">FDR Number</th>
                <th className="py-3 px-4">Institution Name</th>
                <th className="py-3 px-4">Bank &amp; Branch</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Maturity Date</th>
                <th className="py-3 px-4 text-center">Remaining</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && fdrList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-7 w-7 mx-auto animate-spin text-blue-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Loading FDR records from database...</p>
                  </td>
                </tr>
              ) : fdrList.length > 0 ? (
                fdrList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <div>{item.fdrNumber}</div>
                      <div className="text-[10px] font-normal text-slate-400">
                        App: {item.aicteApplicationId || 'AICTE-REG'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 max-w-xs truncate">
                      {item.institution}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{item.bank || item.bankName}</div>
                      <div className="text-[11px] text-slate-400">{item.branch || item.branchName || 'Main Branch'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      {item.amount}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <div>{item.maturityDate || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">Issued: {item.issueDate || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                          item.daysRemaining !== null && item.daysRemaining <= 30 && item.daysRemaining > 0
                            ? 'bg-amber-100 text-amber-900'
                            : item.daysRemaining !== null && item.daysRemaining < 0
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {item.daysRemaining === null
                          ? 'Active'
                          : item.daysRemaining < 0
                          ? 'Matured'
                          : `${item.daysRemaining} days`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewFdr(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No FDR records found in the database.</p>
                    <p className="text-xs mt-1 text-slate-500">
                      Use the &quot;Add New FDR&quot; button above to create the first record in PostgreSQL.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
