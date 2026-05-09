import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { ProviderProductWarrantyCode } from "../../../prisma/db-models.js";

/**
 * GET /super-admin/warranty-codes
 * Global view: warranty codes across all providers, filter by provider, search, date range, read-only
 * Query: page, limit, provider_id, search, date_from, date_to
 */
const warrantyCodesEndpoint = async (req, res) => {
    try {
        const { page, limit, provider_id, search, date_from, date_to } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(5, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const where = { is_deleted: false };

        if (provider_id && typeof provider_id === "string") {
            where.provider_id = provider_id;
        }
        if (search && typeof search === "string") {
            const term = search.trim();
            if (term) {
                where.OR = [
                    { warranty_code: { contains: term, mode: "insensitive" } },
                    { product_name: { contains: term, mode: "insensitive" } },
                    { serial_no: { contains: term, mode: "insensitive" } },
                    { sequence_no: { contains: term, mode: "insensitive" } },
                ];
            }
        }
        if (date_from || date_to) {
            where.created_at = {};
            if (date_from) where.created_at.gte = new Date(date_from);
            if (date_to) {
                const d = new Date(date_to);
                d.setHours(23, 59, 59, 999);
                where.created_at.lte = d;
            }
        }

        const [codes, total] = await Promise.all([
            ProviderProductWarrantyCode.findMany({
                where,
                include: {
                    provider: {
                        select: {
                            id: true,
                            company_name: true,
                            user: { select: { email: true } },
                        },
                    },
                },
                orderBy: { created_at: "desc" },
                skip,
                take: limitNum,
            }),
            ProviderProductWarrantyCode.count({ where }),
        ]);

        return returnResponse(res, StatusCodes.OK, "Warranty codes retrieved", {
            codes,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        logger.error(`warrantyCodesEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch warranty codes");
    }
};

export default warrantyCodesEndpoint;
