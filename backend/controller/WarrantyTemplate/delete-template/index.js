import { StatusCodes } from 'http-status-codes';
import { returnError, returnResponse } from '../../../services/logger.js';
import { getProviderByUserId, getTemplateById } from '../query.js';
import { WarrantyTemplate } from '../../../prisma/db-models.js';

const withProvider = (handler) => async (req, res) => {
  try {
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, 'Provider not found');
    return await handler(req, res, provider.id);
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const deleteTemplateEndpoint = withProvider(async (req, res, providerId) => {
  const { id } = req.params;
  if (!id) return returnError(res, StatusCodes.BAD_REQUEST, 'Template id is required');
  const existing = await getTemplateById(id, providerId);
  if (!existing) return returnError(res, StatusCodes.NOT_FOUND, 'Template not found');
  await WarrantyTemplate.update({ where: { id }, data: { is_deleted: true } });
  return returnResponse(res, StatusCodes.OK, 'Template deleted');
});
