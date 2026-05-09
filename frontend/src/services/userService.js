import api from '../utils/api';
import Cookies from 'js-cookie';

/**
 * Get franchise ID from cookies or localStorage for staff API calls
 */
const getFranchiseIdFromStorage = () => {
    const cookieFranchiseId = Cookies.get("franchiseId");
    if (cookieFranchiseId) return cookieFranchiseId;
    
    try {
        const franchise = JSON.parse(localStorage.getItem("franchise") || "null");
        return franchise?.id || null;
    } catch {
        return null;
    }
};

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
        return {};
    }
};

const isOwnerOrProvider = (user) => {
    const userType = user?.user_type || user?.role;
    return userType === "owner" || userType === "provider";
};

export const getUserDetails = async () => {
    try {
        // Check token in both localStorage and cookies
        const localToken = localStorage.getItem("token");
        const cookieToken = Cookies.get("authToken");
        const token = localToken || cookieToken;
        
        if (!token) {
            throw new Error("No authentication token found");
        }

        // Check if user is staff or dealer from localStorage
        const storedUser = getStoredUser();
        const isStaff = storedUser.user_type === "staff" || storedUser.role === "staff";
        const isDealer = storedUser.user_type === "dealer" || storedUser.role === "dealer";
        const isCustomer = storedUser.user_type === "customer" || storedUser.role === "customer";

        if (isStaff) {
            // Staff users - call staff profile endpoint
            // Headers are automatically added by api.js interceptor but we add them explicitly as well
            const franchiseId = getFranchiseIdFromStorage();
            const headers = {
                is_staff: "true"  // Required by backend verifyToken middleware
            };
            if (franchiseId) {
                headers["franchise_id"] = franchiseId;
            }
            
            const response = await api.get("/staff/get-staff-profile", { headers });
            
            if (response.data && response.data.data) {
                const staffData = response.data.data;
                const mergedUser = {
                    ...storedUser,
                    user_type: "staff",
                    role: "staff",
                    role_type: staffData.role_type || storedUser.role_type || null,
                    designation: staffData.designation || storedUser.designation || null,
                };
                localStorage.setItem("user", JSON.stringify(mergedUser));
                // Transform staff data to match expected user format
                return {
                    id: staffData.id,
                    fullname: staffData.name,
                    email: staffData.email,
                    phone_number: staffData.phone,
                    role: "staff",
                    user_type: "staff",
                    designation: staffData.designation,
                    role_type: staffData.role_type,
                    address: staffData.address,
                    companyname: "N/A",
                    ...staffData
                };
            } else {
                throw new Error("Invalid response format");
            }
        } else if (isDealer) {
            // Dealer users - fetch profile from backend API
            try {
                const headers = { is_dealer: "true" };
                const franchiseId = getFranchiseIdFromStorage();
                if (franchiseId) headers["franchise_id"] = franchiseId;
                
                const response = await api.get("/dealer/get-profile", { headers });
                const dealerData = response?.data?.data || {};
                
                // Update localStorage with fresh data
                const updatedUser = { ...storedUser, ...dealerData, user_type: "dealer", role: "dealer" };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                
                return {
                    id: dealerData.id || storedUser.id,
                    fullname: dealerData.name || storedUser.name || storedUser.fullname,
                    email: dealerData.email || storedUser.email,
                    phone_number: dealerData.phone_number || storedUser.phone_number,
                    role: "dealer",
                    user_type: "dealer",
                    provider_id: dealerData.provider_id || storedUser.provider_id,
                    companyname: "Dealer",
                    address: dealerData.address,
                    city: dealerData.city,
                    state: dealerData.state,
                    country: dealerData.country,
                    ...dealerData
                };
            } catch (apiError) {
                console.warn("Failed to fetch dealer profile from API, falling back to localStorage:", apiError);
                return {
                    id: storedUser.id,
                    fullname: storedUser.name || storedUser.fullname,
                    email: storedUser.email,
                    phone_number: storedUser.phone_number,
                    role: "dealer",
                    user_type: "dealer",
                    provider_id: storedUser.provider_id,
                    companyname: "Dealer",
                    ...storedUser
                };
            }
        } else if (isOwnerOrProvider(storedUser)) {
            // Owner/provider users - use provider profile endpoint
            const response = await api.get("/provider/");
            const provider = response?.data?.data?.provider;
            const providerUser = provider?.user || {};

            if (!provider) {
                throw new Error("Invalid provider response format");
            }

            // If the user has a provider record, they are definitively an owner.
            // Never use providerUser.user_type here — it can be stale/incorrect.
            const ownerRole = "owner";

            const personalAddress = providerUser.address ?? null;
            const companyAddr = provider.company_address ?? null;
            return {
                id: providerUser.id || provider.user_id || storedUser.id,
                fullname:
                    [providerUser.first_name, providerUser.last_name].filter(Boolean).join(" ") ||
                    storedUser.fullname ||
                    provider.company_name ||
                    "Owner",
                companyname: provider.company_name || storedUser.companyname || "N/A",
                email: providerUser.email || storedUser.email || null,
                role: ownerRole,
                user_type: ownerRole,
                phone: providerUser.phone_number || storedUser.phone || storedUser.phone_number || null,
                phone_number: providerUser.phone_number || storedUser.phone_number || storedUser.phone || null,
                personal_address: personalAddress,
                company_address: companyAddr,
                address: personalAddress || companyAddr || storedUser.address || null,
                gstin: provider.gst_number || storedUser.gstin || null,
                provider_id: provider.id || storedUser.provider_id || null,
                profile_completed: providerUser.profile_completed === true || storedUser.profile_completed === true,
            };
        } else if (isCustomer) {
            // Customer users
            const response = await api.get("/user/get-user");

            if (response.data && response.data.data?.user) {
                return response.data.data.user;
            }
            throw new Error("Invalid response format");
        } else {
            // If role cannot be determined, avoid calling role-restricted endpoints.
            throw new Error("Unable to determine account type. Please login again.");
        }
    } catch (error) {
        console.error("Error fetching user details:", error);
        if (error.response) {
            // Server responded with error
            throw new Error(error.response.data?.message || "Failed to fetch user details");
        } else if (error.request) {
            // Request made but no response
            throw new Error("Network error. Please check your connection.");
        } else {
            // Something else happened
            throw error;
        }
    }
};

