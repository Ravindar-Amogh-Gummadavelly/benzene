import React from 'react';
import { UPCOMING_MATURITIES } from '../data/mockData';
import StatusBadge from './StatusBadge';
import { CalendarClock, ExternalLink, ArrowRight } from 'lucide-react';

export default function UpcomingMaturitiesTable({ onAction }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      <div className="flex flex-col gap-2 p-5 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="h-4.5 w-4.5 text-blue-700" />
            Upcoming Maturities (Next 60 Days)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Security deposits requiring mandatory encashment notice or renewal endorsement
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAction && onAction('view_all_maturities', 'Upcoming Maturities')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 self-start sm:self-auto"
        >
          View all schedule <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">FDR Number</th>
              <th className="py-3 px-4">Institution</th>
              <th className="py-3 px-4">Bank & Branch</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Maturity Date</th>
              <th className="py-3 px-4 text-center">Remaining</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {UPCOMING_MATURITIES.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                  <div>{row.fdrNumber}</div>
                  <div className="text-[10px] font-normal text-slate-400">
                    App: {row.applicationId}
                  </div>
                </td>
                <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                  {row.institution}
                </td>
                <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                  <div className="font-medium text-slate-800">{row.bank}</div>
                  <div className="text-[11px] text-slate-400">{row.branch}</div>
                </td>
                <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                  {row.amount}
                </td>
                <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                  {row.maturityDate}
                </td>
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <span
                    className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                      row.daysRemaining <= 30
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {row.daysRemaining} days
                  </span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <StatusBadge status={row.status} />
                </td>
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onAction && onAction('view_fdr', row.fdrNumber)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:text-blue-700 transition-colors shadow-2xs"
                  >
                    <span>View</span>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
