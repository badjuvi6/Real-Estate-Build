const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function parseJsonOrThrow(res, fallbackMessage) {
  let body = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON error body (e.g. a proxy/500 HTML page) - fall through to
    // the generic message below rather than throwing on the parse itself.
  }
  if (!res.ok) {
    throw new Error(body?.message || fallbackMessage);
  }
  return body;
}

export async function registerUser({ name, email, password, role }) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role })
  });
  return parseJsonOrThrow(res, 'Registration failed.');
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return parseJsonOrThrow(res, 'Login failed.');
}

export async function fetchMe(token) {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return parseJsonOrThrow(res, 'Failed to load your account.');
}

export async function fetchFavorites(token) {
  const res = await fetch(`${API_BASE_URL}/api/users/favorites`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return parseJsonOrThrow(res, 'Failed to load your favorites.');
}

export async function toggleFavoriteApi(propertyId, token) {
  const res = await fetch(`${API_BASE_URL}/api/users/favorites/${propertyId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  return parseJsonOrThrow(res, 'Failed to update favorites.');
}
