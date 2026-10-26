import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  Layers,
  ArrowRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileText,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { fetchAuditLogs } from '../services/auditApi';

const ENTITY_OPTIONS = [
  'All',
  'FdrRecord',
  'Verification',
  'Renewal',
  'ReleaseRequest',
  'Document',
];

const ACTION_OPTIONS = [
  'All',
  'FDR_CREATED',
  'FDR_UPDATED',
  'FDR_DELETED',
  'VERIFICATION_APPROVED',
  'VERIFICATION_DISCREPANCY',
  'VERIFICATION_REJECTED',
  'RENEWAL_COMPLETED',
  'RELEASE_REQUEST_CREATED',
  'RELEASE_REQUEST_APPROVED',
  'RELEASE_REQUEST_REJECTED',
  'DOCUMENT_CREATED',
  'DOCUMENT_UPDATED',
  'DOCUMENT_DELETED',
];

function getActionBadge(action) {
  if (!action) return { label: 'ACTION', bg: 'bg-slate-100', text: 'text-slate-700' };

  if (action.includes('APPROVED') || action.includes('COMPLETED')) {
    return { label: action, bg: 'bg-emerald-100', text: 'text-emerald-800' };
  }
  if (action.includes('REJECTED') || action.includes('DELETED')) {
    return { label: action, bg: 'bg-rose-100', text: 'text-rose-800' };
  }
  if (action.includes('DISCREPANCY')) {
    return { label: action, bg: 'bg-amber-100', text: 'text-amber-800' };
  }
  if (action.includes('CREATED')) {
    return { label: action, bg: 'bg-blue-100', text: 'text-blue-800' };
  }
  return { label: action, bg: 'bg-indigo-100', text: 'text-indigo-800' };
}

export default function AuditLogsPage({ onActionFeedback }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadLogs() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAuditLogs({
          search: search.trim() || undefined,
          entityType: entityType !== 'All' ? entityType : undefined,
          action: actionFilter !== 'All' ? actionFilter : undefined,
        });
        if (isMounted) {
          setLogs(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load audit logs:', err);
          setError(err.message || 'Error loading audit logs from PostgreSQL.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLogs();
    return () => {
      isMounted = false;
    };
  }, [search, entityType, actionFilter, refreshTrigger]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="h-5 w-5 text-blue-700" />
            Immutable Bureau Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time chronological log of regulatory actions, status transitions, and lien records (PostgreSQL Source)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          {/* Search text */}
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search action, details, actor, or entity ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Entity Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
            >
              {ENTITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  Entity: {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="sm:col-span-3">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-hidden"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  Action: {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>
            Showing <strong>{logs.length}</strong> recorded audit events
          </span>
          {(search || entityType !== 'All' || actionFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setEntityType('All');
                setActionFilter('All');
              }}
              className="font-medium text-blue-700 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <Loader2 className="h-7 w-7 mx-auto animate-spin text-blue-600" />
            <p className="text-xs font-medium text-slate-600">Loading audit trail records from database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto text-rose-500" />
            <p className="font-bold text-slate-800 text-sm">Failed to load audit logs</p>
            <p className="text-xs text-rose-600">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <History className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No audit records found</p>
            <p className="text-xs text-slate-500">
              No audit records match the current filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Event ID &amp; Time</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Event Details &amp; Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* ID & Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">#{log.id}</div>
                        <div className="text-[11px] text-slate-400">{log.formattedDate}</div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{log.entityType}</div>
                        {log.entityId && (
                          <div className="text-[10px] font-mono text-slate-400">
                            Ref: #{log.entityId}
                          </div>
                        )}
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700">{log.actorName}</span>
                        </div>
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 text-slate-600 max-w-md">
                        <p className="line-clamp-2">{log.details || 'No details recorded.'}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
