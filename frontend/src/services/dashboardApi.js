/**
 * Client for Dashboard stats (/api/dashboard/stats)
 */

export async function fetchDashboardStats() {
  const res = await fetch('/api/dashboard/stats');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch dashboard stats: ${res.statusText}`);
  }
  const result = await res.json();
  return result.data;
}
