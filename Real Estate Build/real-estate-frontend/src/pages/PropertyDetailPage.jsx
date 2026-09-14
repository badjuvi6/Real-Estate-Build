import { useEffect, lazy, Suspense, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bed,
  Bath,
  Ruler,
  Home as HomeIcon,
  MapPin,
  Check,
  Calendar,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  Box,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import MapView from '../components/MapView.jsx';
import { getPropertyById } from '../api/properties.js';
import { resolveImage, formatPrice } from '../utils/property.js';

// Lazy-loaded: three.js + @react-three/fiber + @react-three/drei add ~850KB
// to the bundle. Nobody browsing the search page or just looking at photos
// should pay that cost - it only downloads once someone actually clicks
// the "3D Virtual Tour" tab below.
const VirtualTour3D = lazy(() => import('../components/VirtualTour3D.jsx'));

/** Main preview image + thumbnail strip + prev/next arrows. */
function ImageGallery({ images, title }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const photos = images.length > 0 ? images : [resolveImage(undefined)];

  const goTo = (i) => setActiveIndex((i + photos.length) % photos.length);

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100">
        <img
          src={photos[activeIndex]}
          alt={`${title} - photo ${activeIndex + 1} of ${photos.length}`}
          className="h-full w-full object-cover"
        />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-medium text-white">
              {activeIndex + 1} / {photos.length}
            </div>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === activeIndex}
              className={`shrink-0 overflow-hidden rounded-lg ${
                i === activeIndex ? 'ring-2 ring-blue-600' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img src={src} alt="" className="h-16 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** One icon+value(+label) entry in the header stats row. Renders nothing for missing values. */
/** Photos / 3D Virtual Tour switcher, styled to match the app's other segmented controls (ViewModeToggle, RoomSelector). */
function MediaTabs({ value, onChange }) {
  const tabs = [
    { id: 'photos', label: 'Photos', Icon: ImageIcon },
    { id: 'tour', label: '3D Virtual Tour', Icon: Box },
  ];
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {tabs.map(({ id, label, Icon }) => (
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
          {label}
        </button>
      ))}
    </div>
  );
}

function StatItem({ Icon, value, label }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-center gap-2 text-slate-700">
      <Icon className="h-4 w-4 text-slate-400" />
      <span className="text-sm font-medium">{value}</span>
      {label && <span className="text-xs text-slate-400">{label}</span>}
    </div>
  );
}

/** Agent photo/initials avatar, name, phone, email - renders nothing if no agent is set. */
function AgentCard({ agent }) {
  if (!agent) return null;
  const initials = agent.name
    ? agent.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{agent.name || 'Listing Agent'}</p>
        {agent.phone && (
          <a href={`tel:${agent.phone}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600">
            <Phone className="h-3 w-3" /> {agent.phone}
          </a>
        )}
        {agent.email && (
          <a href={`mailto:${agent.email}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600">
            <Mail className="h-3 w-3" /> {agent.email}
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * "Inquire About Property" form.
 *
 * IMPORTANT: there's no backend endpoint yet to receive this (Phase 3's
 * backend scope was GET /api/properties/:id only). Submitting here
 * simulates success after a short delay so the form is fully interactive
 * to demo end-to-end. Wire the commented fetch() call below up to a real
 * endpoint (e.g. POST /api/inquiries) when one exists.
 */
function InquiryForm({ propertyTitle }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: `Hi, I'm interested in "${propertyTitle}". Could you share more details?`,
  });
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent'

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');

    // Placeholder for the real request once a backend endpoint exists:
    // await fetch(`${API_BASE_URL}/api/inquiries`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ propertyId, ...form }),
    // });
    setTimeout(() => setStatus('sent'), 700);
  };

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-green-50 p-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
        <p className="text-sm font-semibold text-slate-900">Message sent</p>
        <p className="text-xs text-slate-500">The agent will get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="inquiry-name" className="mb-1 block text-xs font-medium text-slate-500">
          Name
        </label>
        <input
          id="inquiry-name"
          type="text"
          required
          value={form.name}
          onChange={update('name')}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div>
        <label htmlFor="inquiry-email" className="mb-1 block text-xs font-medium text-slate-500">
          Email
        </label>
        <input
          id="inquiry-email"
          type="email"
          required
          value={form.email}
          onChange={update('email')}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div>
        <label htmlFor="inquiry-phone" className="mb-1 block text-xs font-medium text-slate-500">
          Phone (optional)
        </label>
        <input
          id="inquiry-phone"
          type="tel"
          value={form.phone}
          onChange={update('phone')}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div>
        <label htmlFor="inquiry-message" className="mb-1 block text-xs font-medium text-slate-500">
          Message
        </label>
        <textarea
          id="inquiry-message"
          required
          rows={4}
          value={form.message}
          onChange={update('message')}
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {status === 'sending' ? 'Sending…' : 'Inquire About Property'}
      </button>
    </form>
  );
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMediaTab, setActiveMediaTab] = useState('photos'); // 'photos' | 'tour'
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError('');
    getPropertyById(id)
      .then((data) => {
        if (!cancelled) setProperty(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load this property.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 aspect-[16/10] w-full animate-pulse rounded-xl bg-slate-200" />
          <div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  // Covers both failure modes from getPropertyById: a malformed :id (400)
  // and a well-formed :id with no matching property (404). Either way
  // there's nothing to render, so show the same "can't show this" state
  // with a way back rather than a blank or half-broken page.
  if (error || !property) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="text-lg font-semibold text-slate-900">{error || 'Property not found.'}</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to search
          </Link>
        </div>
      </div>
    );
  }

  // Cover photo + gallery images combined, resolved through the same
  // fallback as everywhere else, de-duplicated (the cover image is
  // sometimes also included in `images` by whoever created the listing).
  const gallery = [...new Set([property.imageUrl, ...(property.images || [])].filter(Boolean).map(resolveImage))];
  const isLand = property.propertyType === 'Land';
  const hasCoordinates = Array.isArray(property.location?.coordinates);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to search
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-8 lg:col-span-2">
            <div>
              <div className="mb-3">
                <MediaTabs value={activeMediaTab} onChange={setActiveMediaTab} />
              </div>
              {activeMediaTab === 'photos' ? (
                <ImageGallery images={gallery} title={property.title} />
              ) : (
                <Suspense
                  fallback={
                    <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                  }
                >
                  <VirtualTour3D property={property} />
                </Suspense>
              )}
            </div>

            {/* Header: title, address, price, key stats */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{property.title}</h1>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-4 w-4 shrink-0" /> {property.address}
                  </p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{formatPrice(property.price)}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-4">
                {/* Bed/bath counts don't apply to vacant land, even though
                    the schema defaults them to 0 for every property type. */}
                {!isLand && <StatItem Icon={Bed} value={property.bedrooms} label="Bedrooms" />}
                {!isLand && <StatItem Icon={Bath} value={property.bathrooms} label="Bathrooms" />}
                <StatItem Icon={Ruler} value={property.area ? `${property.area.toLocaleString()} sq ft` : undefined} />
                <StatItem Icon={HomeIcon} value={property.propertyType} />
              </div>
            </div>

            {/* Overview & amenities */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold text-slate-900">Overview</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {property.description}
              </p>

              {property.yearBuilt && (
                <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-500">
                  <Calendar className="h-4 w-4" /> Built in {property.yearBuilt}
                </p>
              )}

              {property.amenities?.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-semibold text-slate-900">Amenities</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {property.amenities.map((item) => (
                      <div key={item} className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Check className="h-4 w-4 shrink-0 text-blue-600" /> {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mini map - only rendered when this property is actually
                geocoded; an ungeocoded listing has nothing to pin. */}
            {hasCoordinates && (
              <div>
                <h2 className="mb-3 text-base font-semibold text-slate-900">Location</h2>
                <div className="h-80 w-full overflow-hidden rounded-xl border border-slate-200">
                  {/* linkToDetails=false: this popup would otherwise link
                      back to the page the user is already on. */}
                  <MapView properties={[property]} linkToDetails={false} />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: agent info + inquiry form, sticky on desktop */}
          <aside className="lg:col-span-1">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
              <AgentCard agent={property.agent} />
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Inquire About Property</h2>
              <InquiryForm propertyTitle={property.title} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
