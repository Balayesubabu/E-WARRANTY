import api from "../utils/api";
import Cookies from "js-cookie";

/**
 * Get franchise ID from cookies or localStorage for consistency.
 * Checks cookies first (legacy), then falls back to localStorage.
 */
const getFranchiseIdFromStorage = () => {
    // Check cookies first
    const cookieFranchiseId = Cookies.get("franchiseId");
    if (cookieFranchiseId) return cookieFranchiseId;
    
    // Fallback to localStorage
    try {
        const franchise = JSON.parse(localStorage.getItem("franchise") || "null");
        return franchise?.id || null;
    } catch {
        return null;
    }
};

/** 
 * Build headers for dealer-related API calls.
 * Only adds is_dealer header when the logged-in user IS a dealer.
 * When Owner calls dealer management APIs, they use normal provider auth (no is_dealer header).
 */
const getDealerHeaders = () => {
    const franchiseId = getFranchiseIdFromStorage();
    const headers = {};
    
    // Only add is_dealer header if the current user is actually a dealer
    // When Owner manages dealers, they should use provider auth, not dealer auth
    try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user?.user_type === "dealer" || user?.role === "dealer") {
            headers.is_dealer = "true";
        }
    } catch {
        // ignore parse errors
    }
    
    if (franchiseId) headers["franchise_id"] = franchiseId;
    return headers;
};

// ============ DEALER MANAGEMENT ============

/**
 * Get all dealers for the provider
 * Backend: GET /dealer/
 */
