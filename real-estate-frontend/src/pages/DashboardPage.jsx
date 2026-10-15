import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageSquare,
  Building2,
  Send,
  Loader2,
  CheckCircle2,
  MapPin,
  Calendar,
  ChevronRight
} from 'lucide-react';
import Layout from '../components/Layout.jsx';
import PropertyList from '../components/PropertyList.jsx';
import { PROPERTY_TYPES } from '../components/HorizontalFilter.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchFavorites } from '../api/auth.js';
import { fetchMyInquiries } from '../api/inquiries.js';
import { createListing } from '../api/agentListings.js';
import { formatPrice, resolveImage } from '../utils/property.js';

const TABS = [
  { id: 'saved', label: 'Saved Properties', Icon: Heart },
  { id: 'inquiries', label: 'Inquiries', Icon: MessageSquare },
  { id: 'listings', label: 'My Listings', Icon: Building2, agentOnly: true }
];

/** Segmented tab control, styled to match the app's other toggles (ViewModeToggle, MediaTabs, RoomSelector). */
function TabNav({ tabs, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
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

function SavedPropertiesTab({ token }) {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchFavorites(token)
      .then((data) => {
        if (!cancelled) setProperties(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load your favorites.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <PropertyList
      properties={properties}
      isLoading={isLoading}
      error={error}
      emptyTitle="You haven't saved any properties yet."
      emptyHint="Browse listings and tap the heart icon on a property to save it here."
    />
  );
}

function InquiryRow({ inquiry }) {
  const property = inquiry.property; // populated by the backend - title/address/imageUrl/price, or null if the property was since deleted
  const date = new Date(inquiry.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
      {property ? (
        <Link to={`/property/${property._id}`} className="shrink-0">
          <img
            src={resolveImage(property.imageUrl)}
            alt={property.title}
            className="h-16 w-20 rounded-lg object-cover"
          />
        </Link>
      ) : (
        <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] text-slate-400">
          Listing removed
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {property ? (
              <Link to={`/property/${property._id}`} className="truncate text-sm font-semibold text-slate-900 hover:text-blue-600">
                {property.title}
              </Link>
            ) : (
              <p className="truncate text-sm font-semibold text-slate-500">Listing no longer available</p>
            )}
            {property && (
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{property.address}</span>
                <span className="shrink-0 font-medium text-slate-600">· {formatPrice(property.price, property.currency)}</span>
              </p>
            )}
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
            <Calendar className="h-3 w-3" />
            {date}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{inquiry.message}</p>
      </div>
    </div>
  );
}

function InquiriesTab({ token }) {
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchMyInquiries(token)
      .then((data) => {
        if (!cancelled) setInquiries(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load your inquiries.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200/60" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">{error}</div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center">
        <p className="text-sm font-medium text-slate-600">You haven&apos;t sent any inquiries yet.</p>
        <p className="mt-1 text-xs text-slate-400">
          Messages you send to agents from a property&apos;s page will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {inquiries.map((inquiry) => (
        <InquiryRow key={inquiry._id} inquiry={inquiry} />
      ))}
    </div>
  );
}

const LISTING_FORM_DEFAULTS = {
  title: '',
  description: '',
  price: '',
  currency: 'GHS',
  address: '',
  city: '',
  region: '',
  propertyType: PROPERTY_TYPES[0],
  bedrooms: '',
  bathrooms: '',
  areaSqFt: '',
  yearBuilt: '',
  latitude: '',
  longitude: '',
  imageUrl: '',
  panoramaUrl: ''
};

function FormField({ label, hint, children }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';

function MyListingsTab({ token }) {
  const [form, setForm] = useState(LISTING_FORM_DEFAULTS);
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'error' | 'success'
  const [error, setError] = useState('');
  const [createdProperty, setCreatedProperty] = useState(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      const property = await createListing(form, token);
      setCreatedProperty(property);
      setForm(LISTING_FORM_DEFAULTS);
      setStatus('success');
    } catch (err) {
      setError(err.message || 'Failed to create listing.');
      setStatus('error');
    }
  };

  if (status === 'success' && createdProperty) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-green-100 bg-green-50 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Listing created</p>
          <p className="text-sm text-slate-600">&ldquo;{createdProperty.title}&rdquo; is now live.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/property/${createdProperty._id}`}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            View listing
            <ChevronRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Create another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-5">
      {status === 'error' && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <FormField label="Title">
        <input required value={form.title} onChange={update('title')} className={inputClass} />
      </FormField>

      <FormField label="Description">
        <textarea required rows={3} value={form.description} onChange={update('description')} className={inputClass} />
      </FormField>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <FormField label="Price">
          <input required type="number" min="0" value={form.price} onChange={update('price')} className={inputClass} />
        </FormField>
        <FormField label="Currency">
          <select value={form.currency} onChange={update('currency')} className={inputClass}>
            <option value="GHS">GHS</option>
            <option value="USD">USD</option>
          </select>
        </FormField>
        <FormField label="Property type">
          <select value={form.propertyType} onChange={update('propertyType')} className={inputClass}>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Address">
        <input required value={form.address} onChange={update('address')} className={inputClass} placeholder="e.g. East Legon, Accra" />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="City">
          <input required value={form.city} onChange={update('city')} className={inputClass} placeholder="e.g. Accra" />
        </FormField>
        <FormField label="Region">
          <input required value={form.region} onChange={update('region')} className={inputClass} placeholder="e.g. Greater Accra" />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <FormField label="Bedrooms">
          <input type="number" min="0" value={form.bedrooms} onChange={update('bedrooms')} className={inputClass} />
        </FormField>
        <FormField label="Bathrooms">
          <input type="number" min="0" value={form.bathrooms} onChange={update('bathrooms')} className={inputClass} />
        </FormField>
        <FormField label="Area (sq ft)">
          <input type="number" min="0" value={form.areaSqFt} onChange={update('areaSqFt')} className={inputClass} />
        </FormField>
        <FormField label="Year built">
          <input type="number" value={form.yearBuilt} onChange={update('yearBuilt')} className={inputClass} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Latitude" hint="e.g. 25.7617">
          <input type="number" step="any" value={form.latitude} onChange={update('latitude')} className={inputClass} />
        </FormField>
        <FormField label="Longitude" hint="e.g. -80.1918">
          <input type="number" step="any" value={form.longitude} onChange={update('longitude')} className={inputClass} />
        </FormField>
      </div>

      <FormField label="Cover image link" hint="A direct link to a photo (used on the listing card and gallery).">
        <input type="url" value={form.imageUrl} onChange={update('imageUrl')} className={inputClass} placeholder="https://..." />
      </FormField>

      <FormField
        label="Panoramic image link (optional)"
        hint="An equirectangular 360° photo, if you have one. Not shown anywhere yet - reserved for a future virtual-tour upgrade."
      >
        <input type="url" value={form.panoramaUrl} onChange={update('panoramaUrl')} className={inputClass} placeholder="https://..." />
      </FormField>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {status === 'submitting' ? 'Creating…' : 'Create listing'}
      </button>
    </form>
  );
}

export default function DashboardPage() {
  const { user, token, isAgent } = useAuth();
  const [activeTab, setActiveTab] = useState('saved');

  const visibleTabs = TABS.filter((tab) => !tab.agentOnly || isAgent);

  return (
    <Layout>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your saved homes, inquiries, and listings.</p>

        <div className="mt-5 mb-5">
          <TabNav tabs={visibleTabs} value={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === 'saved' && <SavedPropertiesTab token={token} />}
        {activeTab === 'inquiries' && <InquiriesTab token={token} />}
        {activeTab === 'listings' && isAgent && <MyListingsTab token={token} />}
      </main>
    </Layout>
  );
}
