// Shared display helpers for anywhere a property's image or price is
// rendered (PropertyCard grid tiles, MapView popups, ...) so the two
// don't drift out of sync.

export const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/1642125/pexels-photo-1642125.jpeg?auto=compress&cs=tinysrgb&w=800';

export function resolveImage(imageUrl) {
  return imageUrl && imageUrl.startsWith('http') ? imageUrl : FALLBACK_IMAGE;
}

export function formatPrice(price) {
  const n = Number(price);
  return Number.isFinite(n) ? `$${n.toLocaleString()}` : 'Price on request';
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
