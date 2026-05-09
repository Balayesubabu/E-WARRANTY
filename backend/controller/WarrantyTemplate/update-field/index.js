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

export const updateFieldEndpoint = withProvider(async (req, res, providerId) => {
  const { fieldId } = req.params;
  const { name, label, field_type, required, section, field_order, options, placeholder } = req.body;
  if (!fieldId) return returnError(res, StatusCodes.BAD_REQUEST, 'fieldId is required');
  const field = await WarrantyTemplateField.findUnique({ where: { id: fieldId }, include: { template: true } });
  if (!field || field.template.provider_id !== providerId) return returnError(res, StatusCodes.NOT_FOUND, 'Field not found');
  const updated = await WarrantyTemplateField.update({
    where: { id: fieldId },
    data: {
      ...(name != null && { name }),
      ...(label != null && { label }),
      ...(field_type != null && { field_type }),
      ...(required != null && { required: Boolean(required) }),
      ...(section != null && { section }),
      ...(field_order != null && { field_order }),
      ...(options != null && { options }),
      ...(placeholder != null && { placeholder }),
    },
  });
  return returnResponse(res, StatusCodes.OK, 'Field updated', updated);
});
