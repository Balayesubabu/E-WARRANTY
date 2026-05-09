import { StatusCodes } from 'http-status-codes';
import { returnError, returnResponse } from '../../../services/logger.js';
import { getProviderByUserId, getTemplatesByCategory } from '../query.js';

const withProvider = (handler) => async (req, res) => {
  try {
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, 'Provider not found');
    return await handler(req, res, provider.id);
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const getTemplatesEndpoint = withProvider(async (req, res, providerId) => {
  const { categoryId } = req.query;
  if (!categoryId) return returnError(res, StatusCodes.BAD_REQUEST, 'categoryId is required');
  const templates = await getTemplatesByCategory(categoryId, providerId);
  return returnResponse(res, StatusCodes.OK, 'Templates fetched', templates);
});
