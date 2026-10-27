/**
 * Client for Dashboard stats (/api/dashboard/stats)
 * Uses apiFetch for automatic Bearer token injection
 */
import { apiFetch } from './apiClient';

export async function fetchDashboardStats() {
  const res = await apiFetch('/api/dashboard/stats');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch dashboard stats: ${res.statusText}`);
  }
  const result = await res.json().catch(() => ({}));
  return result.data;
}
