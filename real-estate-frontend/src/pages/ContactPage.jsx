import { useState } from 'react';
import { Mail, MapPin, MessageCircle, CheckCircle2, Send, Loader2 } from 'lucide-react';
import Layout from '../components/Layout.jsx';

const CONTACT_DETAILS = [
  { Icon: Mail, label: 'Email', value: 'winfredmanu3@gmail.com', href: 'mailto:winfredmanu3@gmail.com' },
  { Icon: MapPin, label: 'Location', value: 'Tema, Ghana', href: null },
  { Icon: MessageCircle, label: 'Phone / WhatsApp', value: '+233 55 805 6515', href: 'tel:+233 55 805 6515' }
];

const FORM_DEFAULTS = { name: '', email: '', subject: '', message: '' };

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100';

/**
 * NOTE: there's no general-purpose "contact us" backend endpoint (the
 * existing Inquiry model is specifically tied to a property, which a
 * general contact message isn't). This simulates a successful submission
 * rather than silently doing nothing or pretending a network request
 * happened - same honest placeholder pattern used for the original
 * property inquiry form before POST /api/inquiries existed. Swap the
 * commented section below for a real request once a matching endpoint
 * exists (e.g. POST /api/contact).
 */
function ContactForm() {
  const [form, setForm] = useState(FORM_DEFAULTS);
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent'

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');

    // Placeholder for the real request once a backend endpoint exists:
    // await fetch(`${API_BASE_URL}/api/contact`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(form),
    // });
    setTimeout(() => setStatus('sent'), 600);
  };

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-green-100 bg-green-50 p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Thank you for reaching out!</p>
          <p className="mt-1 text-sm text-slate-600">We will get back to you shortly.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(FORM_DEFAULTS);
            setStatus('idle');
          }}
          className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1 block text-xs font-medium text-slate-500">
            Name
          </label>
          <input id="contact-name" type="text" required value={form.name} onChange={update('name')} className={inputClass} />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1 block text-xs font-medium text-slate-500">
            Email
          </label>
          <input id="contact-email" type="email" required value={form.email} onChange={update('email')} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-1 block text-xs font-medium text-slate-500">
          Subject
        </label>
        <input id="contact-subject" type="text" required value={form.subject} onChange={update('subject')} className={inputClass} />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1 block text-xs font-medium text-slate-500">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={form.message}
          onChange={update('message')}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {status === 'sending' ? 'Sending\u2026' : 'Send message'}
      </button>
    </form>
  );
}

function ContactCard({ Icon, label, value, href }) {
  const content = (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );

  return href ? (
    <a href={href} className="block transition-shadow hover:shadow-md">
      {content}
    </a>
  ) : (
    content
  );
}

export default function ContactPage() {
  return (
    <Layout>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900">Get in Touch</h1>
        <p className="mt-2 text-sm text-slate-500">
          Questions about a listing, your account, or working with Dream Homes? Send us a message.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
          <div className="space-y-3">
            {CONTACT_DETAILS.map((detail) => (
              <ContactCard key={detail.label} {...detail} />
            ))}
          </div>
        </div>
      </main>
    </Layout>
  );
}
