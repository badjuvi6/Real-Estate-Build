import { useState } from 'react';
import { X, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const ROLES = [
  { id: 'user', label: "I'm buying or renting" },
  { id: 'agent', label: "I'm a real estate agent" }
];

/**
 * Responsive registration modal - same shell/behavior as LoginModal (see
 * its comments), plus a role selector so a new account can register as a
 * buyer or an agent up front.
 *
 * PRODUCT NOTE: this lets anyone self-select "agent" with no verification
 * at all. Fine for this app's current scope; a real production listings
 * platform would want to gate that behind something - a license number, a
 * verified work email domain, admin approval - since "agent" grants
 * listing-creation rights (see the requireRole('agent') check on the
 * backend's property-creation route).
 */
export default function RegisterModal() {
  const { modal, closeModal, openLoginModal, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = modal === 'register';

  const resetAndClose = () => {
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setRole('user');
    closeModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register(name, email, password, role);
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] ${isOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      <div
        onClick={resetAndClose}
        className={`absolute inset-0 bg-slate-900/50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create an account"
        className={`absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col rounded-t-2xl bg-white shadow-xl transition-transform duration-300 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl ${
          isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:scale-95 sm:opacity-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Create an account</h2>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-5 py-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="register-name" className="mb-1 block text-xs font-medium text-slate-500">
              Full name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="register-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-email" className="mb-1 block text-xs font-medium text-slate-500">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-password" className="mb-1 block text-xs font-medium text-slate-500">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="register-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">At least 8 characters.</p>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-500">I am...</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ROLES.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={role === id}
                  onClick={() => setRole(id)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors ${
                    role === id
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={openLoginModal}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Log in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
