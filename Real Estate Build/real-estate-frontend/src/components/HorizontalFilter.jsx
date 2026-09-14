import { useEffect, useState } from 'react';
import { RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';

export const PROPERTY_TYPES = ['House', 'Apartment', 'Condo', 'Townhouse', 'Land'];
const ROOM_CHOICES = ['Any', '1+', '2+', '3+', '4+'];

export const DEFAULT_FILTERS = {
  location: '',
  propertyType: '',
  minPrice: '',
  maxPrice: '',
  bedrooms: 'Any',
  bathrooms: 'Any',
  radius: 25, // km
};

function countActiveFilters(f) {
  let n = 0;
  if (f.location.trim()) n++;
  if (f.propertyType) n++;
  if (f.minPrice !== '') n++;
  if (f.maxPrice !== '') n++;
  if (f.bedrooms !== 'Any') n++;
  if (f.bathrooms !== 'Any') n++;
  if (Number(f.radius) !== DEFAULT_FILTERS.radius) n++;
  return n;
}

/** Segmented button group used for both Bedrooms and Bathrooms. */
function RoomSelector({ label, value, onChange }) {
  return (
    <div className="shrink-0">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        {ROOM_CHOICES.map((choice) => (
          <button
            key={choice}
            type="button"
            aria-pressed={value === choice}
            onClick={() => onChange(choice)}
            className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
              value === choice
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * The actual filter inputs. Rendered once for the desktop bar (horizontal,
 * flex-wrap) and once inside the mobile drawer (stacked, full width) so
 * both surfaces share one source of truth for the fields themselves.
 */
function FilterFields({ draft, patch, stacked }) {
  const fieldWidth = stacked ? 'w-full' : 'w-full sm:w-auto';

  return (
    <div className={stacked ? 'flex flex-col gap-5' : 'flex flex-wrap items-end gap-4'}>
      {/* Search location */}
      <div className={`${fieldWidth} ${stacked ? '' : 'sm:min-w-[220px] sm:flex-1'}`}>
        <label htmlFor="filter-location" className="mb-1.5 block text-xs font-medium text-slate-500">
          Location
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="filter-location"
            type="text"
            value={draft.location}
            onChange={(e) => patch({ location: e.target.value })}
            placeholder="City, neighborhood, or ZIP"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Property type */}
      <div className={`${fieldWidth} ${stacked ? '' : 'sm:w-44'}`}>
        <label htmlFor="filter-type" className="mb-1.5 block text-xs font-medium text-slate-500">
          Property type
        </label>
        <select
          id="filter-type"
          value={draft.propertyType}
          onChange={(e) => patch({ propertyType: e.target.value })}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div className={`${fieldWidth} ${stacked ? '' : 'sm:w-56'}`}>
        <span className="mb-1.5 block text-xs font-medium text-slate-500">Price range</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={draft.minPrice}
            onChange={(e) => patch({ minPrice: e.target.value })}
            placeholder="Min"
            aria-label="Minimum price"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <span className="text-slate-300">–</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={draft.maxPrice}
            onChange={(e) => patch({ maxPrice: e.target.value })}
            placeholder="Max"
            aria-label="Maximum price"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Bedrooms / Bathrooms */}
      <div className={stacked ? 'flex flex-col gap-5' : 'flex items-end gap-4'}>
        <RoomSelector label="Bedrooms" value={draft.bedrooms} onChange={(v) => patch({ bedrooms: v })} />
        <RoomSelector label="Bathrooms" value={draft.bathrooms} onChange={(v) => patch({ bathrooms: v })} />
      </div>

      {/* Radius (geospatial) */}
      <div className={`${fieldWidth} ${stacked ? '' : 'sm:w-48'}`}>
        <label
          htmlFor="filter-radius"
          className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500"
        >
          <span>Search radius</span>
          <span className="font-semibold text-slate-700">{draft.radius} km</span>
        </label>
        <input
          id="filter-radius"
          type="range"
          min={5}
          max={50}
          step={5}
          value={draft.radius}
          onChange={(e) => patch({ radius: Number(e.target.value) })}
          className="w-full accent-blue-600"
        />
      </div>
    </div>
  );
}

/**
 * Horizontal search & filter bar.
 *
 * Controlled by the parent: `filters` is the currently *applied* filter
 * set (the thing actually driving the results), while edits are held in
 * local draft state until the user hits "Apply Filters" — matching the
 * requirement for an explicit Apply action rather than filtering on every
 * keystroke. "Reset" clears the draft and applies immediately.
 *
 * Props:
 *  - filters:  the committed filter object (see DEFAULT_FILTERS for shape)
 *  - onApply:  (filters) => void — called when the user applies the draft
 *  - onReset:  () => void — called when the user resets to defaults
 */
export default function HorizontalFilter({ filters, onApply, onReset }) {
  const [draft, setDraft] = useState(filters);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Re-sync the draft whenever the committed filters change from outside
  // (e.g. a future "clear all" affordance elsewhere on the page).
  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const patch = (changes) => setDraft((prev) => ({ ...prev, ...changes }));

  const handleApply = () => {
    onApply(draft);
    setDrawerOpen(false);
  };

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
    onReset();
    setDrawerOpen(false);
  };

  const activeCount = countActiveFilters(filters);

  return (
    <div className="sticky top-16 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {/* Desktop / tablet: full horizontal bar */}
      <div className="hidden lg:block px-6 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <FilterFields draft={draft} patch={patch} stacked={false} />
          <div className="flex items-center gap-2 pb-0.5">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / small tablet: compact search + Filters trigger */}
      <div className="flex items-center gap-2 px-4 py-3 lg:hidden">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={draft.location}
            onChange={(e) => patch({ location: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder="Search by city or ZIP"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="relative inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile drawer (slide-over) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${drawerOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!drawerOpen}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-slate-900/40 transition-opacity ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Filters</h2>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close filters"
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <FilterFields draft={draft} patch={patch} stacked />
          </div>

          <div className="flex items-center gap-3 border-t border-slate-200 px-5 py-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
