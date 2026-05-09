import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { Provider } from "../../../prisma/db-models.js";
import { sendEmail } from "../../../services/email.js";
import { getBalance, creditCoins, debitCoins, getTransactionHistory } from "../../../services/coinService.js";
import { logSuperAdminAction } from "../../../services/super-admin-activity-service.js";

/**
 * GET /super-admin/providers/:id/coins
 * Get provider coin balance and transaction history with pagination and filters
 * Query: page, limit, type (CREDIT|DEBIT), dateFrom (ISO), dateTo (ISO)
 */
const getProviderCoinsEndpoint = async (req, res) => {
    try {
        const { id } = req.params;
        const { page, limit, type, dateFrom, dateTo } = req.query;

        const provider = await Provider.findUnique({ where: { id } });
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        const balance = await getBalance(id);

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(5, parseInt(limit, 10) || 20));
        const typeFilter = type === "CREDIT" || type === "DEBIT" ? type : null;
        const dateFromVal = dateFrom ? new Date(dateFrom) : null;
        const dateToVal = dateTo ? new Date(dateTo) : null;

        const result = await getTransactionHistory(id, {
            page: pageNum,
            limit: limitNum,
            type: typeFilter,
            dateFrom: dateFromVal,
            dateTo: dateToVal,
        });

        return returnResponse(res, StatusCodes.OK, "Coin balance", {
            balance: balance.balance,
            total_earned: balance.total_earned,
            total_spent: balance.total_spent,
            transactions: result.transactions,
            pagination: result.pagination,
        });
    } catch (error) {
        logger.error(`getProviderCoinsEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch coin balance");
    }
};

/**
 * POST /super-admin/providers/:id/coins/add
 * Add coins to provider (ADMIN_CREDIT)
 */
const addCoinsEndpoint = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, reason } = req.body;
        const provider = await Provider.findUnique({
            where: { id },
            include: { user: { select: { email: true, first_name: true } } },
        });
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        const amt = Math.max(1, parseInt(amount, 10) || 0);
        if (amt <= 0) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Amount must be a positive number");
        }
        const desc = (reason || "Admin credit").trim() || "Admin credit";
        const result = await creditCoins(id, amt, "ADMIN_CREDIT", desc, {
            reference_type: "super_admin",
            reference_id: req.user_id,
        });
        logger.info(`Super Admin ${req.user_id} added ${amt} coins to provider ${id}`);

        logSuperAdminAction({
            super_admin_id: req.user_id,
            action: "coins_added",
            entity_type: "provider",
            entity_id: id,
            provider_id: id,
            target_name: provider.company_name,
            details: { amount: amt, reason: desc, new_balance: result.new_balance },
            ip_address: req.ip || req.headers["x-forwarded-for"],
        }).catch(() => {});

        const ownerEmail = provider.user?.email;
        if (ownerEmail) {
            const subject = "Coins added to your E-Warrantify account";
            const body = `Dear ${provider.user?.first_name || "Owner"},

${amt} coins have been added to your E-Warrantify account (${provider.company_name || "your organization"}).

Reason: ${desc}
New balance: ${result.new_balance} coins

You can use these coins to generate warranty codes and other platform features.

Best regards,
E-Warrantify Team`;
            sendEmail(ownerEmail, subject, body).catch((err) =>
                logger.error(`Failed to send add-coins notification: ${err?.message || err}`)
            );
        }

        return returnResponse(res, StatusCodes.OK, "Coins added", {
            new_balance: result.new_balance,
            amount_added: amt,
        });
    } catch (error) {
        logger.error(`addCoinsEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error?.message || "Failed to add coins");
    }
};

/**
 * POST /super-admin/providers/:id/coins/deduct
 * Deduct coins from provider (ADMIN_DEBIT)
 */
const deductCoinsEndpoint = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, reason } = req.body;
        const provider = await Provider.findUnique({
            where: { id },
            include: { user: { select: { email: true, first_name: true } } },
        });
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        const amt = Math.max(1, parseInt(amount, 10) || 0);
        if (amt <= 0) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Amount must be a positive number");
        }
        const desc = (reason || "Admin debit").trim() || "Admin debit";
        const result = await debitCoins(id, amt, "ADMIN_DEBIT", desc, {
            reference_type: "super_admin",
            reference_id: req.user_id,
        });
        logger.info(`Super Admin ${req.user_id} deducted ${amt} coins from provider ${id}`);

        logSuperAdminAction({
            super_admin_id: req.user_id,
            action: "coins_deducted",
            entity_type: "provider",
            entity_id: id,
            provider_id: id,
            target_name: provider.company_name,
            details: { amount: amt, reason: desc, new_balance: result.new_balance },
            ip_address: req.ip || req.headers["x-forwarded-for"],
        }).catch(() => {});

        const ownerEmail = provider.user?.email;
        if (ownerEmail) {
            const subject = "Coins deducted from your E-Warrantify account";
            const body = `Dear ${provider.user?.first_name || "Owner"},

${amt} coins have been deducted from your E-Warrantify account (${provider.company_name || "your organization"}).

Reason: ${desc}
New balance: ${result.new_balance} coins

If you believe this was done in error, please contact our support team.

Best regards,
E-Warrantify Team`;
            sendEmail(ownerEmail, subject, body).catch((err) =>
                logger.error(`Failed to send deduct-coins notification: ${err?.message || err}`)
            );
        }

        return returnResponse(res, StatusCodes.OK, "Coins deducted", {
            new_balance: result.new_balance,
            amount_deducted: amt,
        });
    } catch (error) {
        logger.error(`deductCoinsEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error?.message || "Failed to deduct coins");
    }
};

export { getProviderCoinsEndpoint, addCoinsEndpoint, deductCoinsEndpoint };
