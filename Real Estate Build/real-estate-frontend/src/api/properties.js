const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Fetches every property from the existing Express/Mongoose backend
 * (backend/routes/properties.js -> GET /api/properties).
 *
 * Filtering happens client-side in SearchPage, same as the current
 * vanilla-JS app does today. If the result set grows large enough that
 * client-side filtering stops being practical, this is the place to add
 * query-string params (e.g. ?location=&minPrice=&propertyType=) once the
 * backend route supports them.
 */
export async function fetchProperties() {
  const res = await fetch(`${API_BASE_URL}/api/properties`);
  if (!res.ok) {
    throw new Error(`Failed to load properties (status ${res.status})`);
  }
  return res.json();
}

/**
 * Fetches a single property's full details by ID
 * (backend/routes/properties.js -> GET /api/properties/:id), used by
 * PropertyDetailPage. Distinguishes the two expected failure cases -
 * a malformed ID (400) vs. a well-formed ID with no matching document
 * (404) - so the page can show an accurate message instead of a generic
 * "something went wrong".
 */
export async function getPropertyById(id) {
  const res = await fetch(`${API_BASE_URL}/api/properties/${id}`);
  if (res.status === 400) {
    throw new Error('That property link looks invalid.');
  }
  if (res.status === 404) {
    throw new Error('This property could not be found. It may have been removed.');
  }
  if (!res.ok) {
    throw new Error(`Failed to load property (status ${res.status})`);
  }
  return res.json();
}
