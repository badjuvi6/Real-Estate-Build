// Shared display helpers for anywhere a property's image or price is
// rendered (PropertyCard grid tiles, MapView popups, PropertyDetailPage's
// gallery, ...) so they don't drift out of sync.

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800';

export function resolveImage(imageUrl) {
  return imageUrl && imageUrl.startsWith('http') ? imageUrl : FALLBACK_IMAGE;
}

/**
 * onError handler for <img> tags: swaps in the fallback when a URL that
 * *looked* valid (resolveImage let it through) turns out to 404 or
 * otherwise fail to load at runtime - a dead link, not just a missing one.
 * Guards against looping forever if the fallback image itself ever fails.
 */
export function handleImageError(e) {
  if (e.currentTarget.src !== FALLBACK_IMAGE) {
    e.currentTarget.src = FALLBACK_IMAGE;
  }
}

/**
 * Formats a price with its proper currency symbol. `currency` defaults to
 * 'USD' to match the backend's default (every property created before the
 * `currency` field existed was implicitly USD - see models/Property.js).
 */
export function formatPrice(price, currency = 'USD') {
  const n = Number(price);
  if (!Number.isFinite(n)) return 'Price on request';
  try {
    return new Intl.NumberFormat(currency === 'GHS' ? 'en-GH' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(n);
  } catch {
    // Intl.NumberFormat throws for a currency code it doesn't recognize -
    // fall back to something readable rather than letting that propagate.
    return `${currency} ${n.toLocaleString()}`;
  }
}

/**
 * Converts a HorizontalFilter room-count choice ("Any" / "1+" / "2+" / ...)
 * into a numeric minimum, or null for "Any". Shared between the API layer
 * (building query params) and anywhere else that needs the same mapping,
 * so the two can't drift apart.
 */
export function minFromChoice(choice) {
  if (!choice || choice === 'Any') return null;
  return parseInt(choice, 10);
}
