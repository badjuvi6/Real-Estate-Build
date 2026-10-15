import { useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import PropertyCard from './PropertyCard.jsx';

/**
 * Renders the results grid. This is the "list" half of the split-screen
 * map/list view - see the view-mode logic in SearchPage.jsx for how it
 * slots in alongside <MapView>.
 *
 * `compact` forces a single column regardless of viewport width - used in
 * split view, where this component only occupies half the page width.
 *
 * `onResetFilters` powers the "Reset Filters" button shown on a genuinely
 * empty result set.
 *
 * `hoveredId`/`selectedId`/`onCardHover` implement the map<->list sync:
 * hovering a card (or its marker on the map) highlights both; clicking a
 * marker sets `selectedId`, which also scrolls the matching card into view
 * here - useful in split view, where this list scrolls independently of
 * the page.
 *
 * `emptyTitle`/`emptyHint` override the empty-state copy for contexts
 * other than a filtered search (e.g. the dashboard's Saved Properties tab,
 * where "no properties match your filters" would be a non sequitur).
 */
export default function PropertyList({
  properties,
  isLoading,
  error,
  compact = false,
  onResetFilters,
  hoveredId = null,
  selectedId = null,
  onCardHover,
  emptyTitle = 'No properties found matching your criteria.',
  emptyHint = 'Try widening your price range, search radius, or other filters.',
}) {
  const cardRefs = useRef({});

  useEffect(() => {
    if (selectedId && cardRefs.current[selectedId]) {
      cardRefs.current[selectedId].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedId]);

  const gridClass = compact
    ? 'grid grid-cols-1 gap-4'
    : 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3';

  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-xl bg-slate-200/60" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
        <p className="text-sm font-medium text-slate-600">{emptyTitle}</p>
        <p className="mt-1 text-xs text-slate-400">{emptyHint}</p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {properties.map((property) => (
        <PropertyCard
          key={property._id}
          ref={(el) => {
            if (el) cardRefs.current[property._id] = el;
            else delete cardRefs.current[property._id];
          }}
          property={property}
          isHighlighted={hoveredId === property._id || selectedId === property._id}
          onMouseEnter={() => onCardHover?.(property._id)}
          onMouseLeave={() => onCardHover?.(null)}
        />
      ))}
    </div>
  );
}
