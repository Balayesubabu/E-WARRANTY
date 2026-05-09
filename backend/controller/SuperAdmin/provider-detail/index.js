import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
    Provider,
    ProviderDealer,
    Staff,
    ProviderWarrantyCustomer,
    ServiceCenter,
} from "../../../prisma/db-models.js";
import { countUniqueCustomers } from "../../../utils/uniqueCustomerCount.js";

/**
 * GET /super-admin/providers/:id/detail
 * Provider hierarchy: dealers, staff, customers, service centers under this owner
 */
const providerDetailEndpoint = async (req, res) => {
    try {
        const providerId = req.params.id;
        if (!providerId) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID is required");
        }

        const provider = await Provider.findFirst({
            where: { id: providerId, is_deleted: false },
            include: {
                user: { select: { id: true, email: true, first_name: true, last_name: true } },
                coin_balance: { select: { balance: true } },
            },
        });

        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }

        const [dealers, staff, customers, serviceCenters, uniqueCustomerCount] = await Promise.all([
            ProviderDealer.findMany({
                where: { provider_id: providerId, is_deleted: false },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone_number: true,
                    status: true,
                    is_active: true,
                    created_at: true,
                },
                orderBy: { created_at: "desc" },
            }),
            Staff.findMany({
                where: { provider_id: providerId, is_deleted: false },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    designation: true,
                    staff_status: true,
                    is_active: true,
                    last_login: true,
                    created_at: true,
                },
                orderBy: { created_at: "desc" },
            }),
            ProviderWarrantyCustomer.findMany({
                where: { provider_id: providerId, is_deleted: false },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone: true,
                    product_name: true,
                    warranty_code: true,
                    created_at: true,
                },
                orderBy: { created_at: "desc" },
            }),
            ServiceCenter.findMany({
                where: { provider_id: providerId, is_deleted: false },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    is_active: true,
                    created_at: true,
                },
                orderBy: { created_at: "desc" },
            }),
            countUniqueCustomers(providerId),
        ]);

        const result = {
            provider: {
                id: provider.id,
                company_name: provider.company_name,
                company_address: provider.company_address,
                is_blocked: provider.is_blocked,
                is_active: provider.is_active,
                email: provider.user?.email,
                user_name: [provider.user?.first_name, provider.user?.last_name].filter(Boolean).join(" ") || null,
                coin_balance: provider.coin_balance?.balance ?? 0,
                created_at: provider.created_at,
            },
            dealers,
            staff,
            customers,
            serviceCenters,
            counts: {
                dealers: dealers.length,
                staff: staff.length,
                customers: uniqueCustomerCount,
                serviceCenters: serviceCenters.length,
            },
        };

        return returnResponse(res, StatusCodes.OK, "Provider detail", result);
    } catch (error) {
        logger.error(`providerDetailEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch provider detail");
    }
};

export default providerDetailEndpoint;
