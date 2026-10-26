/**
 * Frontend API client for Renewals & Maturity Tracking module.
 * Uses Vite `/api` reverse proxy.
 */

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

  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch renewals (HTTP ${res.status})`);
  }

  const result = await res.json();
  return result.data || [];
}

/**
 * Fetch full dossier for a specific renewal or FDR record.
 */
export async function fetchRenewalById(id) {
  const res = await fetch(`/api/renewals/${id}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch renewal details for '${id}' (HTTP ${res.status})`);
  }

  const result = await res.json();
  return result.data;
}

/**
 * Create a new renewal record.
 */
export async function createRenewal(fdrId, data = {}) {
  const res = await fetch(`/api/renewals/${fdrId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create renewal (HTTP ${res.status})`);
  }

  const result = await res.json();
  return result.data;
}

/**
 * Update an existing renewal record.
 */
export async function updateRenewal(id, data = {}) {
  const res = await fetch(`/api/renewals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update renewal (HTTP ${res.status})`);
  }

  const result = await res.json();
  return result.data;
}

/**
 * Complete / process renewal for an FDR record.
 */
export async function completeRenewal(id, data = {}) {
  const res = await fetch(`/api/renewals/${id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to process renewal (HTTP ${res.status})`);
  }

  const result = await res.json();
  return result.data;
}
