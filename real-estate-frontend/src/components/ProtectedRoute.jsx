import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Wraps a route element that requires a logged-in user. While the stored
 * token is still being verified (isLoading), renders nothing rather than
 * bouncing to "/" and then immediately back - that flash would happen on
 * every hard refresh of a protected page otherwise. Once resolved, either
 * renders `children` or redirects to "/" with the login modal queued to
 * open, so a direct link to e.g. /dashboard leads somewhere useful instead
 * of a dead end.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, openLoginModal } = useAuth();
  const location = useLocation();

  // Opening the modal is a side effect (it updates AuthContext's state) -
  // it has to happen in an effect, not directly during render, or React
  // will warn about updating one component's state while rendering
  // another.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openLoginModal();
    }
  }, [isLoading, isAuthenticated, openLoginModal]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
