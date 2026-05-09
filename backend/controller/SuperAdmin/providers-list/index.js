import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { Provider } from "../../../prisma/db-models.js";
import { countUniqueCustomers } from "../../../utils/uniqueCustomerCount.js";

/**
 * GET /super-admin/providers
 * List all providers with optional search. Includes coin balance.
 * customers_count = unique customers (one person with multiple products = 1).
 */
const providersListEndpoint = async (req, res) => {
    try {
        const search = (req.query.search || "").trim().toLowerCase();
        const status = req.query.status; // 'active' | 'blocked' | 'all'

        const where = { is_deleted: false };

        if (search) {
            where.OR = [
                { company_name: { contains: search, mode: "insensitive" } },
                { company_address: { contains: search, mode: "insensitive" } },
                { user: { email: { contains: search, mode: "insensitive" } } },
            ];
        }

        if (status === "active") where.is_blocked = false;
        else if (status === "blocked") where.is_blocked = true;

        const providers = await Provider.findMany({
            where,
            include: {
                user: { select: { id: true, email: true, first_name: true, last_name: true } },
                coin_balance: { select: { balance: true } },
                _count: {
                    select: {
                        ProviderDealer: true,
                        Staff: true,
                        ServiceCenter: true,
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });

        const uniqueCustomerCounts = await Promise.all(
            providers.map((p) => countUniqueCustomers(p.id))
        );

        const list = providers.map((p, idx) => ({
            id: p.id,
            company_name: p.company_name,
            company_address: p.company_address,
            created_at: p.created_at,
            is_blocked: p.is_blocked,
            is_active: p.is_active,
            email: p.user?.email,
            user_name: [p.user?.first_name, p.user?.last_name].filter(Boolean).join(" ") || null,
            coin_balance: p.coin_balance?.balance ?? 0,
            dealers_count: p._count?.ProviderDealer ?? 0,
            staff_count: p._count?.Staff ?? 0,
            customers_count: uniqueCustomerCounts[idx] ?? 0,
            service_centers_count: p._count?.ServiceCenter ?? 0,
        }));

        return returnResponse(res, StatusCodes.OK, "Providers list", { providers: list });
    } catch (error) {
        logger.error(`providersListEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch providers");
    }
};

export default providersListEndpoint;
