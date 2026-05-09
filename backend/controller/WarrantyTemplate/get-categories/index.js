import { StatusCodes } from 'http-status-codes';
import { returnError, returnResponse } from '../../../services/logger.js';
import { getProviderByUserId, getCategories } from '../query.js';

const withProvider = (handler) => async (req, res) => {
  try {
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, 'Provider not found');
    return await handler(req, res, provider.id);
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const getCategoriesEndpoint = withProvider(async (req, res) => {
  const categories = await getCategories();
  return returnResponse(res, StatusCodes.OK, 'Categories fetched', categories);
});
