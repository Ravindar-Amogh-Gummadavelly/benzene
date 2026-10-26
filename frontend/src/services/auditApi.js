/**
 * Client for Audit Logs endpoints (/api/audit-logs)
 */

export async function fetchAuditLogs(params = {}) {
  const query = new URLSearchParams();
  if (params.entityType && params.entityType !== 'All') query.set('entityType', params.entityType);
  if (params.entityId) query.set('entityId', params.entityId);
  if (params.action && params.action !== 'All') query.set('action', params.action);
  if (params.search) query.set('search', params.search);
  if (params.fromDate) query.set('fromDate', params.fromDate);
  if (params.toDate) query.set('toDate', params.toDate);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`/api/audit-logs${qs}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch audit logs: ${res.statusText}`);
  }
  const result = await res.json();
  return result.data || [];
}

export async function fetchAuditLogById(id) {
  const res = await fetch(`/api/audit-logs/${id}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch audit log: ${res.statusText}`);
  }
  const result = await res.json();
  return result.data;
}
