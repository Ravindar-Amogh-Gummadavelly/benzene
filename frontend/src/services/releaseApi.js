/**
 * Frontend API client for Security Deposit Release Requests & NOC module.
 * Uses apiFetch for automatic Bearer token injection.
 */
import { apiFetch } from './apiClient';

/**
 * Fetch all release requests.
 * Supports filters: { status, search, institutionId, fdrNumber }
 */
export async function fetchReleases(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'All') query.append('status', params.status);
  if (params.search) query.append('search', params.search);
  if (params.institutionId && params.institutionId !== 'All') query.append('institutionId', params.institutionId);
  if (params.fdrNumber) query.append('fdrNumber', params.fdrNumber);

  const qs = query.toString();
  const url = `/api/releases${qs ? `?${qs}` : ''}`;

  const res = await apiFetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch release requests (HTTP ${res.status})`);
  }

  const result = await res.json().catch(() => ({}));
  return result.data || [];
}

/**
 * Fetch a specific release request by ID.
 */
export async function fetchReleaseById(id) {
  const res = await apiFetch(`/api/releases/${id}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch release request #${id} (HTTP ${res.status})`);
  }

  const result = await res.json().catch(() => ({}));
  return result.data;
}

/**
 * Create a new release request for an FDR.
 * body: { fdrId, fdrNumber, remarks }
 */
export async function createReleaseRequest(data = {}) {
  const res = await apiFetch('/api/releases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create release request (HTTP ${res.status})`);
  }

  const result = await res.json().catch(() => ({}));
  return result.data;
}

/**
 * Approve a release request.
 * body: { approvedAmount, remarks, generateNoc, nocReferenceNumber, conditions }
 */
export async function approveReleaseRequest(id, data = {}) {
  const res = await apiFetch(`/api/releases/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to approve release request #${id} (HTTP ${res.status})`);
  }

  const result = await res.json().catch(() => ({}));
  return result.data;
}

/**
 * Reject a release request.
 * body: { rejectionReason, remarks }
 */
export async function rejectReleaseRequest(id, data = {}) {
  const res = await apiFetch(`/api/releases/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to reject release request #${id} (HTTP ${res.status})`);
  }

  const result = await res.json().catch(() => ({}));
  return result.data;
}

/**
 * Fetch aggregated release request statistics.
 */
export async function fetchReleaseStats() {
  const res = await apiFetch('/api/releases/stats');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch release stats (HTTP ${res.status})`);
  }

  const result = await res.json().catch(() => ({}));
  return result.data;
}
