import React, { useState, useEffect } from 'react';
import { PieChart, Info, Loader2, AlertCircle } from 'lucide-react';
import { fetchDashboardStats } from '../services/dashboardApi';

export default function StatusOverview({ onSelectFilter, refreshTrigger }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchDashboardStats();
        if (isMounted) {
          setStats(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load status distribution:', err);
          setError(err.message || 'Error fetching status overview.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs flex items-center justify-center gap-2 text-xs text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span>Loading real portfolio status overview from PostgreSQL...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-xs text-xs text-rose-700 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Failed to load status overview: {error}</span>
      </div>
    );
  }

  const distribution = stats.statusDistribution || [];
  const totalFDRs = stats.totalFdrs || 0;

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
          {distribution.map((item) => (
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
        {distribution.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelectFilter && onSelectFilter(item.statusKey || item.label)}
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
