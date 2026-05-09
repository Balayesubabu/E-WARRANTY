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
 * Build headers for staff-related API calls.
 * Only adds is_staff header when the logged-in user IS a staff member.
 * When Owner calls staff management APIs, they use normal provider auth (no is_staff header).
 */
const getStaffHeaders = () => {
    const franchiseId = getFranchiseIdFromStorage();
    const headers = {};
    
    // Only add is_staff header if the current user is actually a staff member
    // When Owner manages staff, they should use provider auth, not staff auth
    try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user?.user_type === "staff" || user?.role === "staff") {
            headers.is_staff = "true";
        }
    } catch {
        // ignore parse errors
    }
    
    if (franchiseId) headers["franchise_id"] = franchiseId;
    return headers;
};

export const createStaff = async (staffData) => {
    try {
        const response = await api.post("/staff/create-staff", staffData, {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error creating staff:", error);
        throw error;
    }
};

export const getAllStaffDetails = async () => {
    try {
        const response = await api.get("/staff/get-all-staff-details", {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching staff:", error);
        throw error;
    }
};

export const updateStaff = async (staffId, staffData) => {
    try {
        const response = await api.put(`/staff/update-staff/${staffId}`, staffData, {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error updating staff:", error);
        throw error;
    }
};

export const updateStaffRole = async (staffId, staffRoleId) => {
    try {
        const response = await api.put(
            `/staff/update-staff-role/${staffId}`,
            { staff_role_id: staffRoleId },
            { headers: getStaffHeaders() }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating staff role:", error);
        throw error;
    }
};

export const getStaffDetails = async (staffId) => {
    try {
        const response = await api.get(`/staff/get-staff-details/${staffId}`, {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching staff details:", error);
        throw error;
    }
};

/** Returns franchise ID from cookie or localStorage. Used to gate staff UI when missing. */
export const getFranchiseId = () => getFranchiseIdFromStorage();

// ============ STAFF ERP (Enhanced) ============

export const getAllStaffEnhanced = async () => {
    try {
        const response = await api.get("/staff/erp/all", { headers: getStaffHeaders() });
        return response.data?.data || [];
    } catch (error) {
        console.error("Error fetching enhanced staff list:", error);
        throw error;
    }
};

export const getStaffDetailErp = async (staffId) => {
    try {
        const response = await api.get(`/staff/erp/detail/${staffId}`, { headers: getStaffHeaders() });
        return response.data?.data || null;
    } catch (error) {
        console.error("Error fetching staff detail:", error);
        throw error;
    }
};

export const assignDealersToStaff = async (staffId, dealerIds) => {
    try {
        const response = await api.post(`/staff/erp/assign-dealers/${staffId}`, { dealer_ids: dealerIds }, { headers: getStaffHeaders() });
        return response.data;
    } catch (error) {
        console.error("Error assigning dealers:", error);
        throw error;
    }
};

export const getDealersForAssignment = async () => {
    try {
        const response = await api.get("/staff/erp/dealers-for-assignment", { headers: getStaffHeaders() });
        return response.data?.data || [];
    } catch (error) {
        console.error("Error fetching dealers for assignment:", error);
        throw error;
    }
};

export const getStaffRoleDashboard = async () => {
    try {
        const response = await api.get("/staff/erp/role-dashboard", { headers: getStaffHeaders() });
        return response.data?.data || {};
    } catch (error) {
        console.error("Error fetching role dashboard:", error);
        throw error;
    }
};

/**
 * Change staff password (requires current password)
 * Backend: POST /staff/change-password
 */
export const staffChangePassword = async (oldPassword, newPassword) => {
    try {
        const response = await api.post("/staff/change-password", {
            old_password: oldPassword,
            new_password: newPassword,
        }, {
            headers: getStaffHeaders(),
        });
        
        // If a new token is returned, update it
        const newToken = response.data?.data?.token;
        if (newToken) {
            const Cookies = (await import('js-cookie')).default;
            Cookies.set("authToken", newToken, { sameSite: "lax", expires: 7, path: "/" });
            localStorage.setItem("token", newToken);
        }
        
        return response.data;
    } catch (error) {
        console.error("Error changing staff password:", error);
        throw error;
    }
};

// ============ STAFF PROFILE ============

export const getStaffProfile = async () => {
    try {
        const response = await api.get("/staff/get-staff-profile", {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching staff profile:", error);
        throw error;
    }
};

export const updateStaffProfile = async (staffId, profileData) => {
    try {
        const response = await api.put(`/staff/update-staff/${staffId}`, profileData, {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error updating staff profile:", error);
        throw error;
    }
};

// ============ SUPPORT TICKETS ============

/**
 * Get all support tickets
 * Backend: GET /franchise/supportTicket/getAll
 */
export const getAllSupportTickets = async () => {
    try {
        const response = await api.get("/franchise/supportTicket/getAll", {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching support tickets:", error);
        throw error;
    }
};

/**
 * Get a specific support ticket
 * Backend: GET /franchise/supportTicket/get/:supportTicket_id
 */
export const getSupportTicket = async (ticketId) => {
    try {
        const response = await api.get(`/franchise/supportTicket/get/${ticketId}`, {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching support ticket:", error);
        throw error;
    }
};

/**
 * Update a support ticket
 * Backend: POST /franchise/supportTicket/update
 */
export const updateSupportTicket = async (ticketData) => {
    try {
        const response = await api.post("/franchise/supportTicket/update", ticketData, {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error updating support ticket:", error);
        throw error;
    }
};

/**
 * Create a support ticket
 * Backend: POST /franchise/supportTicket/create
 */
export const createSupportTicket = async (ticketData) => {
    try {
        const response = await api.post("/franchise/supportTicket/create", ticketData, {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error creating support ticket:", error);
        throw error;
    }
};

// ============ WARRANTY CUSTOMERS ============

/**
 * Get all registered warranty customers
 * Backend: GET /e-warranty/warranty-customer/get-registered-customers
 */
export const getRegisteredCustomers = async () => {
    try {
        const response = await api.get("/e-warranty/warranty-customer/get-registered-customers", {
            headers: getStaffHeaders(),
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
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching active customers:", error);
        throw error;
    }
};

/**
 * Update pending customer to active
 * Backend: PUT /e-warranty/warranty-customer/update-pending-to-active
 */
export const updatePendingToActive = async (customerId, warrantyCode) => {
    try {
        const response = await api.put("/e-warranty/warranty-customer/update-pending-to-active", 
            { registered_customer_id: customerId, warranty_code: warrantyCode },
            { headers: getStaffHeaders() }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating customer status:", error);
        throw error;
    }
};

/**
 * Update customer warranty details
 * Backend: PUT /e-warranty/warranty-customer/update-customer-warranty
 */
export const updateCustomerWarranty = async (customerData) => {
    try {
        const response = await api.put("/e-warranty/warranty-customer/update-customer-warranty", 
            customerData,
            { headers: getStaffHeaders() }
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
            { headers: getStaffHeaders() }
        );
        return response.data;
    } catch (error) {
        console.error("Error downloading customer PDF:", error);
        throw error;
    }
};

// ============ MODULES & PERMISSIONS ============

/**
 * Get all modules with their sub-modules
 * Uses the Module table seeded with Sales, Purchase, E Warranty, etc.
 */
export const getModules = async () => {
    try {
        const response = await api.get("/staff/staff-role/modules", {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching modules:", error);
        throw error;
    }
};

/**
 * Get staff role permissions for a specific staff member
 * Backend: GET /staff/staff-role/get/:staff_id
 */
export const getStaffPermissions = async (staffId) => {
    try {
        const response = await api.get(`/staff/staff-role/get/${staffId}`, {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching staff permissions:", error);
        throw error;
    }
};

/**
 * Create staff role with permissions
 * Backend: POST /staff/staff-role/create
 * @param {Object} data - { name, description, sub_module_ids_permissions: [{ module_id, sub_module_id?, access_type }] }
 */
export const createStaffRolePermission = async (data) => {
    try {
        const response = await api.post("/staff/staff-role/create", data, {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error creating staff role permission:", error);
        throw error;
    }
};

/**
 * Update staff role permissions
 * Backend: PUT /staff/staff-role/update/:staff_role_id
 * @param {string} staffRoleId
 * @param {Object} data - { name, description, sub_module_ids_permissions }
 */
export const updateStaffRolePermission = async (staffRoleId, data) => {
    try {
        const response = await api.put(`/staff/staff-role/update/${staffRoleId}`, data, {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error updating staff role permission:", error);
        throw error;
    }
};

// ============ SUPPORT TICKET HISTORY ============

/**
 * Get support ticket history/conversation
 * Backend: GET /franchise/supportTicket/get/:supportTicket_id
 */
export const getSupportTicketHistory = async (ticketId) => {
    try {
        const response = await api.get(`/franchise/supportTicket/get/${ticketId}`, {
            headers: getStaffHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching ticket history:", error);
        throw error;
    }
};
