import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { registerUser, loginUser, fetchMe, fetchFavorites, toggleFavoriteApi } from '../api/auth.js';

const TOKEN_STORAGE_KEY = 'dreamhomes_token';

// SECURITY NOTE: the JWT is stored in localStorage, which is the standard
// approach for a plain SPA (no server-rendered pages, no session cookies)
// talking to a stateless JWT API - it's simple and needs no CORS/cookie
// plumbing on the backend. The trade-off: localStorage is readable by any
// JS running on the page, so a successful XSS attack elsewhere in the app
// could steal the token. An httpOnly cookie is immune to that (JS can't
// read it at all) at the cost of needing CSRF protection instead and
// cookie-aware CORS config. For this app's current scope, localStorage is
// the pragmatic choice; if this app starts handling more sensitive data,
// revisiting this for httpOnly cookies is a reasonable hardening step.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true); // true while a stored token is being verified on first load
  const [modal, setModal] = useState(null); // null | 'login' | 'register'

  // Runs whenever `token` changes - on mount (restoring a stored session),
  // right after login/register (see below), and on logout. Verifying the
  // token against GET /api/auth/me (rather than trusting whatever's in
  // localStorage) means an expired or tampered token gets cleared instead
  // of the app silently believing someone's still logged in.
  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setUser(null);
      setFavoriteIds(new Set());
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    Promise.all([fetchMe(token), fetchFavorites(token)])
      .then(([meResult, favorites]) => {
        if (cancelled) return;
        setUser(meResult.user);
        setFavoriteIds(new Set(favorites.map((p) => p._id)));
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
        setFavoriteIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const { token: newToken, user: loggedInUser } = await loginUser({ email, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setUser(loggedInUser);
    setToken(newToken);
    setModal(null);
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    const { token: newToken, user: newUser } = await registerUser({ name, email, password, role });
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setUser(newUser);
    setToken(newToken);
    setModal(null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setFavoriteIds(new Set());
  }, []);

  // Not logged in -> prompt login instead of silently failing, since a
  // heart-icon click while logged out should lead somewhere useful rather
  // than doing nothing. Logged in -> optimistic update (the UI flips
  // immediately), reverted if the request actually fails.
  const toggleFavorite = useCallback(
    async (propertyId) => {
      if (!token) {
        setModal('login');
        return;
      }
      const wasFavorited = favoriteIds.has(propertyId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.delete(propertyId);
        else next.add(propertyId);
        return next;
      });
      try {
        await toggleFavoriteApi(propertyId, token);
      } catch {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorited) next.add(propertyId);
          else next.delete(propertyId);
          return next;
        });
      }
    },
    [token, favoriteIds]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user),
      isAgent: user?.role === 'agent',
      isLoading,
      favoriteIds,
      login,
      register,
      logout,
      toggleFavorite,
      modal,
      openLoginModal: () => setModal('login'),
      openRegisterModal: () => setModal('register'),
      closeModal: () => setModal(null)
    }),
    [user, token, isLoading, favoriteIds, login, register, logout, toggleFavorite, modal]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
