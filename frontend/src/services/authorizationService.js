import api from '../utils/api';
import Cookies from 'js-cookie';

export const signup = async (data) => {
    try {
        const response = await api.post("/customer/register", data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Helper function to store franchise data in both localStorage and cookies
 * for consistency across the app (api.js uses localStorage, staffService uses cookies)
 */
const storeFranchiseData = (franchise) => {
    if (franchise?.id) {
        // Store in cookies for staffService.js compatibility
        Cookies.set("franchiseId", franchise.id, { sameSite: "lax" });
        // Store full franchise object in localStorage for api.js compatibility
        localStorage.setItem("franchise", JSON.stringify(franchise));
    }
};

/**
 * Fetch or create franchise data for owner after login
 * Uses the new get-or-create-franchise API that:
 * - Returns existing franchise if available
 * - Creates a default franchise if none exists
 */
const fetchOwnerFranchise = async () => {
    try {
        const response = await api.get("/owner/get-or-create-franchise");
        const franchise = response.data?.data?.franchise;
        if (franchise) {
            storeFranchiseData(franchise);
        }
        return franchise;
    } catch (error) {
        console.error("Error fetching/creating owner franchise:", error);
        // Don't throw - franchise fetch failure shouldn't block login
        return null;
    }
};

export const login = async (data) => {
    try {
        const response = await api.post("/customer/login", data);
        const token = response.data?.data?.token;
        const user = response.data?.data?.user;
        
        if (token) {
            // Store token in both cookies and localStorage for consistency
            Cookies.set("authToken", token, { sameSite: "lax" });
            localStorage.setItem("token", token);
        }
        
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
            
            // If user is an owner, fetch/create and store their franchise data
            if (user.user_type === 'owner') {
                await fetchOwnerFranchise();
            }
        }
       
        return { user, message: response.data?.message, token };

    } catch (error) {
        throw error;
    }
};

export const googleLogin = async ({ idToken, role, referral_code }) => {
    try {
        const response = await api.post("/user/google-login", {
            id_token: idToken,
            role,
            ...(referral_code ? { referral_code } : {}),
        });

        const token = response.data?.data?.token;
        if (token) {
            Cookies.set("authToken", token, { sameSite: "lax" });
            localStorage.setItem("token", token);
        }

        if (role === "owner") {
            const franchiseOne = response.data?.data?.franchiseOne;
            if (franchiseOne) {
                storeFranchiseData(franchiseOne);
            }

            const profileCompleted = response.data?.data?.profile_completed === true;
            localStorage.setItem("user", JSON.stringify({ user_type: "owner", role: "owner", profile_completed: profileCompleted }));
            return {
                token,
                franchiseOne,
                isSubscriptionActive: response.data?.data?.isSubscriptionActive,
                message: response.data?.message,
            };
        }

        const user = response.data?.data?.user;
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
        }

        return {
            token,
            user,
            message: response.data?.message,
        };
    } catch (error) {
        throw error;
    }
};


export const getPostLogoutRedirectPath = (userLike) => {
    const rawUserType = String(userLike?.user_type ?? "").toLowerCase();
    const rawRole = String(userLike?.role ?? userLike?.canonical_role?.code ?? "");
    const normalizedRole = rawRole.toUpperCase();

    // Super Admin
    if (rawUserType === "super_admin" || normalizedRole === "SUPER_ADMIN") {
        return "/super-admin/login";
    }

    // Customer
    if (rawUserType === "customer" || normalizedRole === "CUSTOMER" || rawRole.toLowerCase() === "customer") {
        return "/customer-auth";
    }

    // Business users (owner umbrella + sub-roles)
    const businessUserTypes = new Set(["owner", "dealer", "staff", "service_center"]);
    const businessRoles = new Set(["BUSINESS_OWNER", "OWNER", "DEALER", "STAFF", "SERVICE_CENTER"]);
    if (businessUserTypes.has(rawUserType) || businessRoles.has(normalizedRole) || businessRoles.has(rawRole)) {
        return "/login";
    }

    return "/";
};

export const logoutAndGetRedirect = () => {
    let user = {};
    try {
        user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
        user = {};
    }
    const redirectTo = getPostLogoutRedirectPath(user);
    logout();
    return redirectTo;
};

export const logout = () => {
    try {
        // Clear cookies
        Cookies.remove("authToken");
        Cookies.remove("franchiseId");
        Cookies.remove("role");
        Cookies.remove("email");
        
        // Clear localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("franchise");
        
        return { message: "Logged out successfully" };
    } catch (error) {
        throw error;
    }
}

export const changePassword = async (data) => {
    try {
        const response = await api.post("/user/change-password", data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Owner Login - authenticates owner with email/phone and password
 * Calls /api/owner/owner-log-in endpoint
 */
export const ownerLogin = async (data) => {
    try {
        const response = await api.post("/owner/owner-log-in", data);
        const token = response.data?.data?.token;
        const franchiseOne = response.data?.data?.franchiseOne;
        const isSubscriptionActive = response.data?.data?.isSubscriptionActive;
        
        if (token) {
            // Store token in both cookies and localStorage for consistency
            Cookies.set("authToken", token, { sameSite: "lax" });
            localStorage.setItem("token", token);
        }
        
        if (franchiseOne) {
            storeFranchiseData(franchiseOne);
        }
        
        // Store owner user type
        localStorage.setItem("user", JSON.stringify({ user_type: "owner" }));
        
        return { 
            token, 
            franchiseOne, 
            isSubscriptionActive,
            message: response.data?.message 
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Owner Signup - registers a new owner with company and franchise details
 * Requires OTP verification first via /user/generate-otp and /user/verify-otp
 * Then calls /api/owner/owner-sign-up endpoint
 */
export const ownerSignup = async (data) => {
    try {
        const response = await api.post("/owner/owner-sign-up", data);
        const token = response.data?.data?.token;
        const owner = response.data?.data?.owner;
        const franchise = response.data?.data?.franchise;
        
        if (token) {
            // Store token in both cookies and localStorage for consistency
            Cookies.set("authToken", token, { sameSite: "lax" });
            localStorage.setItem("token", token);
        }
        
        if (franchise) {
            storeFranchiseData(franchise);
        }
        
        // Full email/OTP signup collects all required fields; treat profile as complete for the console banner
        localStorage.setItem(
            "user",
            JSON.stringify({ user_type: "owner", role: "owner", ...owner, profile_completed: true })
        );
        
        return { 
            owner, 
            franchise, 
            token,
            message: response.data?.message 
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Staff Login - authenticates staff with email/phone and password
 * Calls /api/staff/staff-login endpoint
 * Staff are stored in the Staff table, separate from users
 */
export const staffLogin = async (data) => {
    try {
        const response = await api.post("/staff/staff-login", data);
        
        const token = response.data?.data?.token;
        const franchises = response.data?.data?.franchises;
        
        if (token) {
            console.log("Token received, storing...");
            // Store token in both cookies and localStorage for consistency
            // Use explicit cookie options for better compatibility
            Cookies.set("authToken", token, { 
                sameSite: "lax",
                expires: 7, // 7 days
                path: "/"
            });
            localStorage.setItem("token", token);
        } else {
            console.error("No token in response:", response.data);
        }
        
        if (franchises) {
            storeFranchiseData(franchises);
        }
        
        // Store staff user data including role_type from login response
        const staffProfile = response.data?.data?.staffProfile || {};
        const userData = {
            user_type: "staff",
            role: "staff",
            role_type: staffProfile.role_type || "Staff",
            staff_id: staffProfile.id || null,
            name: staffProfile.name || null,
            email: staffProfile.email || null,
            department: staffProfile.department || null,
            region: staffProfile.region || null,
            employee_id: staffProfile.employee_id || null,
            designation: staffProfile.designation || null,
            staff_status: staffProfile.staff_status || "ACTIVE",
        };
        localStorage.setItem("user", JSON.stringify(userData));

        // Also try to fetch full profile for any extra data
        try {
            const headers = { is_staff: "true" };
            if (franchises?.id) headers["franchise_id"] = franchises.id;
            const profileRes = await api.get("/staff/get-staff-profile", { headers });
            const fullProfile = profileRes?.data?.data || {};
            if (fullProfile?.role_type) {
                const mergedUser = {
                    ...userData,
                    role_type: fullProfile.role_type,
                    designation: fullProfile.designation || userData.designation,
                };
                localStorage.setItem("user", JSON.stringify(mergedUser));
            }
        } catch (profileError) {
            console.warn("Could not fetch staff profile at login:", profileError?.message);
        }
        
        return { 
            token, 
            franchises,
            message: response.data?.message 
        };
    } catch (error) {
        console.error("Staff login error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Service Center Login - authenticates service center with email/phone and password
 */
export const serviceCenterLogin = async (data) => {
  try {
    const response = await api.post("/service-center/service-center-login", data);

    const token = response.data?.data?.token;
    const franchise = response.data?.data?.franchise;
    const serviceCenter = response.data?.data?.serviceCenter;

    if (token) {
      Cookies.set("authToken", token, { sameSite: "lax", expires: 7, path: "/" });
      localStorage.setItem("token", token);
    }

    if (franchise) {
      storeFranchiseData(franchise);
    }

    const userData = {
      user_type: "service_center",
      role: "service_center",
      id: serviceCenter?.id,
      name: serviceCenter?.name,
      email: serviceCenter?.email,
      phone: serviceCenter?.phone,
      provider_id: serviceCenter?.provider_id,
    };
    localStorage.setItem("user", JSON.stringify(userData));

    return { token, franchise, serviceCenter, message: response.data?.message };
  } catch (error) {
    throw error;
  }
};

/**
 * Dealer Login - authenticates dealer with email/phone and password
 * Calls /api/dealer/dealer-login endpoint
 * Dealers are stored in the ProviderDealer table, separate from users
 */
export const dealerLogin = async (data) => {
    try {
        const response = await api.post("/dealer/dealer-login", data);
        
        const token = response.data?.data?.token;
        const franchise = response.data?.data?.franchise;
        const dealer = response.data?.data?.dealer;
        
        if (token) {
            console.log("Token received, storing...");
            // Store token in both cookies and localStorage for consistency
            Cookies.set("authToken", token, { 
                sameSite: "lax",
                expires: 7, // 7 days
                path: "/"
            });
            localStorage.setItem("token", token);
        } else {
            console.error("No token in response:", response.data);
        }
        
        if (franchise) {
            storeFranchiseData(franchise);
        }
        
        // Store dealer user type and info BEFORE returning
        const userData = { 
            user_type: "dealer", 
            role: "dealer",
            id: dealer?.id,
            name: dealer?.name,
            email: dealer?.email,
            provider_id: dealer?.provider_id,
            dealer_key: dealer?.dealer_key
        };
        localStorage.setItem("user", JSON.stringify(userData));
        
        return { 
            token, 
            franchise,
            dealer,
            message: response.data?.message 
        };
    } catch (error) {
        console.error("Dealer login error:", error.response?.data || error.message);
        throw error;
    }
};

// ─── Unified Login (check user, then OTP or password) ───

/**
 * Check if a user exists by email/phone. Returns { exists, user_type }.
 * Used to decide OTP flow (customer) vs password flow (owner/staff/dealer).
 */
export const checkUser = async (contact) => {
    const response = await api.post("/user/check-user", { contact: contact.trim() });
    return response.data?.data || response.data;
};

// ─── Unified Passwordless Auth ───

export const unifiedSendOtp = async (contact) => {
    const response = await api.post("/user/unified-send-otp", { contact });
    return response.data;
};

export const unifiedVerifyOtp = async (contact, otp) => {
    const response = await api.post("/user/unified-verify-otp", { contact, otp });
    const data = response.data?.data;

    if (data?.token) {
        Cookies.set("authToken", data.token, { sameSite: "lax", expires: 7, path: "/" });
        localStorage.setItem("token", data.token);
    }

    if (data?.franchise) {
        storeFranchiseData(data.franchise);
    }

    if (data?.role && data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
};

/**
 * Select Role - For multi-role users who need to choose which account to access
 * 
 * Real-world SaaS enhancement:
 * - Same identity may have multiple roles (Customer + Staff, etc.)
 * - This endpoint allows explicit role selection after detection
 * - Called after checkUser returns multipleRoles: true
 * 
 * @param {string} contact - Email or phone number
 * @param {string} selectedRole - The role user wants to login as
 */
/**
 * Super Admin Login - authenticates super admin with email and password
 * Uses dedicated /api/super-admin/login endpoint
 */
export const superAdminLogin = async (data) => {
  try {
    const response = await api.post("/super-admin/login", data);
    const payload = response.data?.data ?? response.data;
    const token = payload?.token;
    const user = payload?.user;

    if (token) {
      Cookies.set("authToken", token, { sameSite: "lax", expires: 7, path: "/" });
      localStorage.setItem("token", token);
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify({ user_type: "super_admin", role: "super_admin", ...user }));
    }

    return { token, user, message: response.data?.message };
  } catch (error) {
    throw error;
  }
};

export const selectRole = async (contact, selectedRole) => {
    const response = await api.post("/user/select-role", {
        contact: contact.trim(),
        selected_role: selectedRole,
    });
    const data = response.data?.data;

    if (data?.token) {
        Cookies.set("authToken", data.token, { sameSite: "lax", expires: 7, path: "/" });
        localStorage.setItem("token", data.token);
    }

    if (data?.franchise) {
        storeFranchiseData(data.franchise);
    }

    if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
};