/**
 * Frontend API client for Security Deposit Release Requests & NOC module.
 * Uses Vite `/api` reverse proxy.
 */

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

  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch release requests (HTTP ${res.status})`);
  }

  const result = await res.json();
  return result.data || [];
}

/**
 * Fetch a specific release request by ID.
 */
export async function fetchReleaseById(id) {
  const res = await fetch(`/api/releases/${id}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch release request #${id} (HTTP ${res.status})`);
  }

  const result = await res.json();
  return result.data;
}

/**
 * Create a new release request for an FDR.
 * body: { fdrId, fdrNumber, remarks }
 */
export async function createReleaseRequest(data = {}) {
  const res = await fetch('/api/releases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create release request (HTTP ${res.status})`);
  }

  const result = await res.json();
  return result.data;
}

/**
 * Update an existing release request.
 */
export async function updateReleaseRequest(id, data = {}) {
  const res = await fetch(`/api/releases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update release request (HTTP ${res.status})`);
  }

  const result = await res.json();
  return result.data;
}

/**
 * Approve release request and release FDR.
 */
export async function approveReleaseRequest(id, remarks = '') {
  const res = await fetch(`/api/releases/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ remarks }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to approve release request (HTTP ${res.status})`);
  }

  const result = await res.json();
  return result.data;
}

/**
 * Reject release request with mandatory reason.
 */
export async function rejectReleaseRequest(id, remarks) {
  const res = await fetch(`/api/releases/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ remarks }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to reject release request (HTTP ${res.status})`);
  }

  const result = await res.json();
  return result.data;
}
