import axios from "axios";
import Cookies from "js-cookie";

function resolveApiBaseUrl() {
    const envDefault = import.meta.env.VITE_API_URL || "/api";
    // In Vite dev, window is always defined in the browser.
    if (typeof window === "undefined" || !window.location) return envDefault;

    const host = window.location.hostname;
    const isLoopback =
        host === "localhost" || host === "127.0.0.1" || host === "[::1]";

    // When the app is opened from a phone via LAN IP, use a LAN-reachable API base.
    if (!isLoopback) {
        const mobileEnv = import.meta.env.VITE_MOBILE_API_URL;
        if (mobileEnv && String(mobileEnv).trim()) return String(mobileEnv).trim();
        // Fallback: assume backend is on same host at :5000
        return `${window.location.protocol}//${host}:5000/api`;
    }

    return envDefault;
}

export const api = axios.create({
    baseURL: resolveApiBaseUrl(),
});

// Add token to all requests automatically
// api.interceptors.request.use(
//     (config) => {
//         const token = Cookies.get("authToken");
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );

api.interceptors.request.use((config) => {
    // Check localStorage first, then fall back to cookies
    let token = localStorage.getItem("token");
    
    // Fallback to cookie if localStorage token is not available
    if (!token) {
      token = Cookies.get("authToken");
    }
    
    const franchise = JSON.parse(localStorage.getItem("franchise") || "null");

    // Only set Authorization if we have a valid token string (avoids "jwt malformed")
    if (token && typeof token === "string" && token.length > 0) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (franchise?.id) {
      config.headers.franchise_id = franchise.id;
    }

    // Automatically add role headers so the backend middleware can identify
    // dealer/staff tokens correctly (prevents "User not found" errors).
    // Only set if not already present (allows per-request overrides).
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userType = user?.user_type || user?.role || "";
      if (userType === "dealer" && !config.headers.is_dealer) {
        config.headers.is_dealer = "true";
      }
      if (userType === "staff" && !config.headers.is_staff) {
        config.headers.is_staff = "true";
      }
      if (userType === "service_center" && !config.headers.is_service_center) {
        config.headers.is_service_center = "true";
      }
    } catch {
      // ignore JSON parse errors
    }

    return config;
  });
  
function clearAuthAndRedirect(message) {
    const path = window.location.pathname;
    let user = {};
    try {
        user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        user = {};
    }
    const ut = String(user.user_type ?? '').toLowerCase();
    const roleRaw = String(user.role ?? user.canonical_role?.code ?? '');
    const roleUp = roleRaw.toUpperCase();
    const isCustomer =
        ut === 'customer' || roleUp === 'CUSTOMER' || roleRaw.toLowerCase() === 'customer';
    const isSuperAdmin = ut === 'super_admin' || roleUp === 'SUPER_ADMIN';

    Cookies.remove('authToken');
    Cookies.remove('role');
    Cookies.remove('email');
    Cookies.remove('franchiseId');
    localStorage.removeItem('token');
    localStorage.removeItem('franchise');
    localStorage.removeItem('user');
    if (message) {
        sessionStorage.setItem('authError', message);
    }
    if (path.includes('/login') || path.includes('/signup')) {
        return;
    }
    let target = '/login';
    if (path.startsWith('/super-admin') && !path.includes('/super-admin/login')) {
        target = '/super-admin/login';
    } else if (path.includes('/customer-auth')) {
        target = '/customer-auth';
    } else if (isCustomer) {
        target = '/customer-auth';
    } else if (isSuperAdmin) {
        target = '/super-admin/login';
    } else if (
        ['/home', '/profile', '/edit-profile', '/notifications'].some(
            (p) => path === p || path.startsWith(`${p}/`)
        )
    ) {
        target = '/customer-auth';
    }
    window.location.href = target;
}

function isAccountBlockedOrDeactivated(message) {
    if (!message || typeof message !== 'string') return false;
    const lower = message.toLowerCase();
    return (
        lower.includes('blocked') ||
        lower.includes('deactivated') ||
        lower.includes('account is inactive')
    );
}

function isLoginRequest(config) {
    const url = config?.url || '';
    const loginPaths = [
        'owner-log-in',
        'staff-login',
        'dealer-login',
        'service-center-login',
        'customer/login',
        'google-login',
    ];
    return loginPaths.some((p) => url.includes(p));
}

// Handle 401 and 403 (account blocked/deactivated) globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || '';

        if (status === 401) {
            clearAuthAndRedirect();
        } else if (status === 403 && isAccountBlockedOrDeactivated(message)) {
            // Skip redirect for login requests - let Login component show the error toast
            if (!isLoginRequest(error.config)) {
                clearAuthAndRedirect(message);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
