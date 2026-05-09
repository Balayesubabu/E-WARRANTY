import api from "../utils/api";

/**
 * Owner Customer Service
 * All endpoints use verifyLoginToken — the api interceptor in api.js
 * automatically sets Authorization and franchise_id headers for providers.
 */

export const getCustomerSummary = async () => {
  const res = await api.get("/owner/customers/summary");
  return res.data?.data || res.data;
};

export const getCustomerList = async (params = {}) => {
  const res = await api.get("/owner/customers/list", { params });
  return res.data?.data || res.data;
};

export const getCustomerDetail = async (customerId) => {
  const res = await api.get(`/owner/customers/${customerId}`);
  return res.data?.data || res.data;
};

export const toggleCustomerStatus = async (customerId, isActive) => {
  const res = await api.patch(`/owner/customers/${customerId}/status`, {
    is_active: isActive,
  });
  return res.data?.data || res.data;
};

export const updateCustomerNotes = async (customerId, notes) => {
  const res = await api.post(`/owner/customers/${customerId}/notes`, { notes });
  return res.data?.data || res.data;
};

export const getDealersForFilter = async () => {
  const res = await api.get("/owner/customers/dealers");
  return res.data?.data?.dealers || [];
};

/**
 * Owner registers a warranty for a customer (direct, no dealer).
 * Customer can then log in with phone/email (OTP) and see the warranty.
 */
export const registerWarrantyForCustomer = async (data) => {
  const res = await api.post("/owner/customers/register-warranty", data);
  return res.data?.data || res.data;
};
