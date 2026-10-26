import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  UploadCloud,
  FileText,
  Loader2,
} from 'lucide-react';
import { fetchAuditLogs } from '../services/auditApi';

function getActivityIcon(action) {
  if (!action) return { icon: History, color: 'text-slate-600', bg: 'bg-slate-100' };

  if (action.includes('APPROVED') || action.includes('COMPLETED')) {
    return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' };
  }
  if (action.includes('REJECTED') || action.includes('DELETED')) {
    return { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100' };
  }
  if (action.includes('DISCREPANCY')) {
    return { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100' };
  }
  if (action.includes('RENEWAL')) {
    return { icon: RefreshCw, color: 'text-sky-600', bg: 'bg-sky-100' };
  }
  if (action.includes('RELEASE')) {
    return { icon: ArrowUpRight, color: 'text-purple-600', bg: 'bg-purple-100' };
  }
  if (action.includes('DOCUMENT')) {
    return { icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-100' };
  }
  return { icon: UploadCloud, color: 'text-blue-600', bg: 'bg-blue-100' };
}

export default function RecentActivity({ onAction, refreshTrigger }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadActivities() {
      try {
        setLoading(true);
        setError(null);
        // Fetch real audit logs
        const data = await fetchAuditLogs();
        if (isMounted) {
          setActivities(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load recent activity:', err);
          setError(err.message || 'Error loading audit activity.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadActivities();
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-blue-700" />
            Recent Activity &amp; Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            System transaction records and regulatory actions (PostgreSQL Source)
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAction && onAction('view_audit_trail', 'Audit Logs')}
          className="text-xs font-semibold text-blue-700 hover:text-blue-900"
        >
          View all logs
        </button>
      </div>

      <div className="mt-4 flow-root">
        {loading ? (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-blue-600" />
            <p className="text-xs font-medium text-slate-600">Loading audit events...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-xs text-rose-600">
            <AlertCircle className="h-5 w-5 mx-auto text-rose-500 mb-1" />
            <span>{error}</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs italic">
            No audit activities logged yet.
          </div>
        ) : (
          <ul className="-mb-4">
            {activities.slice(0, 5).map((activity, idx) => {
              const iconConfig = getActivityIcon(activity.action);
              const IconComponent = iconConfig.icon;
              const isLast = idx === Math.min(activities.length, 5) - 1;

              return (
                <li key={activity.id} className="relative pb-5">
                  {!isLast && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex items-start space-x-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${iconConfig.bg} ${iconConfig.color} ring-4 ring-white`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {activity.action?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {activity.details || `Entity: ${activity.entityType} #${activity.entityId}`}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Actor: {activity.actorName}
                        </p>
                      </div>
                      <div className="text-right whitespace-nowrap text-[10px] text-slate-400">
                        {activity.formattedDate}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
