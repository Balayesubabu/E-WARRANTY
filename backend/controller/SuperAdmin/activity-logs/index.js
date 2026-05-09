import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { PlatformActivityLog } from "../../../prisma/db-models.js";

const ACTION_LABELS = {
    provider_blocked: "Provider Blocked",
    provider_unblocked: "Provider Unblocked",
    coins_added: "Coins Added",
    coins_deducted: "Coins Deducted",
    coins_purchased: "Coins Purchased (Razorpay)",
    dealer_activated: "Dealer Activated",
    dealer_deactivated: "Dealer Deactivated",
    staff_activated: "Staff Activated",
    staff_deactivated: "Staff Deactivated",
    service_center_activated: "Service Center Activated",
    service_center_deactivated: "Service Center Deactivated",
    coin_pricing_updated: "Coin Pricing Updated",
};

/**
 * GET /super-admin/activity-logs
 * Query: page, limit, action, actions (comma-separated), entity_type, provider_id, dateFrom (ISO), dateTo (ISO)
 */
const getActivityLogsEndpoint = async (req, res) => {
    try {
        const { page, limit, action, actions, entity_type, provider_id, dateFrom, dateTo } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(5, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const where = {}; // Platform-wide: all actors

        if (actions && typeof actions === "string") {
            const list = actions.split(",").map((a) => a.trim()).filter(Boolean);
            if (list.length > 0) where.action = { in: list };
        } else if (action && typeof action === "string") {
            where.action = action;
        }
        if (entity_type && typeof entity_type === "string") {
            where.target_entity_type = entity_type;
        }
        if (provider_id && typeof provider_id === "string") {
            where.provider_id = provider_id;
        }
        if (dateFrom || dateTo) {
            where.created_at = {};
            if (dateFrom) {
                const d = new Date(dateFrom);
                if (!isNaN(d.getTime())) where.created_at.gte = d;
            }
            if (dateTo) {
                const d = new Date(dateTo);
                if (!isNaN(d.getTime())) {
                    d.setHours(23, 59, 59, 999);
                    where.created_at.lte = d;
                }
            }
        }

        const [logs, total] = await Promise.all([
            PlatformActivityLog.findMany({
                where,
                orderBy: { created_at: "desc" },
                skip,
                take: limitNum,
            }),
            PlatformActivityLog.count({ where }),
        ]);

        const enriched = logs.map((log) => ({
            id: log.id,
            action: log.action,
            action_label: ACTION_LABELS[log.action] || log.action,
            actor_role: log.actor_role,
            actor_id: log.actor_id,
            actor_name: log.actor_name,
            entity_type: log.target_entity_type,
            entity_id: log.target_entity_id,
            provider_id: log.provider_id,
            target_name: log.target_name,
            details: log.details,
            created_at: log.created_at,
        }));

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const [todayCount, weekCount] = await Promise.all([
            PlatformActivityLog.count({
                where: {
                    ...where,
                    created_at: { gte: today },
                },
            }),
            PlatformActivityLog.count({
                where: {
                    ...where,
                    created_at: { gte: weekAgo },
                },
            }),
        ]);

        return returnResponse(res, StatusCodes.OK, "Activity logs retrieved", {
            logs: enriched,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
            stats: {
                today: todayCount,
                thisWeek: weekCount,
                total,
            },
        });
    } catch (error) {
        logger.error(`getActivityLogsEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch activity logs");
    }
};

export { getActivityLogsEndpoint };
