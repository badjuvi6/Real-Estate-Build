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
 * Submits a new listing from the dashboard's "My Listings" form (agents
 * only - the backend enforces this with requireAuth + requireRole('agent')
 * on POST /api/properties, regardless of what this function sends).
 *
 * Sent as FormData, not JSON: the backend's POST /api/properties route
 * uses multer (upload.single('image')) unconditionally to support direct
 * file uploads elsewhere, and multer parses text fields fine even when no
 * file is attached - reusing that one endpoint here avoids needing a
 * parallel JSON-only creation route. Cover image and panorama are both
 * plain pasted links from this form, not uploads.
 */
export async function createListing(values, token) {
  const formData = new FormData();
  formData.append('title', values.title);
  formData.append('description', values.description);
  formData.append('price', values.price);
  formData.append('currency', values.currency || 'GHS');
  formData.append('address', values.address);
  formData.append('city', values.city);
  formData.append('region', values.region);
  formData.append('propertyType', values.propertyType);
  formData.append('bedrooms', values.bedrooms || 0);
  formData.append('bathrooms', values.bathrooms || 0);
  if (values.areaSqFt) formData.append('areaSqFt', values.areaSqFt);
  if (values.yearBuilt) formData.append('yearBuilt', values.yearBuilt);
  if (values.imageUrl) formData.append('imageUrl', values.imageUrl);
  if (values.panoramaUrl) formData.append('panoramaUrl', values.panoramaUrl);
  if (values.latitude !== '' && values.latitude != null) formData.append('latitude', values.latitude);
  if (values.longitude !== '' && values.longitude != null) formData.append('longitude', values.longitude);

  const res = await fetch(`${API_BASE_URL}/api/properties`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }, // no Content-Type - the browser sets the correct multipart boundary for FormData automatically
    body: formData
  });
  return parseJsonOrThrow(res, 'Failed to create listing.');
}
