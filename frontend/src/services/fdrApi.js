/**
 * API client helper for FDR operations
 * Uses Vite development proxy (/api)
 */

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
  const res = await fetch(`/api/fdr${queryStr}`);
  const json = await res.json();

  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Failed to fetch FDR records from server.');
  }

  return json.data || [];
}

export async function fetchFdrById(id) {
  const res = await fetch(`/api/fdr/${encodeURIComponent(id)}`);
  const json = await res.json();

  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || `Failed to fetch FDR details for ID '${id}'.`);
  }

  return json.data;
}

export async function createFdr(payload) {
  const res = await fetch('/api/fdr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok || json.status !== 'ok') {
    const errorMsg = json.errors ? json.errors.join(' ') : json.message || 'Failed to create FDR.';
    const err = new Error(errorMsg);
    err.errors = json.errors || [errorMsg];
    throw err;
  }

  return json.data;
}

export async function updateFdr(id, payload) {
  const res = await fetch(`/api/fdr/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok || json.status !== 'ok') {
    const errorMsg = json.errors ? json.errors.join(' ') : json.message || 'Failed to update FDR.';
    const err = new Error(errorMsg);
    err.errors = json.errors || [errorMsg];
    throw err;
  }

  return json.data;
}

export async function deleteFdr(id) {
  const res = await fetch(`/api/fdr/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  const json = await res.json();

  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Failed to delete FDR record.');
  }

  return json;
}

export async function fetchFdrStats() {
  const res = await fetch('/api/fdr/stats');
  const json = await res.json();

  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Failed to fetch FDR statistics.');
  }

  return json.data;
}
