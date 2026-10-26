/**
 * Client for Reports endpoints (/api/reports)
 */

export async function fetchFdrSummaryReport(params = {}) {
  const query = new URLSearchParams();
  if (params.institutionId && params.institutionId !== 'All') query.set('institutionId', params.institutionId);
  if (params.status && params.status !== 'All') query.set('status', params.status);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`/api/reports/fdr-summary${qs}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch FDR summary report: ${res.statusText}`);
  }
  const result = await res.json();
  return result.data;
}

export async function fetchMaturityReport(params = {}) {
  const query = new URLSearchParams();
  if (params.timeframe) query.set('timeframe', params.timeframe);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`/api/reports/maturity${qs}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch maturity report: ${res.statusText}`);
  }
  const result = await res.json();
  return result.data;
}

export async function fetchVerificationReport() {
  const res = await fetch('/api/reports/verification');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch verification report: ${res.statusText}`);
  }
  const result = await res.json();
  return result.data;
}

export async function fetchReleaseReport() {
  const res = await fetch('/api/reports/releases');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch release report: ${res.statusText}`);
  }
  const result = await res.json();
  return result.data;
}
