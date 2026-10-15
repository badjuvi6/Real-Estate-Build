const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function parseJsonOrThrow(res, fallbackMessage) {
  let body = null;
  try {
    body = await res.json();
  } catch {
    // ignore parse failure, fall back to the generic message below
  }
  if (!res.ok) {
    throw new Error(body?.message || fallbackMessage);
  }
  return body;
}

/**
 * Submits a property inquiry. Works whether or not the caller is logged in
 * (token is optional) - the backend's optionalAuth middleware attaches the
 * inquiry to the user's account when a token is present, so it later shows
 * up in their dashboard; an anonymous submission still reaches the agent,
 * it just isn't tied to any account.
 */
export async function createInquiry({ propertyId, name, email, phone, message }, token) {
  const res = await fetch(`${API_BASE_URL}/api/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ propertyId, name, email, phone, message })
  });
  return parseJsonOrThrow(res, 'Failed to send your message.');
}

/** Every inquiry the logged-in user has sent - powers the dashboard's Inquiries tab. */
export async function fetchMyInquiries(token) {
  const res = await fetch(`${API_BASE_URL}/api/inquiries/mine`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return parseJsonOrThrow(res, 'Failed to load your inquiries.');
}
