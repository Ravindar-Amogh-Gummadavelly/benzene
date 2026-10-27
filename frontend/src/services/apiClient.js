/**
 * Centralized HTTP Client helper with automatic Bearer token injection
 * and 401 unauthenticated redirect handling.
 */

const TOKEN_KEY = 'aicte_fdr_auth_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Enhanced fetch wrapper that attaches Authorization header.
 */
export async function apiFetch(url, options = {}) {
  const token = getStoredToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized, notify listeners
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  return response;
}
