import { useCallback, useEffect, useState } from 'react';
import { LayoutGrid, Map as MapIcon, Columns2 } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import HorizontalFilter, { DEFAULT_FILTERS } from '../components/HorizontalFilter.jsx';
import PropertyList from '../components/PropertyList.jsx';
import MapView from '../components/MapView.jsx';
import { fetchProperties } from '../api/properties.js';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback.js';

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
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [geoCenter, setGeoCenter] = useState(null); // { lat, lng } | null - set via "Search near me"
  const [geoStatus, setGeoStatus] = useState('idle'); // 'idle' | 'locating' | 'error'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map' | 'split'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering now happens server-side (GET /api/properties?...), so every
  // change to `filters` or `geoCenter` re-fetches. HorizontalFilter pushes
  // changes here live as the user types/clicks - see onDraftChange below -
  // so this is debounced to avoid firing a request per keystroke/slider
  // tick; onApply/onReset bypass the debounce for an instant response.
  const debouncedSetFilters = useDebouncedCallback(setFilters, 400);

  const handleApplyFilters = useCallback(
    (next) => {
      debouncedSetFilters.cancel();
      setFilters(next);
    },
    [debouncedSetFilters]
  );

  const handleResetFilters = useCallback(() => {
    debouncedSetFilters.cancel();
    setFilters(DEFAULT_FILTERS);
    setGeoCenter(null);
    setGeoStatus('idle');
  }, [debouncedSetFilters]);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoStatus('idle');
      },
      () => setGeoStatus('error'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  const handleClearGeoCenter = useCallback(() => {
    setGeoCenter(null);
    setGeoStatus('idle');
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError('');
    fetchProperties(filters, geoCenter)
      .then((data) => {
        if (!cancelled) setProperties(data);
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
  }, [filters, geoCenter]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <HorizontalFilter
        filters={filters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onDraftChange={debouncedSetFilters}
        geoCenter={geoCenter}
        geoStatus={geoStatus}
        onUseMyLocation={handleUseMyLocation}
        onClearGeoCenter={handleClearGeoCenter}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-slate-900">
            {isLoading ? 'Loading properties…' : `${properties.length} properties found`}
          </h1>
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>

        {viewMode === 'grid' && (
          <PropertyList
            properties={properties}
            isLoading={isLoading}
            error={error}
            onResetFilters={handleResetFilters}
          />
        )}

        {viewMode === 'map' && (
          <div className="h-[70vh] min-h-[420px] w-full overflow-hidden rounded-xl border border-slate-200">
            <MapView properties={properties} />
          </div>
        )}

        {viewMode === 'split' && (
          // Mobile: stacked (list on top, map below at a fixed height).
          // lg+: side by side, list scrolls internally, map stays pinned.
          <div className="flex flex-col gap-4 lg:h-[75vh] lg:min-h-[480px] lg:flex-row">
            <div className="lg:min-h-0 lg:w-1/2 lg:overflow-y-auto lg:pr-1">
              <PropertyList
                properties={properties}
                isLoading={isLoading}
                error={error}
                compact
                onResetFilters={handleResetFilters}
              />
            </div>
            <div className="h-72 shrink-0 overflow-hidden rounded-xl border border-slate-200 lg:h-auto lg:w-1/2">
              <MapView properties={properties} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
