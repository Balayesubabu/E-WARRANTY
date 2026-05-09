import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { ProviderDealer, ProviderNotification } from "../../../prisma/db-models.js";
import { logSuperAdminAction } from "../../../services/super-admin-activity-service.js";
import {
    deactivateDealer,
    reactivateDealer,
    sendDeactivationNotification,
    sendReactivationNotification,
    sendOwnerDealerDeactivationNotification,
    sendOwnerDealerReactivationNotification,
} from "../../../services/dealer-status-service.js";

/**
 * PUT /super-admin/providers/:providerId/dealers/:dealerId/deactivate
 * Body: { reason: string } - required, minimum 10 characters (included in email to dealer)
 * Super Admin deactivates a dealer under an owner
 */
export const dealerDeactivateEndpoint = async (req, res) => {
    try {
        const { providerId, dealerId } = req.params;
        const reason = (req.body?.reason || "").trim();

        if (!providerId || !dealerId) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID and dealer ID are required");
        }

        if (!reason || reason.length < 10) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Reason is required (minimum 10 characters). This will be sent to the dealer.");
        }

        const dealer = await ProviderDealer.findFirst({
            where: { id: dealerId, provider_id: providerId, is_deleted: false },
            include: { provider: { include: { user: { select: { email: true, first_name: true, last_name: true } } } } },
        });

        if (!dealer) {
            return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found or does not belong to this provider");
        }

        if (dealer.status === "INACTIVE" && !dealer.is_active) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Dealer is already inactive");
        }

        const requestInfo = {
            ip: req.ip || req.headers["x-forwarded-for"],
            userAgent: req.headers["user-agent"],
        };

        const updated = await deactivateDealer(dealerId, req.user_id, reason, requestInfo);

        sendDeactivationNotification(dealer, reason).catch((err) =>
            logger.error(`Deactivation email failed: ${err?.message}`)
        );
        sendOwnerDealerDeactivationNotification(dealer, reason).catch((err) =>
            logger.error(`Owner deactivation notification failed: ${err?.message}`)
        );

        await ProviderNotification.create({
            data: {
                provider_id: providerId,
                dealer_id: dealerId,
                name: "E-Warrantify",
                contact_number: "dealer-deactivated",
                email: "noreply@ewarrantify.com",
                message: `Dealer "${dealer.name}" (${dealer.email}) was deactivated by platform administration. Reason: ${reason}`,
                owner_only: true,
            },
        }).catch((err) => logger.error(`In-app notification for owner failed: ${err?.message}`));

        logSuperAdminAction({
            super_admin_id: req.user_id,
            action: "dealer_deactivated",
            entity_type: "dealer",
            entity_id: dealerId,
            provider_id: providerId,
            target_name: dealer.name,
            details: { reason },
            ip_address: req.ip || req.headers["x-forwarded-for"],
        }).catch(() => {});

        return returnResponse(res, StatusCodes.OK, "Dealer deactivated successfully", {
            id: updated.id,
            status: updated.status,
            is_active: updated.is_active,
        });
    } catch (error) {
        logger.error(`dealerDeactivateEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error?.message || "Failed to deactivate dealer");
    }
};

/**
 * PUT /super-admin/providers/:providerId/dealers/:dealerId/activate
 * Super Admin reactivates a dealer under an owner
 */
export const dealerActivateEndpoint = async (req, res) => {
    try {
        const { providerId, dealerId } = req.params;

        if (!providerId || !dealerId) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID and dealer ID are required");
        }

        const dealer = await ProviderDealer.findFirst({
            where: { id: dealerId, provider_id: providerId, is_deleted: false },
            include: { provider: { include: { user: { select: { email: true, first_name: true, last_name: true } } } } },
        });

        if (!dealer) {
            return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found or does not belong to this provider");
        }

        if (dealer.status === "ACTIVE" && dealer.is_active) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Dealer is already active");
        }

        const requestInfo = {
            ip: req.ip || req.headers["x-forwarded-for"],
            userAgent: req.headers["user-agent"],
        };

        const updated = await reactivateDealer(dealerId, req.user_id, false, requestInfo);

        sendReactivationNotification(updated).catch((err) => logger.error(`Reactivation email failed: ${err?.message}`));
        sendOwnerDealerReactivationNotification(dealer).catch((err) =>
            logger.error(`Owner reactivation notification failed: ${err?.message}`)
        );

        await ProviderNotification.create({
            data: {
                provider_id: providerId,
                dealer_id: dealerId,
                name: "E-Warrantify",
                contact_number: "dealer-activated",
                email: "noreply@ewarrantify.com",
                message: `Dealer "${dealer.name}" (${dealer.email}) was reactivated by platform administration.`,
                owner_only: true,
            },
        }).catch((err) => logger.error(`In-app notification for owner failed: ${err?.message}`));

        logSuperAdminAction({
            super_admin_id: req.user_id,
            action: "dealer_activated",
            entity_type: "dealer",
            entity_id: dealerId,
            provider_id: providerId,
            target_name: dealer.name,
            ip_address: req.ip || req.headers["x-forwarded-for"],
        }).catch(() => {});

        return returnResponse(res, StatusCodes.OK, "Dealer activated successfully", {
            id: updated.id,
            status: updated.status,
            is_active: updated.is_active,
        });
    } catch (error) {
        logger.error(`dealerActivateEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error?.message || "Failed to activate dealer");
    }
};
