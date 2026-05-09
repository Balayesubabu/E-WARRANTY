import api from "../utils/api";

// ─── Product Master ───────────────────────────────────────────

export const getProducts = async () => {
  const res = await api.get("/owner/products");
  return res.data?.data || res.data;
};

export const getProductById = async (id) => {
  const res = await api.get(`/owner/products/${id}`);
  return res.data?.data || res.data;
};

export const createProduct = async (data) => {
  const res = await api.post("/owner/products", data);
  return res.data?.data || res.data;
};

export const updateProduct = async (id, data) => {
  const res = await api.put(`/owner/products/${id}`, data);
  return res.data?.data || res.data;
};

export const deleteProduct = async (id) => {
  const res = await api.delete(`/owner/products/${id}`);
  return res.data;
};

export const getProductStats = async (id) => {
  const res = await api.get(`/owner/products/${id}/stats`);
  return res.data?.data || res.data;
};

export const toggleProductActive = async (id, isActive) => {
  const res = await api.put(`/owner/products/${id}`, { is_active: isActive });
  return res.data?.data || res.data;
};

// ─── Warranty Policies ────────────────────────────────────────

export const getPolicies = async (productId) => {
  const params = productId ? { product_id: productId } : {};
  const res = await api.get("/owner/policies", { params });
  return res.data?.data || res.data;
};

export const getPolicyById = async (id) => {
  const res = await api.get(`/owner/policies/${id}`);
  return res.data?.data || res.data;
};

export const createPolicy = async (data) => {
  const res = await api.post("/owner/policies", data);
  return res.data?.data || res.data;
};

export const updatePolicy = async (id, data) => {
  const res = await api.put(`/owner/policies/${id}`, data);
  return res.data?.data || res.data;
};

export const deletePolicy = async (id) => {
  const res = await api.delete(`/owner/policies/${id}`);
  return res.data;
};

// ─── Warranty Batches ─────────────────────────────────────────

export const getBatches = async () => {
  const res = await api.get("/owner/batches");
  return res.data?.data || res.data;
};

export const getBatchById = async (id) => {
  const res = await api.get(`/owner/batches/${id}`);
  return res.data?.data || res.data;
};

export const createBatch = async (data) => {
  const res = await api.post("/owner/batches", data);
  return res.data?.data || res.data;
};
