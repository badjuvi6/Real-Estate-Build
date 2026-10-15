import { useState } from 'react';
import { X, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Responsive login modal: a centered card on desktop, full-width sheet
 * from the bottom on mobile (rather than a tiny centered box that leaves
 * most of a phone screen as dead backdrop). Reads open/close state
 * directly from AuthContext so ANY component (Navbar's Login button, a
 * heart-icon click while logged out, a protected route) can trigger it
 * without prop-drilling.
 */
export default function LoginModal() {
  const { modal, closeModal, openRegisterModal, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = modal === 'login';

  const handleClose = () => {
    setError('');
    setEmail('');
    setPassword('');
    closeModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
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
        onClick={handleClose}
        className={`absolute inset-0 bg-slate-900/50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Log in"
        className={`absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col rounded-t-2xl bg-white shadow-xl transition-transform duration-300 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl ${
          isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:scale-95 sm:opacity-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Log in</h2>
          <button
            type="button"
            onClick={handleClose}
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
            <label htmlFor="login-email" className="mb-1 block text-xs font-medium text-slate-500">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="login-email"
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
            <label htmlFor="login-password" className="mb-1 block text-xs font-medium text-slate-500">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </button>

          <p className="text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={openRegisterModal}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
