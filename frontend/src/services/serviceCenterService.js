import api from "../utils/api";

export const getServiceCenterClaims = async () => {
  const response = await api.get("/service-center/claims");
  return response.data;
};

export const getServiceCenterClaimStats = async () => {
  const response = await api.get("/service-center/claims/stats");
  return response.data;
};

export const getServiceCenterClaimById = async (id) => {
  const response = await api.get(`/service-center/claims/${id}`);
  return response.data;
};

export const updateServiceCenterClaimStatus = async (id, statusData) => {
  const response = await api.put(`/service-center/claims/${id}/status`, statusData);
  return response.data;
};

export const getServiceCenters = async () => {
  const response = await api.get("/service-center/list");
  return response.data;
};

export const createServiceCenter = async (data) => {
  const response = await api.post("/service-center/create", data);
  return response.data;
};

export const getServiceCenterProfile = async () => {
  const response = await api.get("/service-center/profile");
  return response.data;
};

export const updateServiceCenterProfile = async (data) => {
  const response = await api.put("/service-center/profile", data);
  return response.data;
};

export const changeServiceCenterPassword = async (old_password, new_password) => {
  const response = await api.put("/service-center/change-password", { old_password, new_password });
  return response.data;
};
