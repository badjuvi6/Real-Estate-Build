import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import { PROPERTY_TYPES } from '../components/HorizontalFilter.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Verified real photo (fetched and confirmed before use) - a residential
// neighborhood aerial shot. Not a literal photo of any Ghanaian property;
// used the same way the rest of this app uses stock photography for
// fictional listings.
const HERO_IMAGE_URL = 'https://images.pexels.com/photos/32170345/pexels-photo-32170345.jpeg?auto=compress&cs=tinysrgb&w=1600';

/**
 * Shown only when logged out - a direct path into the login modal, not a
 * sign-up wall. Rendered as the last item INSIDE Hero's own content flow
 * (see the fix note on Hero below) rather than as a page-level sibling.
 */
function PersonalizedRecommendationsCTA() {
  const { isAuthenticated, openLoginModal } = useAuth();

  if (isAuthenticated) return null;

  return (
    <div className="relative z-10 mx-auto mt-10 w-full max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Get home recommendations</p>
            <p className="text-sm text-slate-500">Sign in for a more personalized experience.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openLoginModal}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Sign in
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Full-width hero: background image, headline, search bar, category
 * pills, and the recommendations CTA.
 *
 * BUG FIX: the CTA used to be a separate sibling component positioned with
 * `-mt-8` (a negative margin), trying to visually "reach up" into the
 * bottom of this box from outside it - fragile by construction, since that
 * fixed -32px offset had no relationship to how tall this box actually
 * rendered (which varies with viewport width as the pills wrap). Combined
 * with a `min-h-[...]` guess rather than letting the box size itself to
 * its content, the two could drift out of sync and the card would land in
 * the wrong place relative to the hero's actual bottom edge.
 *
 * Fix: the CTA now renders as the LAST child inside this same relative/
 * z-10 content stack, positioned with a normal positive `mt-10` in regular
 * document flow. `min-h-[...]` is gone in favor of top/bottom padding, so
 * the box's height is just however tall its content needs - including the
 * CTA - with no overlap arithmetic to get wrong.
 */
function Hero() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/search?location=${encodeURIComponent(trimmed)}` : '/search');
  };

  return (
    <div className="relative overflow-hidden pb-12 pt-16 sm:pb-16 sm:pt-24">
      <img src={HERO_IMAGE_URL} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-slate-900/60" />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
        <h1 className="text-3xl font-bold text-white sm:text-5xl">Rentals. Homes. Agents. Loans.</h1>
        <p className="mt-3 text-sm text-slate-200 sm:text-base">
          Search homes and apartments across Accra, Kumasi, Takoradi, and beyond.
        </p>

        <form onSubmit={handleSearch} className="mt-8 flex overflow-hidden rounded-full bg-white shadow-lg">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a city, neighborhood, or keyword"
              aria-label="Search for a city, neighborhood, or keyword"
              className="h-14 w-full rounded-full border-0 pl-12 pr-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="m-1.5 shrink-0 rounded-full bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Search
          </button>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => navigate(`/search?propertyType=${encodeURIComponent(type)}`)}
              className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/20"
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <PersonalizedRecommendationsCTA />
    </div>
  );
}

export default function HomePage() {
  return (
    <Layout>
      <main className="flex-1">
        <Hero />
      </main>
    </Layout>
  );
}
