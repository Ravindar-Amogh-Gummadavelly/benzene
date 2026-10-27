/**
 * API client helper for FDR operations
 * Uses apiFetch for automatic Bearer token injection
 */
import { apiFetch } from './apiClient';

export async function fetchFdrs({ status, institutionId, search } = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'All') {
    params.append('status', status.toUpperCase().replace(/ /g, '_'));
  }
  if (institutionId && institutionId !== 'All') {
    params.append('institutionId', institutionId);
  }
  if (search && search.trim()) {
    params.append('search', search.trim());
  }

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await apiFetch(`/api/fdr${queryStr}`);
  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Failed to fetch FDR records from server.');
  }

  return json.data || [];
}

export async function fetchFdrById(id) {
  const res = await apiFetch(`/api/fdr/${encodeURIComponent(id)}`);
  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || `Failed to fetch FDR details for ID '${id}'.`);
  }

  return json.data;
}

export async function createFdr(payload) {
  const res = await apiFetch('/api/fdr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.status !== 'ok') {
    const errorMsg = json.errors ? json.errors.join(' ') : json.message || 'Failed to create FDR.';
    const err = new Error(errorMsg);
    err.errors = json.errors || [errorMsg];
    throw err;
  }

  return json.data;
}

export async function updateFdr(id, payload) {
  const res = await apiFetch(`/api/fdr/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.status !== 'ok') {
    const errorMsg = json.errors ? json.errors.join(' ') : json.message || 'Failed to update FDR.';
    const err = new Error(errorMsg);
    err.errors = json.errors || [errorMsg];
    throw err;
  }

  return json.data;
}

export async function deleteFdr(id) {
  const res = await apiFetch(`/api/fdr/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || `Failed to delete FDR ID '${id}'.`);
  }

  return json.data;
}

export async function fetchFdrStats() {
  const res = await apiFetch('/api/fdr/stats');
  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Failed to fetch FDR summary statistics.');
  }

  return json.data;
}
