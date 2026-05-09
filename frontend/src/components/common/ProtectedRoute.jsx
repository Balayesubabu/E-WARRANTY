import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';

/**
 * Customer-facing shell routes (/home, /profile, …) should send unauthenticated users to
 * /customer-auth (OTP flow), not the unified /login page.
 */
export function ProtectedRoute({ children, redirectTo = '/customer-auth' }) {
  const token = Cookies.get('authToken') || localStorage.getItem('token');

  if (!token) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
