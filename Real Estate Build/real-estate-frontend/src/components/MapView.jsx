import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { resolveImage, formatPrice } from '../utils/property.js';

const { BaseLayer } = LayersControl;

// --- Default marker icon fix ---
// Leaflet's default marker icon points at relative image paths that assume
// it's loaded from a plain <script> tag next to its own CSS. Once Leaflet
// is bundled by Vite instead, those paths 404 and every pin renders as a
// broken image. Re-pointing the default icon at the actual bundler-resolved
// URLs (imported above like any other asset) fixes it for every <Marker/>
// that doesn't specify its own `icon`. This only needs to happen once, so
// it runs at module scope rather than inside the component.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Roughly the center of the continental US - just the initial view before
// FitBoundsToMarkers takes over once real data loads.
const DEFAULT_CENTER = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

// Standard, long-used attribution string for Esri's free World_Imagery
// tile service (the same one embedded in Esri's own Leaflet tutorials).
const ESRI_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

/**
 * Filters `properties` down to the ones with a usable GeoJSON point and
 * converts each to a Leaflet-ready marker.
 *
 * `location.coordinates` is stored as GeoJSON [longitude, latitude]
 * (see backend/models/Property.js) - Leaflet's LatLngExpression is
 * [latitude, longitude], so the two are swapped here, in exactly one place.
 */
function toMarkers(properties) {
  return properties
    .filter((p) => {
      const coords = p?.location?.coordinates;
      return (
        Array.isArray(coords) &&
        coords.length === 2 &&
        Number.isFinite(coords[0]) &&
        Number.isFinite(coords[1])
      );
    })
    .map((p) => ({
      id: p._id,
      property: p,
      position: [p.location.coordinates[1], p.location.coordinates[0]], // [lat, lng]
    }));
}

/**
 * Child of <MapContainer> (needs the Leaflet map instance from context via
 * useMap, so it can't live in the parent component). Re-frames the map to
 * fit every visible marker whenever the filtered property list changes.
 */
function FitBoundsToMarkers({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView(markers[0].position, 13);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => m.position));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [map, markers]);

  return null;
}

/**
 * Reusable Leaflet map: one marker + popup per property with valid GeoJSON
 * coordinates, plus a Standard/Satellite base-layer switcher (top-right).
 * Properties without coordinates are skipped rather than plotted at [0, 0]
 * or crashing the map - see the note badge below the map when that
 * happens, so it's not a silent, confusing gap in the pin count.
 *
 * Props:
 *  - properties: array of property documents (same shape the API returns)
 *  - linkToDetails: whether each popup includes a "View Details" link to
 *    /property/:id (default true). PropertyDetailPage passes false when
 *    embedding this as its own single-pin mini map, since linking from a
 *    property's page back to that same property's page is pointless.
 */
export default function MapView({ properties = [], linkToDetails = true }) {
  const markers = useMemo(() => toMarkers(properties), [properties]);
  const skippedCount = properties.length - markers.length;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
      >
        {/*
          Two selectable base layers, switched via the built-in Leaflet
          control this renders in the top-right corner (position="topright").
          `collapsed={false}` keeps both options visible at all times rather
          than hidden behind a hover-to-reveal icon, since there are only
          two choices - no need to make the user discover a hidden menu.
          Markers/popups below are siblings of LayersControl, not children
          of either BaseLayer, so switching layers never touches them -
          pin positions and popup content stay exactly as they are.
        */}
        <LayersControl position="topright" collapsed={false}>
          {/*
            OpenStreetMap's own tile server is fine for development and
            light traffic, but their usage policy asks production apps to
            cache tiles and avoid heavy automated load - see
            https://operations.osmfoundation.org/policies/tiles/. Swap this
            `url` for a dedicated provider (MapTiler, Mapbox, Stadia Maps,
            etc.) before this goes in front of real users at scale.
          */}
          <BaseLayer checked name="Standard">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </BaseLayer>

          {/*
            Esri's free World_Imagery REST tile endpoint - no API key
            required, but note the {z}/{y}/{x} segment order below is
            deliberately different from the {z}/{x}/{y} OSM uses above;
            that's Esri's tiling scheme, not a typo.
          */}
          <BaseLayer name="Satellite">
            <TileLayer
              attribution={ESRI_ATTRIBUTION}
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </BaseLayer>
        </LayersControl>

        <FitBoundsToMarkers markers={markers} />

        {markers.map(({ id, property, position }) => (
          <Marker key={id} position={position}>
            <Popup minWidth={180} maxWidth={220}>
              <img
                src={resolveImage(property.imageUrl)}
                alt={property.title}
                className="mb-2 h-24 w-full rounded-md object-cover"
              />
              <p className="line-clamp-1 text-sm font-semibold text-slate-900">{property.title}</p>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{property.address}</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{formatPrice(property.price)}</p>
              {linkToDetails && (
                <Link
                  to={`/property/${property._id}`}
                  className="mt-2 block rounded-md bg-blue-600 px-2 py-1 text-center text-xs font-semibold text-white hover:bg-blue-700"
                >
                  View Details
                </Link>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {skippedCount > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
          {skippedCount} {skippedCount === 1 ? 'property is' : 'properties are'} missing map coordinates
        </div>
      )}
    </div>
  );
}
