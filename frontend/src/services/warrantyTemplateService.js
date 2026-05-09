import api from '../utils/api';

const BASE = '/owner/warranty-template';

export const getCategories = () => api.get(`${BASE}/categories`).then((r) => r.data?.data ?? []);

export const getTemplates = (categoryId) =>
  api.get(`${BASE}/templates`, { params: { categoryId } }).then((r) => r.data?.data ?? []);

export const getAllTemplates = () => api.get(`${BASE}/templates-all`).then((r) => r.data?.data ?? []);

export const initializeDefaults = () => api.post(`${BASE}/initialize-defaults`).then((r) => r.data?.data ?? []);

export const getTemplateWithFields = (id) =>
  api.get(`${BASE}/templates/${id}`).then((r) => r.data?.data);

export const createTemplate = (body) => api.post(`${BASE}/templates`, body).then((r) => r.data?.data);

export const updateTemplate = (id, body) => api.put(`${BASE}/templates/${id}`, body).then((r) => r.data?.data);

export const deleteTemplate = (id) => api.delete(`${BASE}/templates/${id}`);

export const createField = (templateId, body) =>
  api.post(`${BASE}/templates/${templateId}/fields`, body).then((r) => r.data?.data);

export const updateField = (fieldId, body) =>
  api.put(`${BASE}/fields/${fieldId}`, body).then((r) => r.data?.data);

export const deleteField = (fieldId) => api.delete(`${BASE}/fields/${fieldId}`);

export const registerWarranty = (templateId, data) =>
  api.post(`${BASE}/register`, { template_id: templateId, data }).then((r) => r.data?.data);

export const getRegistrations = (params) =>
  api.get(`${BASE}/registrations`, { params }).then((r) => r.data?.data ?? { items: [], total: 0 });
