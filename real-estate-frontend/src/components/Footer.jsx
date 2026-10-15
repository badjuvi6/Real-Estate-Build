import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Github, Linkedin, ShieldCheck, Home, ArrowUp } from 'lucide-react';

// TODO: replace these with your own repository / profile URLs. They point
// at the sites' root pages for now so nothing here is a broken link, but
// they don't know who you are.
const DEVELOPER_LINKS = [
  { label: 'GitHub', href: 'https://github.com/badjuvi6', Icon: Github },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/manu-winfred-bb801b434', Icon: Linkedin }
];

const search = (params) => `/search?${new URLSearchParams(params).toString()}`;

// Every link here either goes to a real route/filtered search or, where no
// destination exists, is rendered as a scroll-to-top button (see
// FooterLink) - nothing is an inert "#" anchor. The categories reflect
// what the app actually has (browsing by type/city, account pages, help)
// rather than placeholder features that don't exist.
const LINK_CATEGORIES = [
  {
    title: 'Browse Homes',
    links: [
      { label: 'All listings', to: '/search' },
      { label: 'Houses', to: search({ propertyType: 'House' }) },
      { label: 'Apartments', to: search({ propertyType: 'Apartment' }) },
      { label: 'Villas', to: search({ propertyType: 'Villa' }) },
      { label: 'Commercial', to: search({ propertyType: 'Commercial' }) }
    ]
  },
  {
    title: 'Popular Cities',
    links: ['Accra', 'Kumasi', 'Takoradi', 'Cape Coast', 'Tamale'].map((city) => ({
      label: city,
      to: search({ location: city })
    }))
  },
  {
    title: 'Your Account',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Saved homes', to: '/favorites' }
    ]
  },
  {
    title: 'Help',
    links: [
      { label: 'FAQ', to: '/faq' },
      { label: 'Contact us', to: '/contact' }
    ]
  }
];

// No About / News / Careers / Terms / Privacy pages exist, so these scroll
// to the top instead of pointing at routes that would 404.
const COMPANY_LINKS = ['About', 'News', 'Careers', 'Terms of Use', 'Privacy Notice'];

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

/** A real <Link> when `to` is given; otherwise a scroll-to-top button styled identically. */
function FooterLink({ label, to, className }) {
  if (to) {
    return (
      <Link to={to} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={scrollToTop} className={`${className} text-left`}>
      {label}
    </button>
  );
}

/** One collapsible footer category - closed by default on mobile, always open from `sm` up. */
function FooterCategory({ title, links }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-800 py-4 sm:border-none sm:py-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-sm font-semibold text-white sm:pointer-events-none sm:cursor-default"
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform sm:hidden ${open ? 'rotate-180' : ''}`} />
      </button>
      <ul className={`mt-3 space-y-2 ${open ? 'block' : 'hidden'} sm:block`}>
        {links.map((link) => (
          <li key={link.label}>
            <FooterLink label={link.label} to={link.to} className="text-sm text-slate-400 hover:text-white" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-auto bg-slate-900 text-slate-300">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LINK_CATEGORIES.map((category) => (
            <FooterCategory key={category.title} title={category.title} links={category.links} />
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-6 border-t border-slate-800 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {COMPANY_LINKS.map((label) => (
              <FooterLink key={label} label={label} className="text-xs text-slate-400 hover:text-white" />
            ))}
          </div>

          <div className="flex items-center gap-4">
            {DEVELOPER_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-slate-400 hover:text-white"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              Back to top
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Equal Housing Opportunity. Dream Homes supports fair and equal access to housing for everyone.
          </div>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Home className="h-3.5 w-3.5 text-blue-500" />
            &copy; {new Date().getFullYear()} Dream Homes &mdash; a portfolio project.
          </p>
        </div>
      </div>
    </footer>
  );
}
