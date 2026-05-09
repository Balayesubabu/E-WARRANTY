import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
    Provider,
    ProviderDealer,
    Staff,
    ProviderWarrantyCustomer,
    ProviderProductWarrantyCode,
    WarrantyClaim,
} from "../../../prisma/db-models.js";

/**
 * GET /super-admin/search?q=...
 * Global search: providers, dealers, warranties, customers, claims
 * Returns grouped results by entity type
 */
const searchEndpoint = async (req, res) => {
    try {
        const q = (req.query.q || "").trim();
        const limit = Math.min(10, Math.max(3, parseInt(req.query.limit, 10) || 5));

        if (!q || q.length < 2) {
            return returnResponse(res, StatusCodes.OK, "Search results", {
                providers: [],
                dealers: [],
                staff: [],
                customers: [],
                warrantyCodes: [],
                claims: [],
            });
        }

        const [providers, dealers, staff, customers, warrantyCodes, claims] = await Promise.all([
            Provider.findMany({
                where: {
                    is_deleted: false,
                    OR: [
                        { company_name: { contains: q, mode: "insensitive" } },
                        { user: { email: { contains: q, mode: "insensitive" } } },
                        { user: { phone_number: { contains: q } } },
                    ],
                },
                select: {
                    id: true,
                    company_name: true,
                    user: { select: { email: true } },
                },
                take: limit,
            }),
            ProviderDealer.findMany({
                where: {
                    is_deleted: false,
                    OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { email: { contains: q, mode: "insensitive" } },
                        { phone_number: { contains: q } },
                    ],
                },
                include: { provider: { select: { id: true, company_name: true } } },
                take: limit,
            }),
            Staff.findMany({
                where: {
                    is_deleted: false,
                    OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { email: { contains: q, mode: "insensitive" } },
                        { phone: { contains: q } },
                    ],
                },
                include: { provider: { select: { id: true, company_name: true } } },
                take: limit,
            }),
            ProviderWarrantyCustomer.findMany({
                where: {
                    is_deleted: false,
                    OR: [
                        { first_name: { contains: q, mode: "insensitive" } },
                        { last_name: { contains: q, mode: "insensitive" } },
                        { email: { contains: q, mode: "insensitive" } },
                        { phone: { contains: q } },
                        { warranty_code: { contains: q } },
                    ],
                },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone: true,
                    warranty_code: true,
                    provider_id: true,
                    provider: { select: { id: true, company_name: true } },
                },
                take: limit,
            }),
            ProviderProductWarrantyCode.findMany({
                where: {
                    is_deleted: false,
                    OR: [
                        { warranty_code: { contains: q, mode: "insensitive" } },
                        { product_name: { contains: q, mode: "insensitive" } },
                        { serial_no: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: {
                    id: true,
                    warranty_code: true,
                    product_name: true,
                    warranty_code_status: true,
                    provider_id: true,
                    provider: { select: { id: true, company_name: true } },
                },
                take: limit,
            }),
            WarrantyClaim.findMany({
                where: {
                    is_active: true,
                    OR: [
                        { warranty_code: { contains: q, mode: "insensitive" } },
                        { issue_description: { contains: q, mode: "insensitive" } },
                        { customer_name: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: {
                    id: true,
                    warranty_code: true,
                    status: true,
                    issue_description: true,
                    customer_name: true,
                    warranty_customer: {
                        select: {
                            warranty_code: true,
                            provider_id: true,
                            provider: { select: { id: true, company_name: true } },
                        },
                    },
                },
                take: limit,
            }),
        ]);

        return returnResponse(res, StatusCodes.OK, "Search results", {
            providers,
            dealers,
            staff,
            customers,
            warrantyCodes,
            claims,
        });
    } catch (error) {
        logger.error(`searchEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Search failed");
    }
};

export default searchEndpoint;
