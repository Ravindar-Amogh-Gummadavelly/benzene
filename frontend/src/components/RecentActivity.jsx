import React from 'react';
import { RECENT_ACTIVITIES } from '../data/mockData';
import {
  History,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  UploadCloud,
} from 'lucide-react';

const activityIconMap = {
  fdr_verified: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  discrepancy_raised: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
  renewal_submitted: { icon: RefreshCw, color: 'text-sky-600', bg: 'bg-sky-100' },
  release_request: { icon: ArrowUpRight, color: 'text-purple-600', bg: 'bg-purple-100' },
  fdr_submitted: { icon: UploadCloud, color: 'text-blue-600', bg: 'bg-blue-100' },
};

export default function RecentActivity({ onAction }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-blue-700" />
            Recent Activity &amp; Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            System transaction records and regulatory actions
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
        <ul className="-mb-4">
          {RECENT_ACTIVITIES.map((activity, idx) => {
            const iconConfig = activityIconMap[activity.type] || activityIconMap.fdr_submitted;
            const IconComponent = iconConfig.icon;
            const isLast = idx === RECENT_ACTIVITIES.length - 1;

            return (
              <li key={activity.id} className="relative pb-5">
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${iconConfig.bg} ${iconConfig.color} ring-4 ring-white`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900">
                        {activity.title}
                      </p>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {activity.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {activity.description}
                    </p>
                    <div className="mt-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${activity.badgeColor}`}>
                        {activity.badge}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
