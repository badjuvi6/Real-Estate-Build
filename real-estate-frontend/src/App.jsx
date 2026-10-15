import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import LoginModal from './components/LoginModal.jsx';
import RegisterModal from './components/RegisterModal.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import PropertyDetailPage from './pages/PropertyDetailPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import FAQPage from './pages/FAQPage.jsx';
import ContactPage from './pages/ContactPage.jsx';

/**
 * React Router doesn't reset scroll on navigation, so following a footer
 * link from the bottom of one page would land you at the bottom of the
 * next. Scroll to the top whenever the path or query string changes.
 */
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

/**
 * SearchPage seeds its filters from the URL (?location=, ?propertyType=)
 * only once, on mount. Keying it on the query string remounts it when that
 * string changes - e.g. clicking a footer link like "Villas" while already
 * on /search - so the new URL actually takes effect instead of silently
 * changing the address bar without touching the filters. Typing in the
 * filter bar doesn't write to the URL, so ordinary filtering never changes
 * the key and never triggers a remount.
 */
function SearchRoute() {
  const { search } = useLocation();
  return <SearchPage key={search} />;
}

// Note for deployment: BrowserRouter needs the host to rewrite unknown
// paths back to index.html (standard on Netlify/Vercel/etc. via a
// catch-all rewrite rule) - otherwise a hard refresh on a nested route
// 404s at the server before React Router ever gets a chance to run.
export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      {/* AuthProvider wraps everything, including the modals below, since
          both the modals and every page need access to auth state/actions
          (login/logout, favorites, opening the modals from anywhere). */}
      <AuthProvider>
        <Routes>
          {/* HomePage (hero + search bar) is the landing page; the full
              filter/grid/map results experience lives at "/search" - the
              hero's search bar and property-type chips hand off there via
              query params. */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchRoute />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          {/* /favorites is really just the dashboard's default tab - this
              keeps both routes working without a second, near-duplicate page. */}
          <Route path="/favorites" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Mounted once here (not per-page) so they're always available
            regardless of which route is active. */}
        <LoginModal />
        <RegisterModal />
      </AuthProvider>
    </BrowserRouter>
  );
}
