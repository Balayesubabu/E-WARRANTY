import { Provider, WarrantyTemplateCategory, WarrantyTemplate, WarrantyTemplateField, WarrantyRegistration } from '../../prisma/db-models.js';

export const getProviderByUserId = async (userId) => Provider.findFirst({ where: { user_id: userId } });

export const getCategories = async () => {
  return WarrantyTemplateCategory.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' },
  });
};

export const getTemplatesByCategory = async (categoryId, providerId) => {
  return WarrantyTemplate.findMany({
    where: { category_id: categoryId, provider_id: providerId, is_deleted: false },
    orderBy: { name: 'asc' },
  });
};

export const getAllTemplatesForProvider = async (providerId) => {
  return WarrantyTemplate.findMany({
    where: { provider_id: providerId, is_deleted: false },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  });
};

export const getTemplateById = async (id, providerId) => {
  return WarrantyTemplate.findFirst({
    where: { id, provider_id: providerId, is_deleted: false },
  });
};

export const getTemplateWithFields = async (id, providerId) => {
  return WarrantyTemplate.findFirst({
    where: { id, provider_id: providerId, is_deleted: false },
    include: { fields: { orderBy: { field_order: 'asc' } } },
  });
};
