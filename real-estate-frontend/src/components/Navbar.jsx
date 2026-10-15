import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'All Listings', to: '/search' },
  { label: 'Contact', to: '/contact' },
  { label: 'FAQ', to: '/faq' }
];

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

/** Avatar + dropdown shown once logged in - name, Dashboard link, Logout. */
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
          {initials(user.name)}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

// h-16 here is load-bearing: HorizontalFilter is `sticky top-16` so it
// docks directly under this bar. If you resize the navbar, update both.
export default function Navbar() {
  const { user, isAuthenticated, isLoading, logout, openLoginModal, openRegisterModal } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <Link to="/" className="flex items-center gap-2 font-bold text-slate-900">
        <Home className="h-5 w-5 text-blue-600" />
        Dream Homes
      </Link>

      <nav className="hidden gap-6 text-sm font-medium text-slate-600 sm:flex">
        {LINKS.map(({ label, to }) => (
          <Link key={label} to={to} className="transition-colors hover:text-blue-600">
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {/* isLoading: briefly true while a stored token is verified on
            first load - render nothing rather than flashing Login buttons
            that then get replaced by the user menu a moment later. */}
        {isLoading ? null : isAuthenticated ? (
          <UserMenu user={user} onLogout={logout} />
        ) : (
          <>
            <button
              type="button"
              onClick={openLoginModal}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={openRegisterModal}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Sign up
            </button>
          </>
        )}
      </div>
    </header>
  );
}
