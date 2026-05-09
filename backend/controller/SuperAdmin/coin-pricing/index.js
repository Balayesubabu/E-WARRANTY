import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { CoinPackage, CoinPricing, WarrantyCostConfig, Provider, ProviderNotification } from "../../../prisma/db-models.js";
import { logSuperAdminAction } from "../../../services/super-admin-activity-service.js";
import { getWarrantyCostByMonthsFromDB } from "../../../services/coinService.js";
import { sendEmail } from "../../../services/email.js";

const CENTS_PER_COIN = 10;
const RUPEES_PER_COIN = parseFloat(process.env.RUPEES_PER_COIN || "9.3");

/**
 * GET /super-admin/coin-pricing
 * Returns global coin pricing: base rate, packages, action costs, warranty costs
 */
const getCoinPricingEndpoint = async (req, res) => {
    try {
        const [packages, actionCosts, warrantyCostByMonths] = await Promise.all([
            CoinPackage.findMany({
                where: { is_deleted: false },
                orderBy: { sort_order: "asc" },
            }),
            CoinPricing.findMany({ where: { is_active: true } }),
            getWarrantyCostByMonthsFromDB(),
        ]);

        const packagesWithTotal = packages.map((p) => ({
            id: p.id,
            name: p.name,
            coins: p.coins,
            bonus_coins: p.bonus_coins,
            total_coins: p.coins + p.bonus_coins,
            price: p.price,
            currency: p.currency,
            is_popular: p.is_popular,
            sort_order: p.sort_order,
            price_per_coin: ((p.price) / (p.coins + p.bonus_coins)).toFixed(2),
        }));

        return returnResponse(res, StatusCodes.OK, "Coin pricing retrieved", {
            baseRate: {
                cents_per_coin: CENTS_PER_COIN,
                rupees_per_coin: RUPEES_PER_COIN,
                note: "1 coin = 10¢ USD",
            },
            warrantyCostByMonths,
            packages: packagesWithTotal,
            actionCosts: actionCosts.map((a) => ({
                id: a.id,
                action: a.action,
                cost: a.cost,
                description: a.description,
            })),
        });
    } catch (error) {
        logger.error(`getCoinPricingEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch coin pricing");
    }
};

/**
 * Notify all owners (providers) when warranty costs are updated.
 * Creates in-app notifications and sends email to each owner.
 */
const notifyOwnersOfWarrantyCostUpdate = async (warrantyCostByMonths) => {
    const c3 = warrantyCostByMonths[3] ?? "-";
    const c6 = warrantyCostByMonths[6] ?? "-";
    const c12 = warrantyCostByMonths[12] ?? "-";
    const message = `Warranty cost per coin has been updated. 3 months: ${c3} coin(s), 6 months: ${c6} coin(s), 12 months: ${c12} coin(s). Check the Wallet or pricing page for details.`;

    const providers = await Provider.findMany({
        where: { is_blocked: false },
        include: { user: { select: { email: true, first_name: true } } },
    });

    const emailSubject = "E-Warrantify: Warranty Cost Updated";
    const emailBodyTemplate = (firstName) => `Dear ${firstName || "Owner"},

The warranty cost per coin has been updated on E-Warrantify.

New costs (coins per warranty code):
• 3 months: ${c3} coin(s)
• 6 months: ${c6} coin(s)
• 12 months: ${c12} coin(s)

These costs apply when you generate warranty codes. You can view the latest pricing in your Wallet or the pricing page.

Best regards,
E-Warrantify Team`;

    for (const provider of providers) {
        try {
            await ProviderNotification.create({
                data: {
                    provider_id: provider.id,
                    name: "E-Warrantify",
                    contact_number: "system",
                    email: "noreply@ewarrantify.com",
                    message,
                    owner_only: true,
                },
            });
        } catch (err) {
            logger.warn(`Failed to create pricing notification for provider ${provider.id}: ${err?.message || err}`);
        }

        const ownerEmail = provider.user?.email;
        if (ownerEmail) {
            const body = emailBodyTemplate(provider.user?.first_name);
            sendEmail(ownerEmail, emailSubject, body).catch((err) =>
                logger.warn(`Failed to send pricing update email to ${ownerEmail}: ${err?.message || err}`)
            );
        }
    }
    logger.info(`Notified ${providers.length} owners of warranty cost update`);
};

/**
 * PUT /super-admin/coin-pricing
 * Update coin packages, action costs, and/or warranty costs
 * Body: { packages?: [...], actionCosts?: [...], warrantyCostByMonths?: { 3: n, 6: n, 12: n } }
 */
const updateCoinPricingEndpoint = async (req, res) => {
    try {
        const { packages, actionCosts, warrantyCostByMonths } = req.body;
        let warrantyCostUpdated = false;
        let updatedWarrantyCosts = null;

        if (warrantyCostByMonths && typeof warrantyCostByMonths === "object") {
            for (const months of [3, 6, 12]) {
                const cost = parseInt(warrantyCostByMonths[months], 10);
                if (!isNaN(cost) && cost >= 0) {
                    await WarrantyCostConfig.upsert({
                        where: { duration_months: months },
                        create: { duration_months: months, cost },
                        update: { cost },
                    });
                    warrantyCostUpdated = true;
                }
            }
            if (warrantyCostUpdated) {
                updatedWarrantyCosts = { ...warrantyCostByMonths };
            }
        }

        if (packages && Array.isArray(packages)) {
            for (const pkg of packages) {
                if (!pkg.id) continue;
                const coins = parseInt(pkg.coins, 10);
                const bonus = parseInt(pkg.bonus_coins, 10);
                const price = parseFloat(pkg.price);
                if (isNaN(coins) || coins < 0 || isNaN(price) || price < 0) continue;
                await CoinPackage.update({
                    where: { id: pkg.id },
                    data: {
                        name: String(pkg.name || ""),
                        coins,
                        bonus_coins: isNaN(bonus) ? 0 : Math.max(0, bonus),
                        price,
                        is_popular: !!pkg.is_popular,
                        sort_order: parseInt(pkg.sort_order, 10) || 0,
                    },
                });
            }
        }

        if (actionCosts && Array.isArray(actionCosts)) {
            for (const ac of actionCosts) {
                if (!ac.id) continue;
                const cost = parseInt(ac.cost, 10);
                await CoinPricing.update({
                    where: { id: ac.id },
                    data: {
                        cost: isNaN(cost) ? 0 : Math.max(0, cost),
                        description: String(ac.description || ""),
                    },
                });
            }
        }

        // Notify all owners when warranty costs are updated (in-app + email)
        if (warrantyCostUpdated && updatedWarrantyCosts) {
            notifyOwnersOfWarrantyCostUpdate(updatedWarrantyCosts).catch((err) =>
                logger.warn(`Failed to notify owners of warranty cost update: ${err?.message || err}`)
            );
        }

        logSuperAdminAction({
            super_admin_id: req.user_id,
            action: "coin_pricing_updated",
            entity_type: "coin_pricing",
            details: {
                packages_updated: packages?.length ?? 0,
                action_costs_updated: actionCosts?.length ?? 0,
                warranty_costs_updated: warrantyCostUpdated ? updatedWarrantyCosts : null,
            },
            ip_address: req.ip || req.headers["x-forwarded-for"],
        }).catch(() => {});

        return returnResponse(res, StatusCodes.OK, "Coin pricing updated");
    } catch (error) {
        logger.error(`updateCoinPricingEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update coin pricing");
    }
};

export { getCoinPricingEndpoint, updateCoinPricingEndpoint };
