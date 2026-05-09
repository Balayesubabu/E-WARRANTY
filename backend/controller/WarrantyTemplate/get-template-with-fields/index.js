import { StatusCodes } from 'http-status-codes';
import { returnError, returnResponse } from '../../../services/logger.js';
import { getProviderByUserId, getTemplateWithFields } from '../query.js';

const withProvider = (handler) => async (req, res) => {
  try {
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, 'Provider not found');
    return await handler(req, res, provider.id);
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const getTemplateWithFieldsEndpoint = withProvider(async (req, res, providerId) => {
  const { id } = req.params;
  if (!id) return returnError(res, StatusCodes.BAD_REQUEST, 'Template id is required');
  const template = await getTemplateWithFields(id, providerId);
  if (!template) return returnError(res, StatusCodes.NOT_FOUND, 'Template not found');
  return returnResponse(res, StatusCodes.OK, 'Template fetched', template);
});
