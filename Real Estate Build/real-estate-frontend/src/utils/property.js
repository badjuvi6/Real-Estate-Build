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
