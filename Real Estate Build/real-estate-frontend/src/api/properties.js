import { minFromChoice } from '../utils/property.js';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Builds the query string for GET /api/properties from the app's filter
 * state shape (see HorizontalFilter's DEFAULT_FILTERS) plus an optional
 * geo center. Only includes params that are actually set, so an empty
 * filter set produces a plain `?` -less request for everything.
 */
function buildQueryParams(filters, geoCenter) {
  const params = new URLSearchParams();

  if (filters.location?.trim()) params.set('search', filters.location.trim());
  if (filters.propertyType) params.set('propertyType', filters.propertyType);
  if (filters.minPrice !== '' && filters.minPrice != null) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice !== '' && filters.maxPrice != null) params.set('maxPrice', filters.maxPrice);

  const minBeds = minFromChoice(filters.bedrooms);
  if (minBeds !== null) params.set('bedrooms', minBeds);
  const minBaths = minFromChoice(filters.bathrooms);
  if (minBaths !== null) params.set('bathrooms', minBaths);

  // The radius slider only means anything once we have a center point to
  // search from - see the "Near me" control in HorizontalFilter/SearchPage.
  if (geoCenter) {
    params.set('lat', geoCenter.lat);
    params.set('lng', geoCenter.lng);
    params.set('radius', filters.radius);
  }

  return params;
}

/**
 * Fetches properties from the backend, filtered server-side
 * (backend/routes/properties.js -> GET /api/properties). `filters` is the
 * app's filter state; `geoCenter` (optional) is a { lat, lng } set via
 * "Near me" - without it, the radius value in `filters` is not sent, since
 * a radius search needs a center point to search from.
 */
export async function fetchProperties(filters = {}, geoCenter = null) {
  const params = buildQueryParams(filters, geoCenter);
  const query = params.toString();
  const res = await fetch(`${API_BASE_URL}/api/properties${query ? `?${query}` : ''}`);
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
