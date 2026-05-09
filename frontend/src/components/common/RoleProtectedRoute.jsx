import { Navigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

/**
 * Role-based protected route wrapper.
 * Wraps ProtectedRoute behavior (token check) AND enforces role-based access.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {string[]} props.allowedRoles - Array of allowed roles (e.g., ['owner'], ['staff', 'owner'], ['dealer'])
 * @param {string[]} props.allowedStaffRoleTypes - Optional allowed staff role types (e.g., ['Manager'])
 */
export function RoleProtectedRoute({ children, allowedRoles = [], allowedStaffRoleTypes = [] }) {
  const location = useLocation();

  // 1. Check authentication (token exists)
  const cookieToken = Cookies.get('authToken');
  const localStorageToken = localStorage.getItem('token');
  const token = cookieToken || localStorageToken;

  // Get user info
  let userType = null;
  let staffRoleType = null;
  try {
    const user = localStorage.getItem('user');
    const parsed = user ? JSON.parse(user) : null;
    userType = parsed?.user_type || parsed?.role || null;
    // Normalize: "provider" is treated as "owner" throughout the frontend
    if (userType === 'provider') userType = 'owner';
    staffRoleType = parsed?.role_type || null;
  } catch (e) {
    console.error('RoleProtectedRoute: Error parsing user from localStorage:', e);
  }

  // Build the full path including query params so we can redirect back after login
  const currentPath = location.pathname + location.search;

  // 2. If no token, redirect to appropriate login page (preserve return URL)
  if (!token) {
    const stateWithReturn = { from: currentPath };
    if (currentPath.startsWith('/super-admin') && !currentPath.includes('/super-admin/login')) {
      return <Navigate to="/super-admin/login" replace state={stateWithReturn} />;
    }
    return <Navigate to="/login" replace state={stateWithReturn} />;
  }

  // Sync token to cookie if only in localStorage
  if (!cookieToken && localStorageToken) {
    Cookies.set('authToken', localStorageToken, { sameSite: 'lax' });
  }

  // 3. If allowedRoles is empty, allow all authenticated users
  if (allowedRoles.length === 0) {
    return children;
  }

  // 4. Check if user's role is in the allowed list
  if (userType && allowedRoles.includes(userType)) {
    if (userType === 'staff' && allowedStaffRoleTypes.length > 0) {
      if (staffRoleType && allowedStaffRoleTypes.includes(staffRoleType)) {
        return children;
      }
      console.warn(
        `RoleProtectedRoute: Staff role type "${staffRoleType}" not in allowed staff role types [${allowedStaffRoleTypes.join(', ')}]. Redirecting to /home.`
      );
      return <Navigate to="/home" replace />;
    }
    return children;
  }

  // 5. User is authenticated but not authorized - redirect to their home page
  const homePath = userType === 'super_admin' ? '/super-admin' : '/home';
  console.warn(`RoleProtectedRoute: User type "${userType}" not in allowed roles [${allowedRoles.join(', ')}]. Redirecting to ${homePath}.`);
  return <Navigate to={homePath} replace />;
}
