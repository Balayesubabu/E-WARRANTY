import { StatusCodes } from 'http-status-codes';
import { returnError, returnResponse } from '../../../services/logger.js';
import { getProviderByUserId } from '../query.js';
import { WarrantyTemplateField, WarrantyTemplate } from '../../../prisma/db-models.js';

const withProvider = (handler) => async (req, res) => {
  try {
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, 'Provider not found');
    return await handler(req, res, provider.id);
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const deleteFieldEndpoint = withProvider(async (req, res, providerId) => {
  const { fieldId } = req.params;
  if (!fieldId) return returnError(res, StatusCodes.BAD_REQUEST, 'fieldId is required');
  const field = await WarrantyTemplateField.findUnique({ where: { id: fieldId }, include: { template: true } });
  if (!field || field.template.provider_id !== providerId) return returnError(res, StatusCodes.NOT_FOUND, 'Field not found');
  await WarrantyTemplateField.delete({ where: { id: fieldId } });
  return returnResponse(res, StatusCodes.OK, 'Field deleted');
});
