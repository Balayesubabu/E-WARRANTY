import { StatusCodes } from 'http-status-codes';
import { returnError, returnResponse } from '../../../services/logger.js';
import { getProviderByUserId, getTemplateById } from '../query.js';
import { WarrantyTemplateField } from '../../../prisma/db-models.js';

const withProvider = (handler) => async (req, res) => {
  try {
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, 'Provider not found');
    return await handler(req, res, provider.id);
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const createFieldEndpoint = withProvider(async (req, res, providerId) => {
  const { templateId } = req.params;
  const body = req.body || {};
  const name = body.name;
  const label = body.label || name;
  const field_type = body.field_type || 'text';
  const required = Boolean(body.required);
  const section = body.section || 'default';
  const field_order = body.field_order ?? 0;
  const options = body.options || null;
  const placeholder = body.placeholder || null;
  if (!templateId || !name) return returnError(res, StatusCodes.BAD_REQUEST, 'templateId and name are required');
  const template = await getTemplateById(templateId, providerId);
  if (!template) return returnError(res, StatusCodes.NOT_FOUND, 'Template not found');
  const field = await WarrantyTemplateField.create({
    data: {
      template_id: templateId,
      name,
      label,
      field_type,
      required,
      section,
      field_order,
      options,
      placeholder,
    },
  });
  return returnResponse(res, StatusCodes.CREATED, 'Field created', field);
});
