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

export const updateTemplateEndpoint = withProvider(async (req, res, providerId) => {
  const { id } = req.params;
  const { name, layout_type } = req.body;
  if (!id) return returnError(res, StatusCodes.BAD_REQUEST, 'Template id is required');
  const existing = await getTemplateById(id, providerId);
  if (!existing) return returnError(res, StatusCodes.NOT_FOUND, 'Template not found');
  const updated = await WarrantyTemplate.update({
    where: { id },
    data: { ...(name != null && { name }), ...(layout_type != null && { layout_type }) },
    include: { fields: { orderBy: { field_order: 'asc' } } },
  });
  return returnResponse(res, StatusCodes.OK, 'Template updated', updated);
});
