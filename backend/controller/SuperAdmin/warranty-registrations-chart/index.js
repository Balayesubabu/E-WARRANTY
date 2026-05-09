import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { ProviderWarrantyCustomer } from "../../../prisma/db-models.js";

/** Format date as YYYY-MM-DD (local) for consistent grouping */
const toDateStr = (d) => {
    const x = new Date(d);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

/**
 * GET /super-admin/warranty-registrations-chart
 * Query: days (default 30) - last N days of daily warranty registration counts
 * Returns: { data: [{ date, count, label }], ... }
 */
const warrantyRegistrationsChartEndpoint = async (req, res) => {
    try {
        const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 30));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        const records = await ProviderWarrantyCustomer.findMany({
            where: {
                is_deleted: false,
                created_at: { gte: startDate },
            },
            select: { created_at: true },
        });

        const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const byDate = {};

        for (const r of records) {
            const dateStr = toDateStr(r.created_at);
            byDate[dateStr] = (byDate[dateStr] || 0) + 1;
        }

        const data = Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateStr, count]) => ({
                date: dateStr,
                count,
                label: dayLabels[new Date(dateStr + "T12:00:00").getDay()],
            }));

        return returnResponse(res, StatusCodes.OK, "Warranty registrations chart data", {
            data,
            days,
        });
    } catch (error) {
        logger.error(`warrantyRegistrationsChartEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch chart data");
    }
};

export default warrantyRegistrationsChartEndpoint;
