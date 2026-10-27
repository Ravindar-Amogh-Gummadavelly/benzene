/**
 * Frontend API client for Renewals & Maturity Tracking module.
 * Uses apiFetch for automatic Bearer token injection.
 */
import { apiFetch } from './apiClient';

/**
 * Fetch all renewal/maturity tracking records.
 * Supports filters: { status, search, institutionId, urgency }
 */
export async function fetchRenewals(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'All') query.append('status', params.status);
  if (params.search) query.append('search', params.search);
  if (params.institutionId && params.institutionId !== 'All') query.append('institutionId', params.institutionId);
  if (params.urgency && params.urgency !== 'ALL') query.append('urgency', params.urgency);

  const qs = query.toString();
  const url = `/api/renewals${qs ? `?${qs}` : ''}`;

  const res = await apiFetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch renewals (HTTP ${res.status})`);
  }

  const result = await res.json().catch(() => ({}));
  return result.data || [];
}

/**
 * Fetch full dossier for a specific renewal or FDR record.
 */
export async function fetchRenewalById(id) {
  const res = await apiFetch(`/api/renewals/${id}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch renewal details for '${id}' (HTTP ${res.status})`);
  }

  const result = await res.json().catch(() => ({}));
  return result.data;
}

/**
 * Create a new renewal record.
 */
export async function createRenewal(fdrId, data = {}) {
  const res = await apiFetch(`/api/renewals/${fdrId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create renewal (HTTP ${res.status})`);
  }

  const result = await res.json().catch(() => ({}));
  return result.data;
}

/**
 * Mark renewal as completed with new certificate and maturity details.
 */
export async function completeRenewal(renewalId, data = {}) {
  const res = await apiFetch(`/api/renewals/${renewalId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to complete renewal (HTTP ${res.status})`);
  }

  const result = await res.json().catch(() => ({}));
  return result.data;
}

/**
 * Fetch aggregated renewal / maturity stats.
 */
export async function fetchRenewalStats() {
  const res = await apiFetch('/api/renewals/stats');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch renewal stats (HTTP ${res.status})`);
  }

  const result = await res.json().catch(() => ({}));
  return result.data;
}
