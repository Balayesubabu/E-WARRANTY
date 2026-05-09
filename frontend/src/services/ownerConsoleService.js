import api from "../utils/api";

export const getOverview = async () => {
  const res = await api.get("/owner/console/overview");
  return res.data?.data || res.data;
};

export const getPurchaseOrders = async (params = {}) => {
  const res = await api.get("/owner/console/purchase-orders", { params });
  return res.data?.data || res.data;
};

export const getInventoryMovement = async (params = {}) => {
  const res = await api.get("/owner/console/inventory", { params });
  return res.data?.data || res.data;
};

export const getDealerLedger = async () => {
  const res = await api.get("/owner/console/dealer-ledger");
  return res.data?.data || res.data;
};

export const getPaymentRecords = async (params = {}) => {
  const res = await api.get("/owner/console/payments", { params });
  return res.data?.data || res.data;
};

export const getWarrantyRegistry = async (params = {}) => {
  const res = await api.get("/owner/console/warranty-registry", { params });
  return res.data?.data || res.data;
};

export const getProductMaster = async () => {
  const res = await api.get("/owner/console/product-master");
  return res.data?.data || res.data;
};
