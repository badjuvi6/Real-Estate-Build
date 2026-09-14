import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { resolveImage, formatPrice } from '../utils/property.js';

export default function PropertyCard({ property }) {
  const { _id, title, price, address, imageUrl, description, propertyType, bedrooms, bathrooms } = property;
  const image = resolveImage(imageUrl);

  return (
    <Link
      to={`/property/${_id}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
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
          <span className="text-base font-bold text-slate-900">{formatPrice(price)}</span>
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
}
