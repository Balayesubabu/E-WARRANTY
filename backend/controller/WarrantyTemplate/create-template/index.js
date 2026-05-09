import { StatusCodes } from 'http-status-codes';
import { returnError, returnResponse } from '../../../services/logger.js';
import { getProviderByUserId } from '../query.js';
import { WarrantyTemplate, WarrantyTemplateField } from '../../../prisma/db-models.js';

const withProvider = (handler) => async (req, res) => {
  try {
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, 'Provider not found');
    return await handler(req, res, provider.id);
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const createTemplateEndpoint = withProvider(async (req, res, providerId) => {
  const { category_id, name, layout_type = 'simple', fields = [] } = req.body;
  if (!category_id || !name) return returnError(res, StatusCodes.BAD_REQUEST, 'category_id and name are required');
  const template = await WarrantyTemplate.create({
    data: {
      category_id,
      provider_id: providerId,
      name,
      layout_type: layout_type || 'simple',
    },
  });
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    await WarrantyTemplateField.create({
      data: {
        template_id: template.id,
        name: f.name || `field_${i}`,
        label: f.label || f.name || `Field ${i + 1}`,
        field_type: f.field_type || 'text',
        required: Boolean(f.required),
        section: f.section || 'default',
        field_order: f.field_order ?? i,
        options: f.options || null,
        placeholder: f.placeholder || null,
      },
    });
  }
  const withFields = await WarrantyTemplate.findFirst({
    where: { id: template.id },
    include: { fields: { orderBy: { field_order: 'asc' } } },
  });
  return returnResponse(res, StatusCodes.CREATED, 'Template created', withFields);
});
