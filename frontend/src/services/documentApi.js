/**
 * Client for Document management endpoints (/api/documents)
 * Uses apiFetch for automatic Bearer token injection
 */
import { apiFetch } from './apiClient';

export async function fetchDocuments(params = {}) {
  const query = new URLSearchParams();
  if (params.fdrRecordId) query.set('fdrRecordId', params.fdrRecordId);
  if (params.fdrNumber) query.set('fdrNumber', params.fdrNumber);
  if (params.documentType && params.documentType !== 'All') query.set('documentType', params.documentType);
  if (params.search) query.set('search', params.search);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await apiFetch(`/api/documents${qs}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch documents: ${res.statusText}`);
  }
  const result = await res.json().catch(() => ({}));
  return result.data || [];
}

export async function fetchDocumentById(id) {
  const res = await apiFetch(`/api/documents/${id}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch document: ${res.statusText}`);
  }
  const result = await res.json().catch(() => ({}));
  return result.data;
}

export async function createDocument(data) {
  const res = await apiFetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create document: ${res.statusText}`);
  }
  const result = await res.json().catch(() => ({}));
  return result.data;
}

export async function updateDocument(id, data) {
  const res = await apiFetch(`/api/documents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update document: ${res.statusText}`);
  }
  const result = await res.json().catch(() => ({}));
  return result.data;
}

export async function deleteDocument(id) {
  const res = await apiFetch(`/api/documents/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to delete document: ${res.statusText}`);
  }
  const result = await res.json().catch(() => ({}));
  return result.data;
}
