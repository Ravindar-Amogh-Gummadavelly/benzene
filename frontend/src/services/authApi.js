import { apiFetch, setStoredToken, removeStoredToken, getStoredToken } from './apiClient';

/**
 * Frontend client for Authentication & User Management
 */

export async function loginUser(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json();
  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Login failed.');
  }

  setStoredToken(json.data.token);
  return json.data;
}

export async function fetchCurrentUser() {
  const token = getStoredToken();
  if (!token) return null;

  const res = await apiFetch('/api/auth/me');
  if (!res.ok) {
    if (res.status === 401) {
      removeStoredToken();
      return null;
    }
    throw new Error('Failed to fetch current user.');
  }

  const json = await res.json();
  return json.data;
}

export async function logoutUser() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    // Ignore network error during logout
  } finally {
    removeStoredToken();
  }
}

export async function fetchUsers() {
  const res = await apiFetch('/api/auth/users');
  const json = await res.json();
  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Failed to fetch users list.');
  }
  return json.data || [];
}

export async function createUser(userData) {
  const res = await apiFetch('/api/auth/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const json = await res.json();
  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Failed to create user.');
  }
  return json.data;
}

export async function updateUser(id, userData) {
  const res = await apiFetch(`/api/auth/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const json = await res.json();
  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Failed to update user.');
  }
  return json.data;
}

export async function seedDemoAccounts() {
  const res = await fetch('/api/auth/seed-demo', {
    method: 'POST',
  });
  const json = await res.json();
  if (!res.ok || json.status !== 'ok') {
    throw new Error(json.message || 'Failed to seed demo accounts.');
  }
  return json.data;
}
