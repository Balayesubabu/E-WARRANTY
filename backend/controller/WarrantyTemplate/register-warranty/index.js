import { StatusCodes } from 'http-status-codes';
import { returnError, returnResponse } from '../../../services/logger.js';
import { getProviderByUserId, getTemplateWithFields } from '../query.js';
import { WarrantyRegistration } from '../../../prisma/db-models.js';

const withProvider = (handler) => async (req, res) => {
  try {
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, 'Provider not found');
    return await handler(req, res, provider.id);
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const registerWarrantyEndpoint = withProvider(async (req, res, providerId) => {
  const { template_id, data } = req.body;
  if (!template_id || !data || typeof data !== 'object') {
    return returnError(res, StatusCodes.BAD_REQUEST, 'template_id and data are required');
  }
  const template = await getTemplateWithFields(template_id, providerId);
  if (!template) return returnError(res, StatusCodes.NOT_FOUND, 'Template not found');
  const required = template.fields.filter((f) => f.required);
  for (const f of required) {
    const val = data[f.name];
    if (val === undefined || val === null || val === '') {
      return returnError(res, StatusCodes.BAD_REQUEST, 'Field ' + (f.label || f.name) + ' is required');
    }
  }
  const reg = await WarrantyRegistration.create({
    data: {
      template_id,
      provider_id: providerId,
      created_by_id: req.user_id,
      data,
    },
  });
  return returnResponse(res, StatusCodes.CREATED, 'Warranty registered', reg);
});
