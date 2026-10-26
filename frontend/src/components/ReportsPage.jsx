import React, { useState, useEffect } from 'react';
import {
  FileBarChart2,
  Calendar,
  Building2,
  Landmark,
  ShieldAlert,
  ArrowUpRight,
  Download,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  Layers,
  FileCheck,
} from 'lucide-react';
import {
  fetchFdrSummaryReport,
  fetchMaturityReport,
  fetchVerificationReport,
  fetchReleaseReport,
} from '../services/reportApi';

// Helper function to export structured report data to CSV
function exportToCsv(filename, rows) {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function ReportsPage({ onActionFeedback }) {
  const [activeTab, setActiveTab] = useState('fdr-summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Tab definitions
  const tabs = [
    { id: 'fdr-summary', label: 'FDR Deposit Summary', icon: Layers },
    { id: 'maturity', label: 'Maturity & Expiry Schedule', icon: Calendar },
    { id: 'verification', label: 'Verification Audit Compliance', icon: FileCheck },
    { id: 'releases', label: 'Release & Refund Ledger', icon: ArrowUpRight },
  ];

  useEffect(() => {
    let isMounted = true;
    async function loadReport() {
      try {
        setLoading(true);
        setError(null);
        let data = null;

        if (activeTab === 'fdr-summary') {
          data = await fetchFdrSummaryReport();
        } else if (activeTab === 'maturity') {
          data = await fetchMaturityReport();
        } else if (activeTab === 'verification') {
          data = await fetchVerificationReport();
        } else if (activeTab === 'releases') {
          data = await fetchReleaseReport();
        }

        if (isMounted) {
          setReportData(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load report:', err);
          setError(err.message || 'Error loading report from API.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReport();
    return () => {
      isMounted = false;
    };
  }, [activeTab, refreshTrigger]);

  const handleExport = () => {
    if (!reportData?.records?.length) return;
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`aicte_${activeTab}_report_${dateStr}.csv`, reportData.records);
    onActionFeedback && onActionFeedback(`Exported CSV for ${activeTab} report`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileBarChart2 className="h-5 w-5 text-blue-700" />
            AICTE Statutory Reports &amp; Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated institutional compliance metrics, exposure summaries, and reconciliation ledgers (PostgreSQL Source)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || !reportData?.records?.length}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-blue-700 text-blue-800 bg-blue-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-2">
          <Loader2 className="h-7 w-7 mx-auto animate-spin text-blue-600" />
          <p className="text-xs font-medium text-slate-600">Generating report from database records...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center space-y-2 rounded-xl border border-rose-200 bg-rose-50">
          <AlertCircle className="h-8 w-8 mx-auto text-rose-500" />
          <p className="font-bold text-slate-800 text-sm">Failed to generate report</p>
          <p className="text-xs text-rose-600">{error}</p>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Summary KPI Cards for the active report */}
          {activeTab === 'fdr-summary' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Total Deposits</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{reportData.summary.totalRecords} Records</div>
                  <span className="text-[11px] text-blue-700 font-medium">Recorded in Bureau</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Total Secured Amount</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1">{reportData.summary.totalSecuredAmountFormatted}</div>
                  <span className="text-[11px] text-slate-500">Statutory Lien Value</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Banks Covered</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{reportData.summary.banksCovered} Banks</div>
                  <span className="text-[11px] text-slate-500">Commercial / Public Sector</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Ledger Status</span>
                  <div className="text-xl font-bold text-blue-700 mt-1">Reconciled</div>
                  <span className="text-[11px] text-slate-500">Generated: {new Date(reportData.generatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Bank Breakdown Table */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-blue-700" />
                  <span>Depository Bank Exposure Breakdown</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {reportData.bankBreakdown.map((bank) => (
                    <div key={bank.bank} className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-1">
                      <p className="font-semibold text-slate-800 text-xs truncate">{bank.bank}</p>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-500">{bank.count} FDRs</span>
                        <span className="font-bold text-slate-900">{bank.totalAmountFormatted}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Records Table */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Detailed Institutional Deposit Records</h3>
                  <span className="text-xs text-slate-500">{reportData.records.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">FDR Number</th>
                        <th className="py-3 px-4">Institution</th>
                        <th className="py-3 px-4">Bank &amp; Branch</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4">Issue Date</th>
                        <th className="py-3 px-4">Maturity Date</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.fdrNumber}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{r.institution}</td>
                          <td className="py-3 px-4 text-slate-600">{r.bankName} ({r.branchName})</td>
                          <td className="py-3 px-4 font-bold text-slate-900 text-right">{r.amountFormatted}</td>
                          <td className="py-3 px-4 text-slate-600">{r.issueDate}</td>
                          <td className="py-3 px-4 text-slate-600">{r.maturityDate}</td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'maturity' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Total Tracked</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{reportData.summary.totalTracked} Deposits</div>
                  <span className="text-[11px] text-slate-500">Non-released deposits</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Overdue / Matured</span>
                  <div className="text-xl font-bold text-rose-600 mt-1">{reportData.summary.overdueCount} Records</div>
                  <span className="text-[11px] text-rose-700 font-medium">Requires immediate encashment notice</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Approaching (60 Days)</span>
                  <div className="text-xl font-bold text-amber-600 mt-1">{reportData.summary.upcomingCount} Records</div>
                  <span className="text-[11px] text-amber-700 font-medium">Renewal processing window</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Secured Amount at Risk</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{reportData.summary.totalAmountAtRiskFormatted}</div>
                  <span className="text-[11px] text-slate-500">Matured / Critical value</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Maturity &amp; Expiry Risk Schedule</h3>
                  <span className="text-xs text-slate-500">{reportData.records.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">FDR Number</th>
                        <th className="py-3 px-4">Institution</th>
                        <th className="py-3 px-4">Bank</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4">Maturity Date</th>
                        <th className="py-3 px-4 text-center">Days Remaining</th>
                        <th className="py-3 px-4">Urgency Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.fdrNumber}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{r.institution}</td>
                          <td className="py-3 px-4 text-slate-600">{r.bankName}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 text-right">{r.amountFormatted}</td>
                          <td className="py-3 px-4 text-slate-600">{r.maturityDate}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`font-bold ${
                                r.daysRemaining < 0
                                  ? 'text-rose-600'
                                  : r.daysRemaining <= 30
                                  ? 'text-amber-600'
                                  : 'text-slate-700'
                              }`}
                            >
                              {r.daysRemaining < 0 ? `${Math.abs(r.daysRemaining)}d overdue` : `${r.daysRemaining} days`}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.urgency === 'OVERDUE'
                                  ? 'bg-rose-100 text-rose-800'
                                  : r.urgency === 'CRITICAL'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {r.urgency}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'verification' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Total Audit Cases</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{reportData.summary.totalVerifications} Submissions</div>
                  <span className="text-[11px] text-slate-500">Statutory queue</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Verified &amp; Approved</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1">{reportData.summary.verifiedCount} Cases</div>
                  <span className="text-[11px] text-emerald-800 font-medium">Compliance Rate: {reportData.summary.complianceRate}%</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Discrepancies Flagged</span>
                  <div className="text-xl font-bold text-amber-600 mt-1">{reportData.summary.discrepancyCount} Cases</div>
                  <span className="text-[11px] text-amber-700 font-medium">Notices Issued to Institutions</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Pending Review</span>
                  <div className="text-xl font-bold text-blue-700 mt-1">{reportData.summary.pendingCount} Cases</div>
                  <span className="text-[11px] text-slate-500">Awaiting Officer Action</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Verification Ledger &amp; Officer Audit Findings</h3>
                  <span className="text-xs text-slate-500">{reportData.records.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Verification ID</th>
                        <th className="py-3 px-4">FDR Number</th>
                        <th className="py-3 px-4">Institution</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Auditing Officer</th>
                        <th className="py-3 px-4">Officer Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">#{r.id}</td>
                          <td className="py-3 px-4 font-mono text-slate-800">{r.fdrNumber}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{r.institution}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 text-right">{r.amountFormatted}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.verificationStatus === 'VERIFIED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.verificationStatus === 'DISCREPANCY'
                                  ? 'bg-amber-100 text-amber-800'
                                  : r.verificationStatus === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {r.verificationStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{r.verifierName}</td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{r.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'releases' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Total Requests</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{reportData.summary.totalRequests} Requests</div>
                  <span className="text-[11px] text-slate-500">Statutory Release Ledger</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Approved &amp; Released</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1">{reportData.summary.approvedCount} Releases</div>
                  <span className="text-[11px] text-emerald-800 font-medium">Lien Revoked</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Pending Review</span>
                  <div className="text-xl font-bold text-blue-700 mt-1">{reportData.summary.pendingCount} Requests</div>
                  <span className="text-[11px] text-slate-500">Under Bureau Scrutiny</span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase text-slate-400">Total Refunded Value</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">{reportData.summary.totalRefundedAmountFormatted}</div>
                  <span className="text-[11px] text-slate-500">Funds Discharged</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Release &amp; Refund Request Log</h3>
                  <span className="text-xs text-slate-500">{reportData.records.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Request ID</th>
                        <th className="py-3 px-4">FDR Number</th>
                        <th className="py-3 px-4">Institution</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4">Request Date</th>
                        <th className="py-3 px-4">Approved Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">#{r.id}</td>
                          <td className="py-3 px-4 font-mono text-slate-800">{r.fdrNumber}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{r.institution}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 text-right">{r.amountFormatted}</td>
                          <td className="py-3 px-4 text-slate-600">{r.requestedAt}</td>
                          <td className="py-3 px-4 text-slate-600">{r.approvedAt || '—'}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.status === 'Rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{r.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
