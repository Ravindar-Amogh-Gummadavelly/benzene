/**
 * Verification API client for interacting with the backend Verification endpoints
 * Uses apiFetch for automatic Bearer token injection
 */
import { apiFetch } from './apiClient';

export async function fetchVerifications({ status, search, institutionId } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'All') {
    params.append('status', status);
  }
  if (institutionId && institutionId !== 'All') {
    params.append('institutionId', institutionId);
  }
  if (search && search.trim()) {
    params.append('search', search.trim());
  }

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await apiFetch(`/api/verifications${queryStr}`);
  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Failed to fetch verification queue from server.');
  }

  return json.data || [];
}

export async function fetchVerificationById(id) {
  const res = await apiFetch(`/api/verifications/${encodeURIComponent(id)}`);
  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || `Failed to fetch verification details for ID '${id}'.`);
  }

  return json.data;
}

export async function approveVerification(id, remarks = '') {
  const res = await apiFetch(`/api/verifications/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ remarks }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Failed to approve verification.');
  }

  return json.data;
}

export async function raiseVerificationDiscrepancy(id, remarks) {
  const res = await apiFetch(`/api/verifications/${encodeURIComponent(id)}/discrepancy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ remarks }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Failed to record verification discrepancy.');
  }

  return json.data;
}

export async function rejectVerification(id, remarks) {
  const res = await apiFetch(`/api/verifications/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ remarks }),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Failed to reject verification.');
  }

  return json.data;
}

export async function fetchVerificationStats() {
  const res = await apiFetch('/api/verifications/stats');
  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Failed to fetch verification statistics.');
  }

  return json.data;
}
