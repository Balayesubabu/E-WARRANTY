import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { PlatformActivityLog, Provider, ProviderCoinBalance } from "../../../prisma/db-models.js";

const LOW_COIN_THRESHOLD = 20;
const DAYS_LOOKBACK = 7;

/**
 * GET /super-admin/notifications
 * Returns high-level Super Admin notifications: new signups, block/unblock, coin changes, low/zero balances
 */
const notificationsEndpoint = async (req, res) => {
    try {
        const limit = Math.min(50, Math.max(10, parseInt(req.query.limit, 10) || 20));

        const since = new Date();
        since.setDate(since.getDate() - DAYS_LOOKBACK);

        const [activityLogs, recentProviders, lowBalanceProviders, zeroBalanceProviders] = await Promise.all([
            PlatformActivityLog.findMany({
                where: {
                    action: {
                        in: ["provider_blocked", "provider_unblocked", "coins_added", "coins_deducted", "coins_purchased"],
                    },
                    created_at: { gte: since },
                },
                orderBy: { created_at: "desc" },
                take: 30,
            }),
            Provider.findMany({
                where: {
                    is_deleted: false,
                    created_at: { gte: since },
                },
                select: { id: true, company_name: true, created_at: true },
                orderBy: { created_at: "desc" },
                take: 15,
            }),
            ProviderCoinBalance.findMany({
                where: {
                    balance: { gt: 0, lte: LOW_COIN_THRESHOLD },
                    provider: { is_deleted: false },
                },
                select: {
                    provider_id: true,
                    balance: true,
                    provider: { select: { id: true, company_name: true } },
                },
            }),
            ProviderCoinBalance.findMany({
                where: {
                    balance: 0,
                    provider: { is_deleted: false },
                },
                select: {
                    provider_id: true,
                    provider: { select: { id: true, company_name: true } },
                },
            }),
        ]);

        const notifications = [];

        activityLogs.forEach((log) => {
            const name = log.target_name || log.actor_name || "Unknown";
            const providerId = log.provider_id;
            let title = "";
            let type = "activity";
            if (log.action === "provider_blocked") {
                title = "Provider blocked";
                type = "blocked";
            } else if (log.action === "provider_unblocked") {
                title = "Provider unblocked";
                type = "unblocked";
            } else if (log.action === "coins_added") {
                const amt = log.details?.amount;
                title = amt != null ? `${amt} coins added` : "Coins added";
                type = "coins";
            } else if (log.action === "coins_deducted") {
                const amt = log.details?.amount;
                title = amt != null ? `${amt} coins deducted` : "Coins deducted";
                type = "coins";
            } else if (log.action === "coins_purchased") {
                const amt = log.details?.amount;
                title = amt != null ? `${name} purchased ${amt} coins` : "Provider purchased coins";
                type = "coins";
            } else return;
            notifications.push({
                id: log.id,
                type,
                title,
                message: `${name}`,
                timestamp: log.created_at,
                provider_id: providerId,
            });
        });

        recentProviders.forEach((p) => {
            const dateStr = p.created_at ? new Date(p.created_at).toLocaleDateString() : "";
            notifications.push({
                id: `new-provider-${p.id}`,
                type: "new_signup",
                title: `New provider: ${p.company_name}`,
                message: dateStr ? `Signed up on ${dateStr}` : "",
                timestamp: p.created_at,
                provider_id: p.id,
            });
        });

        lowBalanceProviders.forEach((b) => {
            const name = b.provider?.company_name || "Provider";
            notifications.push({
                id: `low-coins-${b.provider_id}`,
                type: "low_coins",
                title: "Provider low on coins",
                message: `${name} (${b.balance} coins left)`,
                timestamp: new Date(),
                provider_id: b.provider_id,
            });
        });

        zeroBalanceProviders.forEach((b) => {
            const name = b.provider?.company_name || "Provider";
            notifications.push({
                id: `zero-coins-${b.provider_id}`,
                type: "zero_coins",
                title: "Provider has zero coins",
                message: name,
                timestamp: new Date(),
                provider_id: b.provider_id,
            });
        });

        notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const limited = notifications.slice(0, limit);

        return returnResponse(res, StatusCodes.OK, "Notifications", {
            notifications: limited,
            total: notifications.length,
        });
    } catch (error) {
        logger.error(`notificationsEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch notifications");
    }
};

export default notificationsEndpoint;
