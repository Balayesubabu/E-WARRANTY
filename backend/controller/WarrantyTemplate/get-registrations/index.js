import { StatusCodes } from 'http-status-codes';
import { returnError, returnResponse } from '../../../services/logger.js';
import { getProviderByUserId } from '../query.js';
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

export const getRegistrationsEndpoint = withProvider(async (req, res, providerId) => {
  const { templateId, page = 1, limit = 20 } = req.query;
  const skip = (Math.max(1, parseInt(page) || 1) - 1) * (Math.min(100, parseInt(limit) || 20));
  const take = Math.min(100, parseInt(limit) || 20);
  const where = { provider_id: providerId };
  if (templateId) where.template_id = templateId;
  const [items, total] = await Promise.all([
    WarrantyRegistration.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take,
      include: { template: { select: { id: true, name: true } } },
    }),
    WarrantyRegistration.count({ where }),
  ]);
  return returnResponse(res, StatusCodes.OK, 'Registrations fetched', {
    items,
    total,
    page: parseInt(page) || 1,
    limit: take,
  });
});