export const getAllDealers = async () => {
    try {
        const response = await api.get("/dealer/", {
            headers: getDealerHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching dealers:", error);
        throw error;
    }
};

/**
 * Create a new dealer
 * Backend: POST /dealer/create-dealer
 */
export const createDealer = async (dealerData) => {
    try {
        const response = await api.post("/dealer/create-dealer", dealerData, {
            headers: getDealerHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error creating dealer:", error);
        throw error;
    }
};

/**
 * Update dealer details
 * Backend: PUT /dealer/:dealer_id
 */
export const updateDealer = async (dealerId, dealerData) => {
    try {
        const response = await api.put(`/dealer/${dealerId}`, dealerData, {
            headers: getDealerHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error updating dealer:", error);
        throw error;
    }
};

/**
 * Get dealer status
 * Backend: GET /dealer/status/:dealer_id
 */
export const getDealerStatus = async (dealerId) => {
    try {
        const response = await api.get(`/dealer/status/${dealerId}`, {
            headers: getDealerHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching dealer status:", error);
        throw error;
    }
};

/**
 * Deactivate dealer
 * Backend: POST /dealer/deactivate/:dealer_id
 */
export const deactivateDealer = async (dealerId) => {
    try {
        const response = await api.post(`/dealer/deactivate/${dealerId}`, {}, {
            headers: getDealerHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error deactivating dealer:", error);
        throw error;
    }
};

/**
 * Reactivate dealer
 * Backend: POST /dealer/reactivate/:dealer_id
 */
export const reactivateDealer = async (dealerId) => {
    try {
        const response = await api.post(`/dealer/reactivate/${dealerId}`, {}, {
            headers: getDealerHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error reactivating dealer:", error);
        throw error;
    }
};

// ============ WARRANTY CUSTOMERS (for dealer approval queue) ============

/**
 * Get all registered warranty customers (pending for approval)
 * Backend: GET /e-warranty/warranty-customer/get-registered-customers
 */
export const getRegisteredCustomers = async () => {
    try {
        const response = await api.get("/e-warranty/warranty-customer/get-registered-customers", {
            headers: getDealerHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching registered customers:", error);
        throw error;
    }
};

/**
 * Get active warranty customers
 * Backend: GET /e-warranty/warranty-customer/active-customers
 */
export const getActiveCustomers = async () => {
    try {
        const response = await api.get("/e-warranty/warranty-customer/active-customers", {
            headers: getDealerHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching active customers:", error);
        throw error;
    }
};

/**
 * Update pending customer to active (approve)
 * Backend: PUT /e-warranty/warranty-customer/update-pending-to-active
 */
export const approveCustomerWarranty = async (customerId, warrantyCode) => {
    try {
        const response = await api.put("/e-warranty/warranty-customer/update-pending-to-active", 
            { registered_customer_id: customerId, warranty_code: warrantyCode },
            { headers: getDealerHeaders() }
        );
        return response.data;
    } catch (error) {
        console.error("Error approving customer warranty:", error);
        throw error;
    }
};

/**
 * Update customer warranty (e.g., for rejection with reason)
 * Backend: PUT /e-warranty/warranty-customer/update-customer-warranty
 */
export const updateCustomerWarranty = async (customerData) => {
    try {
        const response = await api.put("/e-warranty/warranty-customer/update-customer-warranty", 
            customerData,
            { headers: getDealerHeaders() }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating customer warranty:", error);
        throw error;
    }
};

/**
 * Download customer warranty PDF
 * Backend: POST /e-warranty/warranty-customer/download-customer-pdf
 */
export const downloadCustomerPdf = async (customerId) => {
    try {
        const response = await api.post("/e-warranty/warranty-customer/download-customer-pdf", 
            { warranty_register_customer_id: customerId },
            { headers: getDealerHeaders() }
        );
        return response.data;
    } catch (error) {
        console.error("Error downloading customer PDF:", error);
        throw error;
    }
};

/**
 * Validate warranty/roll code
 * Backend: POST /e-warranty/warranty-customer/validate-roll-code
 */
export const validateWarrantyCode = async (warrantyCode) => {
    try {
        const response = await api.post("/e-warranty/warranty-customer/validate-roll-code", 
            { warranty_code: warrantyCode },
            { headers: getDealerHeaders() }
        );
        return response.data;
    } catch (error) {
        console.error("Error validating warranty code:", error);
        throw error;
    }
};

// ============ WARRANTY IMAGE UPLOAD ============

/**
 * Upload warranty images (invoice, product photos, etc.)
 * Backend: POST /e-warranty/warranty-customer/upload-warranty-image
 * @param {FormData} formData - FormData with 'warranty_images' files
 */
export const uploadWarrantyImage = async (formData) => {
    try {
        const response = await api.post("/e-warranty/warranty-customer/upload-warranty-image", formData, {
            headers: {
                ...getDealerHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading warranty image:", error);
        throw error;
    }
};

// ============ DEALER PROFILE MANAGEMENT ============

/**
 * Get dealer's own profile
 * Backend: GET /dealer/get-profile
 */
export const getDealerProfile = async () => {
    try {
        const response = await api.get("/dealer/get-profile", {
            headers: getDealerHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching dealer profile:", error);
        throw error;
    }
};

/**
 * Update dealer's own profile
 * Backend: PUT /dealer/update-profile
 */
export const updateDealerProfile = async (profileData) => {
    try {
        const response = await api.put("/dealer/update-profile", profileData, {
            headers: getDealerHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error updating dealer profile:", error);
        throw error;
    }
};

// ============ DEALER ACCOUNT MANAGEMENT ============

/**
 * Change dealer password (in-app, requires current password)
 * Backend: POST /dealer/change-password
 */
export const dealerChangePassword = async (oldPassword, newPassword) => {
    try {
        const response = await api.post("/dealer/change-password",
            { old_password: oldPassword, new_password: newPassword },
            { headers: getDealerHeaders() }
        );
        // Update token if returned
        const newToken = response.data?.data?.token;
        if (newToken) {
            Cookies.set("authToken", newToken, { expires: 7 });
            localStorage.setItem("token", newToken);
        }
        return response.data;
    } catch (error) {
        console.error("Error changing dealer password:", error);
        throw error;
    }
};

/** Returns franchise ID from cookie or localStorage. Used to gate dealer UI when missing. */
export const getFranchiseId = () => getFranchiseIdFromStorage();

// ============ DEALER ERP ============

export const getDealerDashboardStats = async () => {
    try {
        const response = await api.get("/dealer/erp/dashboard-stats", { headers: getDealerHeaders() });
        return response.data?.data || {};
    } catch (error) {
        console.error("Error fetching dealer dashboard stats:", error);
        throw error;
    }
};

export const getDealerPurchaseOrders = async () => {
    try {
        const response = await api.get("/dealer/erp/purchase-orders", { headers: getDealerHeaders() });
        return response.data?.data || [];
    } catch (error) {
        console.error("Error fetching purchase orders:", error);
        throw error;
    }
};

export const getDealerPurchaseOrderDetail = async (orderId) => {
    try {
        const response = await api.get(`/dealer/erp/purchase-orders/${orderId}`, { headers: getDealerHeaders() });
        return response.data?.data || null;
    } catch (error) {
        console.error("Error fetching purchase order detail:", error);
        throw error;
    }
};

export const getDealerSalesEntries = async () => {
    try {
        const response = await api.get("/dealer/erp/sales", { headers: getDealerHeaders() });
        return response.data?.data || [];
    } catch (error) {
        console.error("Error fetching sales entries:", error);
        throw error;
    }
};

export const createDealerSalesEntry = async (data) => {
    try {
        const response = await api.post("/dealer/erp/sales", data, { headers: getDealerHeaders() });
        return response.data?.data || null;
    } catch (error) {
        console.error("Error creating sales entry:", error);
        throw error;
    }
};

export const getDealerInventory = async () => {
    try {
        const response = await api.get("/dealer/erp/inventory", { headers: getDealerHeaders() });
        return response.data?.data || [];
    } catch (error) {
        console.error("Error fetching inventory:", error);
        throw error;
    }
};

export const getDealerLedger = async () => {
    try {
        const response = await api.get("/dealer/erp/ledger", { headers: getDealerHeaders() });
        return response.data?.data || { entries: [], summary: {} };
    } catch (error) {
        console.error("Error fetching ledger:", error);
        throw error;
    }
};

export const getDealerBusinessProfile = async () => {
    try {
        const response = await api.get("/dealer/erp/business-profile", { headers: getDealerHeaders() });
        return response.data?.data || {};
    } catch (error) {
        console.error("Error fetching business profile:", error);
        throw error;
    }
};

export const updateDealerBusinessProfile = async (data) => {
    try {
        const response = await api.put("/dealer/erp/business-profile", data, { headers: getDealerHeaders() });
        return response.data?.data || {};
    } catch (error) {
        console.error("Error updating business profile:", error);
        throw error;
    }
};

// ============ DEALER WARRANTY CLAIMS ============

/** Get all warranty claims for products assigned to this dealer */
export const getDealerWarrantyClaims = async () => {
    try {
        const response = await api.get("/dealer/erp/warranty-claims", { headers: getDealerHeaders() });
        return response.data?.data || [];
    } catch (error) {
        console.error("Error fetching dealer warranty claims:", error);
        throw error;
    }
};

/** Get warranty claim stats for this dealer */
export const getDealerWarrantyClaimStats = async () => {
    try {
        const response = await api.get("/dealer/erp/warranty-claims/stats", { headers: getDealerHeaders() });
        return response.data?.data || {};
    } catch (error) {
        console.error("Error fetching dealer warranty claim stats:", error);
        throw error;
    }
};

/** Get single warranty claim detail */
export const getDealerWarrantyClaimById = async (claimId) => {
    try {
        const response = await api.get(`/dealer/erp/warranty-claims/${claimId}`, { headers: getDealerHeaders() });
        return response.data?.data || null;
    } catch (error) {
        console.error("Error fetching warranty claim detail:", error);
        throw error;
    }
};

// ============ DEALER WARRANTY CODES ============

/** Get all warranty codes assigned to this dealer */
export const getDealerWarrantyCodes = async (options = {}) => {
    try {
        const params = new URLSearchParams();
        if (options.page) params.append("page", options.page);
        if (options.limit) params.append("limit", options.limit);
        if (options.status) params.append("status", options.status);
        if (options.search) params.append("search", options.search);
        if (options.sort_by) params.append("sort_by", options.sort_by);
        if (options.sort_order) params.append("sort_order", options.sort_order);
        
        const url = `/dealer/erp/warranty-codes${params.toString() ? `?${params.toString()}` : ""}`;
        const response = await api.get(url, { headers: getDealerHeaders() });
        return response.data?.data || { codes: [], pagination: {} };
    } catch (error) {
        console.error("Error fetching dealer warranty codes:", error);
        throw error;
    }
};

/** Get warranty code stats for this dealer */
export const getDealerWarrantyCodeStats = async () => {
    try {
        const response = await api.get("/dealer/erp/warranty-codes/stats", { headers: getDealerHeaders() });
        return response.data?.data || {};
    } catch (error) {
        console.error("Error fetching dealer warranty code stats:", error);
        throw error;
    }
};

/** Generate QR PDF for dealer warranty codes (with optional filters) */
export const generateDealerWarrantyQRPDF = async (options = {}) => {
    try {
        const response = await api.post("/dealer/erp/warranty-codes/generate-qr-pdf", {
            status: options.status || null,
            search: options.search || null,
            print_type: options.print_type || "A4",
        }, { headers: getDealerHeaders() });
        return response.data;
    } catch (error) {
        console.error("Error generating dealer warranty QR PDF:", error);
        throw error;
    }
};
