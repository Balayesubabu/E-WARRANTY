import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
    Provider,
    ProviderWarrantyCustomer,
    ProviderProductWarrantyCode,
    ProviderDealer,
    Staff,
    WarrantyClaim,
    CoinTransaction,
    CoinPackage,
} from "../../../prisma/db-models.js";
import { countUniqueCustomersGlobally } from "../../../utils/uniqueCustomerCount.js";

const RUPEES_PER_COIN = parseFloat(process.env.RUPEES_PER_COIN || "9.3");

/**
 * GET /super-admin/dashboard-stats
 * Platform overview: providers, dealers, staff, customers, warranties, codes, claims,
 * revenue, coins sold/used, week-over-week deltas
 */
const dashboardStatsEndpoint = async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        const lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        const [
            totalProviders,
            activeProviders,
            blockedProviders,
            totalDealers,
            totalStaff,
            totalCustomers,
            totalWarranties,
            totalWarrantyCodes,
            totalClaims,
            codesThisWeek,
            codesLastWeek,
            warrantiesThisWeek,
            warrantiesLastWeek,
            claimsThisWeek,
            claimsLastWeek,
            creditTxForRevenue,
            coinsSoldAgg,
            coinsUsedAgg,
        ] = await Promise.all([
            Provider.count({ where: { is_deleted: false } }),
            Provider.count({ where: { is_deleted: false, is_blocked: false } }),
            Provider.count({ where: { is_deleted: false, is_blocked: true } }),
            ProviderDealer.count({ where: { is_deleted: false } }),
            Staff.count({ where: { is_deleted: false } }),
            countUniqueCustomersGlobally(),
            ProviderWarrantyCustomer.count({ where: { is_deleted: false } }),
            ProviderProductWarrantyCode.count({ where: { is_deleted: false } }),
            WarrantyClaim.count(),
            ProviderProductWarrantyCode.count({ where: { is_deleted: false, created_at: { gte: weekStart } } }),
            ProviderProductWarrantyCode.count({ where: { is_deleted: false, created_at: { gte: lastWeekStart, lt: weekStart } } }),
            ProviderWarrantyCustomer.count({ where: { is_deleted: false, created_at: { gte: weekStart } } }),
            ProviderWarrantyCustomer.count({ where: { is_deleted: false, created_at: { gte: lastWeekStart, lt: weekStart } } }),
            WarrantyClaim.count({ where: { created_at: { gte: weekStart } } }),
            WarrantyClaim.count({ where: { created_at: { gte: lastWeekStart, lt: weekStart } } }),
            CoinTransaction.findMany({
                where: {
                    type: "CREDIT",
                    action: { in: ["PURCHASE_PACKAGE", "PURCHASE_CUSTOM"] },
                },
                select: { amount: true, action: true, package_id: true, created_at: true, package: { select: { price: true } } },
            }),
            CoinTransaction.aggregate({
                where: { type: "CREDIT", action: { in: ["PURCHASE_PACKAGE", "PURCHASE_CUSTOM"] } },
                _sum: { amount: true },
            }),
            CoinTransaction.aggregate({
                where: { type: "DEBIT" },
                _sum: { amount: true },
            }),
        ]);

        let revenueTotal = 0;
        let revenueToday = 0;
        for (const tx of creditTxForRevenue || []) {
            let rupees = 0;
            if (tx.action === "PURCHASE_PACKAGE" && tx.package?.price != null) {
                rupees = Number(tx.package.price) || 0;
            } else if (tx.action === "PURCHASE_CUSTOM") {
                rupees = (tx.amount || 0) * RUPEES_PER_COIN;
            }
            revenueTotal += rupees;
            if (new Date(tx.created_at) >= todayStart) revenueToday += rupees;
        }

        const codesDelta = (codesThisWeek ?? 0) - (codesLastWeek ?? 0);
        const warrantiesLastWeekCount = warrantiesLastWeek ?? 0;
        const warrantiesDelta = warrantiesLastWeekCount === 0
            ? ((warrantiesThisWeek ?? 0) > 0 ? (warrantiesThisWeek ?? 0) : 0)
            : (warrantiesThisWeek ?? 0) - warrantiesLastWeekCount;
        const warrantiesPercent = warrantiesLastWeekCount > 0
            ? Math.round(((warrantiesDelta / warrantiesLastWeekCount) * 100))
            : 0;
        const claimsDelta = (claimsThisWeek ?? 0) - (claimsLastWeek ?? 0);

        return returnResponse(res, StatusCodes.OK, "Dashboard stats", {
            totalProviders,
            activeProviders,
            blockedProviders,
            totalDealers,
            totalStaff,
            totalCustomers,
            totalWarranties,
            totalWarrantyCodes,
            totalClaims,
            revenue: {
                total: Math.round(revenueTotal * 100) / 100,
                today: Math.round(revenueToday * 100) / 100,
            },
            coinsSold: coinsSoldAgg?._sum?.amount ?? 0,
            coinsUsed: coinsUsedAgg?._sum?.amount ?? 0,
            platformUsage: {
                warrantyCodesDelta: codesDelta,
                warrantyCodesThisWeek: codesThisWeek ?? 0,
                warrantiesDelta,
                warrantiesPercent,
                warrantiesThisWeek: warrantiesThisWeek ?? 0,
                claimsDelta,
                claimsThisWeek: claimsThisWeek ?? 0,
            },
        });
    } catch (error) {
        logger.error(`dashboardStatsEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch dashboard stats");
    }
};

export default dashboardStatsEndpoint;