export const updateUserDetails = async (userData) => {
    try {
        const token = Cookies.get("authToken");
        if (!token) {
            throw new Error("No authentication token found");
        }

        const storedUser = getStoredUser();

        if (isOwnerOrProvider(storedUser)) {
            const payload = {
                company_name: userData?.companyname,
                company_address: userData?.company_address ?? userData?.address,
                gst_number: userData?.gstin,
                first_name: userData?.first_name,
                last_name: userData?.last_name,
                phone_number: userData?.phone_number ?? userData?.phone,
                fullname: userData?.fullname,
                personal_address: userData?.personal_address,
                country_code: userData?.country_code,
            };
            const response = await api.put("/provider/update-provider", payload);
            const provider = response?.data?.data || {};
            return {
                ...userData,
                companyname: provider.company_name || userData?.companyname,
                address: userData?.company_address ?? userData?.address ?? provider.company_address,
                gstin: provider.gst_number || userData?.gstin,
                role: storedUser.role || storedUser.user_type || "owner",
                user_type: storedUser.user_type || storedUser.role || "owner",
                profile_completed: true,
            };
        }

        const response = await api.put("/user/update-user-details", userData);
        if (response.data && response.data.data?.user) {
            return response.data.data.user;
        }
        throw new Error("Invalid response format");
    } catch (error) {
        console.error("Error updating user details:", error);
        if (error.response) {
            // Server responded with error
            throw new Error(error.response.data?.message || "Failed to update user details");
        } else if (error.request) {
            // Request made but no response
            throw new Error("Network error. Please check your connection.");
        } else {
            // Something else happened
            throw error;
        }
    }
};

export const updateEmail = async (userData) => {
    try {
        const token = Cookies.get("authToken");
        if (!token) {
            throw new Error("No authentication token found");
        }

        const storedUser = getStoredUser();
        if (isOwnerOrProvider(storedUser)) {
            throw new Error("Email update is currently available only for customer accounts.");
        }

        const response = await api.put("/user/update-email", userData);
        if (response.data?.data?.user) {
            return response.data.data.user;
        } else if (response.data?.data?.email) {
            return { email: response.data.data.email };
        } else {
            throw new Error("Invalid response format");
        }
    } catch (error) {
        console.error("Error updating email:", error);
        if (error.response) {
            throw new Error(error.response.data?.message || "Failed to update email");
        } else if (error.request) {
            throw new Error("Network error. Please check your connection.");
        } else {
            throw error;
        }
    }
};