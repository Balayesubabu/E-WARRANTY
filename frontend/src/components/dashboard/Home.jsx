import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { CustomerHome } from './CustomerHome';
import { getUserDetails } from '../../services/userService';
import Cookies from 'js-cookie';


export function Home() {
  const allowedRoles = ['customer', 'dealer', 'staff', 'owner', 'provider', 'service_center'];
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const getValidStoredRole = () => {
          const storedUser = localStorage.getItem('user');
          if (!storedUser) return null;
          const parsed = JSON.parse(storedUser);
          const storedRole = parsed.role || parsed.user_type;
          return allowedRoles.includes(storedRole) ? storedRole : null;
        };

        // First check localStorage for user type (faster, no API call needed)
        const storedRole = getValidStoredRole();
        if (storedRole) {
          setRole(storedRole);
        }
        
        // Then try to get full user details from API
        const userData = await getUserDetails();
        const apiRole = userData?.role || userData?.user_type;
        if (apiRole && allowedRoles.includes(apiRole)) {
          setRole(apiRole);
        }
      } catch (error) {
        console.error("Home - Error fetching user details:", error);
        // If API fails, fall back only if stored role is valid.
        try {
          const fallbackRole = (() => {
            const storedUser = localStorage.getItem('user');
            if (!storedUser) return null;
            const parsed = JSON.parse(storedUser);
            const r = parsed.role || parsed.user_type;
            return allowedRoles.includes(r) ? r : null;
          })();

          if (fallbackRole) {
            setRole(fallbackRole);
          } else {
            // Clear stale auth state to avoid role/token mismatch loops.
            Cookies.remove('authToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('franchise');
            setRole(null);
          }
        } catch (e) {
          console.error("Home - Error parsing stored user:", e);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserDetails();
  }, []);

  // Show loading state while determining role
  if (isLoading && !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7FC1] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/customer-auth" replace />;
  }

  switch (role) {
    case 'customer':
      return <CustomerHome />;
    case 'dealer':
      return <Navigate to="/dealer" replace />;
    case 'staff':
      return <Navigate to="/staff" replace />;
    case 'owner':
    case 'provider':
      return <Navigate to="/owner" replace />;
    case 'service_center':
      return <Navigate to="/service-center" replace />;
    default:
      return <Navigate to="/customer-auth" replace />;
  }
}