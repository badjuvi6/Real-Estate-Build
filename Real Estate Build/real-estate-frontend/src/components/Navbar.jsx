import { Home } from 'lucide-react';

const LINKS = ['Home', 'All Listings', 'Contact', 'FAQ'];

// h-16 here is load-bearing: HorizontalFilter is `sticky top-16` so it
// docks directly under this bar. If you resize the navbar, update both.
export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <a href="#" className="flex items-center gap-2 font-bold text-slate-900">
        <Home className="h-5 w-5 text-blue-600" />
        Dream Homes
      </a>
      <nav className="hidden gap-6 text-sm font-medium text-slate-600 sm:flex">
        {LINKS.map((link) => (
          <a key={link} href="#" className="transition-colors hover:text-blue-600">
            {link}
          </a>
        ))}
      </nav>
    </header>
  );
}
