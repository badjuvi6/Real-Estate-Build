import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Heart } from 'lucide-react';
import { resolveImage, formatPrice, handleImageError } from '../utils/property.js';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * forwardRef so PropertyList can attach a ref directly to the card's root
 * element (the rendered <a>, since react-router's Link forwards its own
 * ref) and scroll a specific card into view - e.g. when it's selected via
 * its marker on the map - without an extra wrapper div that could disturb
 * the grid layout.
 */
const PropertyCard = forwardRef(function PropertyCard(
  { property, isHighlighted = false, onMouseEnter, onMouseLeave },
  ref
) {
  const { _id, title, price, currency, address, imageUrl, description, propertyType, bedrooms, bathrooms } = property;
  const image = resolveImage(imageUrl);
  const { favoriteIds, toggleFavorite } = useAuth();
  const isFavorited = favoriteIds.has(_id);

  const handleFavoriteClick = (e) => {
    // Stop this click from also triggering the <Link>'s navigation - the
    // heart button sits inside the card's clickable link area, and
    // without this it would both toggle the favorite AND navigate away.
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(_id);
  };

  return (
    <Link
      ref={ref}
      to={`/property/${_id}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group block overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${
        isHighlighted ? 'border-blue-400 ring-2 ring-blue-400' : 'border-slate-200'
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={title}
          onError={handleImageError}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
          aria-pressed={isFavorited}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow-sm hover:bg-white"
        >
          <Heart
            className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-500'}`}
          />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{title}</h3>
          {propertyType && (
            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
              {propertyType}
            </span>
          )}
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{address}</span>
        </p>
        {description && <p className="mt-2 line-clamp-2 text-xs text-slate-500">{description}</p>}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-bold text-slate-900">{formatPrice(price, currency)}</span>
          {(bedrooms || bathrooms) && (
            <span className="text-xs text-slate-500">
              {bedrooms ? `${bedrooms} bd` : ''}
              {bedrooms && bathrooms ? ' · ' : ''}
              {bathrooms ? `${bathrooms} ba` : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});

export default PropertyCard;
