import React from 'react';
import { STATUS_DISTRIBUTION } from '../data/mockData';
import { PieChart, Info } from 'lucide-react';

export default function StatusOverview({ onSelectFilter }) {
  const totalFDRs = STATUS_DISTRIBUTION.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-blue-700" />
            FDR Status Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Portfolio distribution across {totalFDRs.toLocaleString('en-IN')} registered institutional deposits
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
          <Info className="h-3.5 w-3.5" />
          <span>Real-time Bureau Ledger</span>
        </div>
      </div>

      {/* Segmented Visual Stacked Bar Chart */}
      <div className="mt-5">
        <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
          {STATUS_DISTRIBUTION.map((item) => (
            <div
              key={item.label}
              style={{ width: `${item.percentage}%` }}
              className={`${item.color} transition-all duration-300 hover:opacity-85`}
              title={`${item.label}: ${item.count} (${item.percentage}%)`}
            />
          ))}
        </div>
      </div>

      {/* Grid Summary Breakdown */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STATUS_DISTRIBUTION.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelectFilter && onSelectFilter(item.label)}
            className={`flex flex-col justify-between rounded-lg border border-slate-200/80 p-3 text-left transition-all hover:border-slate-300 hover:shadow-xs ${item.bgLight}`}
          >
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
              <span className="text-xs font-semibold text-slate-700 truncate">
                {item.label}
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-lg font-bold text-slate-900">
                {item.count.toLocaleString('en-IN')}
              </span>
              <span className={`text-xs font-medium ${item.textColor}`}>
                {item.percentage}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
