import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, Map as MapIcon, Columns2 } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import HorizontalFilter, { DEFAULT_FILTERS } from '../components/HorizontalFilter.jsx';
import PropertyList from '../components/PropertyList.jsx';
import MapView from '../components/MapView.jsx';
import { fetchProperties } from '../api/properties.js';

// Turns "Any" / "1+" / "2+" ... into a numeric minimum, or null for "Any".
function minFromChoice(choice) {
  if (!choice || choice === 'Any') return null;
  return parseInt(choice, 10);
}

/**
 * Client-side filtering, mirroring what the old vanilla-JS app already did
 * in applySearchAndFilters(). Bedrooms/bathrooms/propertyType only narrow
 * results for properties that actually have that field set.
 */
function applyFilters(properties, filters) {
  const location = filters.location.trim().toLowerCase();
  const minPrice = filters.minPrice !== '' ? Number(filters.minPrice) : null;
  const maxPrice = filters.maxPrice !== '' ? Number(filters.maxPrice) : null;
  const minBeds = minFromChoice(filters.bedrooms);
  const minBaths = minFromChoice(filters.bathrooms);

  return properties.filter((p) => {
    if (location && !`${p.address ?? ''}`.toLowerCase().includes(location)) return false;
    if (filters.propertyType && p.propertyType && p.propertyType !== filters.propertyType) return false;
    if (minPrice !== null && Number(p.price) < minPrice) return false;
    if (maxPrice !== null && Number(p.price) > maxPrice) return false;
    if (minBeds !== null && p.bedrooms != null && p.bedrooms < minBeds) return false;
    if (minBaths !== null && p.bathrooms != null && p.bathrooms < minBaths) return false;
    return true;
  });
}

const VIEW_MODES = [
  { id: 'grid', label: 'Grid', Icon: LayoutGrid },
  { id: 'map', label: 'Map', Icon: MapIcon },
  { id: 'split', label: 'Split', Icon: Columns2 },
];

/** Segmented Grid / Map / Split control, styled to match HorizontalFilter's RoomSelector. */
function ViewModeToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {VIEW_MODES.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const [allProperties, setAllProperties] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map' | 'split'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchProperties()
      .then((data) => {
        if (!cancelled) setAllProperties(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load properties.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleProperties = useMemo(
    () => applyFilters(allProperties, filters),
    [allProperties, filters]
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <HorizontalFilter filters={filters} onApply={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-slate-900">
            {isLoading ? 'Loading properties…' : `${visibleProperties.length} properties found`}
          </h1>
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>

        {viewMode === 'grid' && (
          <PropertyList properties={visibleProperties} isLoading={isLoading} error={error} />
        )}

        {viewMode === 'map' && (
          <div className="h-[70vh] min-h-[420px] w-full overflow-hidden rounded-xl border border-slate-200">
            <MapView properties={visibleProperties} />
          </div>
        )}

        {viewMode === 'split' && (
          // Mobile: stacked (list on top, map below at a fixed height).
          // lg+: side by side, list scrolls internally, map stays pinned.
          <div className="flex flex-col gap-4 lg:h-[75vh] lg:min-h-[480px] lg:flex-row">
            <div className="lg:min-h-0 lg:w-1/2 lg:overflow-y-auto lg:pr-1">
              <PropertyList properties={visibleProperties} isLoading={isLoading} error={error} compact />
            </div>
            <div className="h-72 shrink-0 overflow-hidden rounded-xl border border-slate-200 lg:h-auto lg:w-1/2">
              <MapView properties={visibleProperties} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
