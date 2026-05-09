import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { ServiceCenter, ProviderNotification } from "../../../prisma/db-models.js";
import { logSuperAdminAction } from "../../../services/super-admin-activity-service.js";
import {
    sendServiceCenterDeactivationNotification,
    sendOwnerServiceCenterDeactivationNotification,
    sendServiceCenterReactivationNotification,
    sendOwnerServiceCenterReactivationNotification,
} from "../../../services/service-center-status-service.js";

/**
 * PUT /super-admin/providers/:providerId/service-centers/:serviceCenterId/deactivate
 * Body: { reason?: string } - optional reason (included in email to service center and owner)
 * Super Admin deactivates a service center under an owner
 */
export const serviceCenterDeactivateEndpoint = async (req, res) => {
    try {
        const { providerId, serviceCenterId } = req.params;
        const reason = (req.body?.reason || "").trim() || "Deactivated by platform administration.";

        if (!providerId || !serviceCenterId) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID and service center ID are required");
        }

        const sc = await ServiceCenter.findFirst({
            where: { id: serviceCenterId, provider_id: providerId, is_deleted: false },
            include: { provider: { include: { user: { select: { email: true, first_name: true, last_name: true } } } } },
        });

        if (!sc) {
            return returnError(res, StatusCodes.NOT_FOUND, "Service center not found or does not belong to this provider");
        }

        if (!sc.is_active) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Service center is already inactive");
        }

        await ServiceCenter.update({
            where: { id: serviceCenterId },
            data: { is_active: false },
        });

        sendServiceCenterDeactivationNotification(sc, reason).catch((err) =>
            logger.error(`Service center deactivation email failed: ${err?.message}`)
        );
        sendOwnerServiceCenterDeactivationNotification(sc, reason).catch((err) =>
            logger.error(`Owner service center deactivation notification failed: ${err?.message}`)
        );

        await ProviderNotification.create({
            data: {
                provider_id: providerId,
                dealer_id: null,
                name: "E-Warrantify",
                contact_number: "service-center-deactivated",
                email: "noreply@ewarrantify.com",
                message: `Service center "${sc.name}" (${sc.email}) was deactivated by platform administration. Reason: ${reason}`,
                owner_only: true,
            },
        }).catch((err) => logger.error(`In-app notification for owner failed: ${err?.message}`));

        logger.info(`Super Admin ${req.user_id} deactivated service center ${serviceCenterId} under provider ${providerId}`);

        logSuperAdminAction({
            super_admin_id: req.user_id,
            action: "service_center_deactivated",
            entity_type: "service_center",
            entity_id: serviceCenterId,
            provider_id: providerId,
            target_name: sc.name,
            details: { reason },
            ip_address: req.ip || req.headers["x-forwarded-for"],
        }).catch(() => {});

        return returnResponse(res, StatusCodes.OK, "Service center deactivated successfully", {
            id: serviceCenterId,
            is_active: false,
        });
    } catch (error) {
        logger.error(`serviceCenterDeactivateEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error?.message || "Failed to deactivate service center");
    }
};

/**
 * PUT /super-admin/providers/:providerId/service-centers/:serviceCenterId/activate
 * Super Admin reactivates a service center under an owner
 */
export const serviceCenterActivateEndpoint = async (req, res) => {
    try {
        const { providerId, serviceCenterId } = req.params;

        if (!providerId || !serviceCenterId) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID and service center ID are required");
        }

        const sc = await ServiceCenter.findFirst({
            where: { id: serviceCenterId, provider_id: providerId, is_deleted: false },
            include: { provider: { include: { user: { select: { email: true, first_name: true, last_name: true } } } } },
        });

        if (!sc) {
            return returnError(res, StatusCodes.NOT_FOUND, "Service center not found or does not belong to this provider");
        }

        if (sc.is_active) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Service center is already active");
        }

        const updated = await ServiceCenter.update({
            where: { id: serviceCenterId },
            data: { is_active: true },
        });

        const scWithProvider = { ...updated, provider: sc.provider };

        sendServiceCenterReactivationNotification(scWithProvider).catch((err) =>
            logger.error(`Service center reactivation email failed: ${err?.message}`)
        );
        sendOwnerServiceCenterReactivationNotification(scWithProvider).catch((err) =>
            logger.error(`Owner service center reactivation notification failed: ${err?.message}`)
        );

        await ProviderNotification.create({
            data: {
                provider_id: providerId,
                dealer_id: null,
                name: "E-Warrantify",
                contact_number: "service-center-activated",
                email: "noreply@ewarrantify.com",
                message: `Service center "${sc.name}" (${sc.email}) was reactivated by platform administration.`,
                owner_only: true,
            },
        }).catch((err) => logger.error(`In-app notification for owner failed: ${err?.message}`));

        logger.info(`Super Admin ${req.user_id} activated service center ${serviceCenterId} under provider ${providerId}`);

        logSuperAdminAction({
            super_admin_id: req.user_id,
            action: "service_center_activated",
            entity_type: "service_center",
            entity_id: serviceCenterId,
            provider_id: providerId,
            target_name: sc.name,
            ip_address: req.ip || req.headers["x-forwarded-for"],
        }).catch(() => {});

        return returnResponse(res, StatusCodes.OK, "Service center activated successfully", {
            id: serviceCenterId,
            is_active: true,
        });
    } catch (error) {
        logger.error(`serviceCenterActivateEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error?.message || "Failed to activate service center");
    }
};
