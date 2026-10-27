/**
 * Client for Reports endpoints (/api/reports)
 * Uses apiFetch for automatic Bearer token injection
 */
import { apiFetch } from './apiClient';

export async function fetchFdrSummaryReport(params = {}) {
  const query = new URLSearchParams();
  if (params.institutionId && params.institutionId !== 'All') query.set('institutionId', params.institutionId);
  if (params.status && params.status !== 'All') query.set('status', params.status);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await apiFetch(`/api/reports/fdr-summary${qs}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch FDR summary report: ${res.statusText}`);
  }
  const result = await res.json().catch(() => ({}));
  return result.data;
}

export async function fetchMaturityReport(params = {}) {
  const query = new URLSearchParams();
  if (params.timeframe) query.set('timeframe', params.timeframe);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await apiFetch(`/api/reports/maturity${qs}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch maturity report: ${res.statusText}`);
  }
  const result = await res.json().catch(() => ({}));
  return result.data;
}

export async function fetchVerificationReport() {
  const res = await apiFetch('/api/reports/verification');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch verification report: ${res.statusText}`);
  }
  const result = await res.json().catch(() => ({}));
  return result.data;
}

export async function fetchReleaseReport() {
  const res = await apiFetch('/api/reports/releases');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch release report: ${res.statusText}`);
  }
  const result = await res.json().catch(() => ({}));
  return result.data;
}
