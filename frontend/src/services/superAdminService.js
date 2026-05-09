import api from "../utils/api";
import Cookies from "js-cookie";

const BASE = "/super-admin";

export const superAdminLogin = async (email, password) => {
    const response = await api.post(`${BASE}/login`, { email, password });
    return response.data;
};

export const getDashboardStats = async () => {
    const response = await api.get(`${BASE}/dashboard-stats`);
    return response.data?.data ?? response.data;
};

/**
 * Get warranty registrations chart data (daily counts for last N days)
 * @param {number} [days=30] - Number of days
 */
export const getWarrantyRegistrationsChart = async (days = 30) => {
    const response = await api.get(`${BASE}/warranty-registrations-chart`, { params: { days } });
    return response.data?.data ?? response.data;
};

export const getProviders = async (params = {}) => {
    const response = await api.get(`${BASE}/providers`, { params });
    return response.data?.data ?? response.data;
};

/**
 * Get provider detail with dealers, staff, customers, service centers
 * @param {string} providerId - Provider ID
 */
export const getProviderDetail = async (providerId) => {
    const response = await api.get(`${BASE}/providers/${providerId}/detail`);
    return response.data?.data ?? response.data;
};

/**
 * Deactivate a dealer under a provider
 */
export const deactivateDealer = async (providerId, dealerId, reason = "") => {
    const response = await api.put(`${BASE}/providers/${providerId}/dealers/${dealerId}/deactivate`, { reason });
    return response.data;
};

/**
 * Activate a dealer under a provider
 */
export const activateDealer = async (providerId, dealerId) => {
    const response = await api.put(`${BASE}/providers/${providerId}/dealers/${dealerId}/activate`);
    return response.data;
};

/**
 * Deactivate a staff member under a provider
 * @param {string} providerId - Provider ID
 * @param {string} staffId - Staff ID
 * @param {string} reason - Required reason (min 10 chars, sent to staff)
 */
export const deactivateStaff = async (providerId, staffId, reason) => {
    const response = await api.put(`${BASE}/providers/${providerId}/staff/${staffId}/deactivate`, { reason });
    return response.data;
};

/**
 * Activate a staff member under a provider
 */
export const activateStaff = async (providerId, staffId) => {
    const response = await api.put(`${BASE}/providers/${providerId}/staff/${staffId}/activate`);
    return response.data;
};

/**
 * Deactivate a service center under a provider
 * @param {string} providerId - Provider ID
 * @param {string} serviceCenterId - Service center ID
 * @param {string} [reason] - Optional reason (included in email to service center and owner)
 */
export const deactivateServiceCenter = async (providerId, serviceCenterId, reason = "") => {
    const response = await api.put(`${BASE}/providers/${providerId}/service-centers/${serviceCenterId}/deactivate`, {
        reason: reason.trim() || undefined,
    });
    return response.data;
};

/**
 * Activate a service center under a provider
 */
export const activateServiceCenter = async (providerId, serviceCenterId) => {
    const response = await api.put(`${BASE}/providers/${providerId}/service-centers/${serviceCenterId}/activate`);
    return response.data;
};

export const blockProvider = async (providerId, reason = "") => {
    const response = await api.put(`${BASE}/providers/${providerId}/block`, { reason });
    return response.data;
};

export const unblockProvider = async (providerId) => {
    const response = await api.put(`${BASE}/providers/${providerId}/unblock`);
    return response.data;
};

/**
 * Get provider coin balance and transaction history
 * @param {string} providerId - Provider ID
 * @param {Object} params - Optional: page, limit, type (CREDIT|DEBIT), dateFrom, dateTo (ISO strings)
 */
export const getProviderCoins = async (providerId, params = {}) => {
    const response = await api.get(`${BASE}/providers/${providerId}/coins`, { params });
    return response.data?.data ?? response.data;
};

export const addCoins = async (providerId, amount, reason) => {
    const response = await api.post(`${BASE}/providers/${providerId}/coins/add`, { amount, reason });
    return response.data;
};

export const deductCoins = async (providerId, amount, reason) => {
    const response = await api.post(`${BASE}/providers/${providerId}/coins/deduct`, { amount, reason });
    return response.data;
};

/**
 * Get global coin pricing (packages, action costs, base rate)
 */
export const getCoinPricing = async () => {
    const response = await api.get(`${BASE}/coin-pricing`);
    return response.data?.data ?? response.data;
};

/**
 * Update global coin pricing (packages and/or action costs)
 * @param {Object} payload - { packages: [...], actionCosts: [...] }
 */
export const updateCoinPricing = async (payload) => {
    const response = await api.put(`${BASE}/coin-pricing`, payload);
    return response.data;
};

/**
 * Get Super Admin notifications (new signups, block/unblock, coin changes, low/zero balances)
 */
export const getNotifications = async (params = {}) => {
    const response = await api.get(`${BASE}/notifications`, { params });
    return response.data?.data ?? response.data;
};

/**
 * Global search across providers, dealers, warranties, customers, claims
 * @param {string} q - Search query
 */
export const globalSearch = async (q) => {
    const response = await api.get(`${BASE}/search`, { params: { q } });
    return response.data?.data ?? response.data;
};

/**
 * Get warranty codes (global view, read-only)
 * @param {Object} params - page, limit, provider_id, search
 */
export const getWarrantyCodes = async (params = {}) => {
    const response = await api.get(`${BASE}/warranty-codes`, { params });
    return response.data?.data ?? response.data;
};

/**
 * Export warranty codes to CSV (blob download)
 * @param {Object} params - provider_id, search, date_from, date_to
 */
export const exportWarrantyCodes = async (params = {}) => {
    const response = await api.get(`${BASE}/warranty-codes/export`, {
        params,
        responseType: "blob",
    });
    return response.data;
};

/**
 * Get registered warranties (global view)
 * @param {Object} params - page, limit, provider_id, search, date_from, date_to
 */
export const getWarrantyRegistrations = async (params = {}) => {
    const response = await api.get(`${BASE}/warranty-registrations`, { params });
    return response.data?.data ?? response.data;
};

/**
 * Export registered warranties to CSV (blob download)
 * @param {Object} params - provider_id, search, date_from, date_to
 */
export const exportWarrantyRegistrations = async (params = {}) => {
    const response = await api.get(`${BASE}/warranty-registrations/export`, {
        params,
        responseType: "blob",
    });
    return response.data;
};

/**
 * Get platform activity logs (audit trail)
 * @param {Object} params - page, limit, action, entity_type, provider_id, dateFrom, dateTo
 */
export const getActivityLogs = async (params = {}) => {
    const response = await api.get(`${BASE}/activity-logs`, { params });
    return response.data?.data ?? response.data;
};

/**
 * Change Super Admin password
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 */
export const changePassword = async (oldPassword, newPassword) => {
    const response = await api.post(`${BASE}/change-password`, {
        old_password: oldPassword,
        new_password: newPassword,
    });
    const data = response.data?.data ?? response.data;
    const newToken = data?.token;
    if (newToken) {
        Cookies.set("authToken", newToken, { sameSite: "lax", expires: 7, path: "/" });
        localStorage.setItem("token", newToken);
    }
    return response.data;
};
