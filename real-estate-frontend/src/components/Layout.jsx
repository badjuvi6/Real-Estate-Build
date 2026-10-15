import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

/**
 * Shared page shell: Navbar + page content + Footer. Introduced alongside
 * the Footer overhaul so every page (Home, Search, Property detail,
 * Dashboard, FAQ) gets the footer consistently rather than each page
 * needing to remember to render it. `children` is expected to be the
 * page's <main> element (or similar) - this just arranges it between the
 * two global chrome pieces.
 */
export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
