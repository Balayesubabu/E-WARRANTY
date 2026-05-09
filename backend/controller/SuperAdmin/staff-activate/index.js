import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { Staff, ProviderNotification } from "../../../prisma/db-models.js";
import { logSuperAdminAction } from "../../../services/super-admin-activity-service.js";
import {
    deactivateStaff as deactivateStaffService,
    reactivateStaff as reactivateStaffService,
    sendStaffDeactivationNotification,
    sendStaffReactivationNotification,
    sendOwnerStaffDeactivationNotification,
    sendOwnerStaffReactivationNotification,
} from "../../../services/staff-status-service.js";

/**
 * PUT /super-admin/providers/:providerId/staff/:staffId/deactivate
 * Body: { reason: string } - required, minimum 10 characters (included in email to staff)
 * Super Admin deactivates a staff member under an owner
 */
export const staffDeactivateEndpoint = async (req, res) => {
    try {
        const { providerId, staffId } = req.params;
        const reason = (req.body?.reason || "").trim();

        if (!providerId || !staffId) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID and staff ID are required");
        }

        if (!reason || reason.length < 10) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Reason is required (minimum 10 characters). This will be sent to the staff member.");
        }

        const staff = await Staff.findFirst({
            where: { id: staffId, provider_id: providerId, is_deleted: false },
            include: { provider: { include: { user: { select: { email: true, first_name: true, last_name: true } } } } },
        });

        if (!staff) {
            return returnError(res, StatusCodes.NOT_FOUND, "Staff not found or does not belong to this provider");
        }

        if (!staff.is_active) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Staff is already inactive");
        }

        const requestInfo = {
            ip: req.ip || req.headers["x-forwarded-for"],
            userAgent: req.headers["user-agent"],
        };

        const updated = await deactivateStaffService(staffId, req.user_id, reason, requestInfo);

        sendStaffDeactivationNotification(staff, reason).catch((err) =>
            logger.error(`Staff deactivation email failed: ${err?.message || err}`)
        );
        sendOwnerStaffDeactivationNotification(staff, reason).catch((err) =>
            logger.error(`Owner deactivation notification failed: ${err?.message || err}`)
        );

        await ProviderNotification.create({
            data: {
                provider_id: providerId,
                dealer_id: null,
                name: "E-Warrantify",
                contact_number: "staff-deactivated",
                email: "noreply@ewarrantify.com",
                message: `Staff member "${staff.name}" (${staff.email}) was suspended by platform administration. Reason: ${reason}`,
                owner_only: true,
            },
        }).catch((err) => logger.error(`In-app notification for owner failed: ${err?.message || err}`));

        logSuperAdminAction({
            super_admin_id: req.user_id,
            action: "staff_deactivated",
            entity_type: "staff",
            entity_id: staffId,
            provider_id: providerId,
            target_name: staff.name,
            details: { reason },
            ip_address: req.ip || req.headers["x-forwarded-for"],
        }).catch(() => {});

        return returnResponse(res, StatusCodes.OK, "Staff deactivated successfully", {
            id: updated.id,
            is_active: updated.is_active,
            staff_status: updated.staff_status,
        });
    } catch (error) {
        logger.error(`staffDeactivateEndpoint error: ${error?.message || error}`);
        const msg = error?.message || "Failed to deactivate staff";
        const code = msg.includes("required") || msg.includes("already")
            ? StatusCodes.BAD_REQUEST
            : StatusCodes.INTERNAL_SERVER_ERROR;
        return returnError(res, code, msg);
    }
};

/**
 * PUT /super-admin/providers/:providerId/staff/:staffId/activate
 * Super Admin reactivates a staff member under an owner
 */
export const staffActivateEndpoint = async (req, res) => {
    try {
        const { providerId, staffId } = req.params;

        if (!providerId || !staffId) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID and staff ID are required");
        }

        const staff = await Staff.findFirst({
            where: { id: staffId, provider_id: providerId, is_deleted: false },
            include: { provider: { include: { user: { select: { email: true, first_name: true, last_name: true } } } } },
        });

        if (!staff) {
            return returnError(res, StatusCodes.NOT_FOUND, "Staff not found or does not belong to this provider");
        }

        if (staff.is_active) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Staff is already active");
        }

        const requestInfo = {
            ip: req.ip || req.headers["x-forwarded-for"],
            userAgent: req.headers["user-agent"],
        };

        const updated = await reactivateStaffService(staffId, req.user_id, requestInfo);

        sendStaffReactivationNotification(updated).catch((err) =>
            logger.error(`Staff reactivation email failed: ${err?.message || err}`)
        );
        sendOwnerStaffReactivationNotification(staff).catch((err) =>
            logger.error(`Owner reactivation notification failed: ${err?.message || err}`)
        );

        await ProviderNotification.create({
            data: {
                provider_id: providerId,
                dealer_id: null,
                name: "E-Warrantify",
                contact_number: "staff-activated",
                email: "noreply@ewarrantify.com",
                message: `Staff member "${staff.name}" (${staff.email}) was reactivated by platform administration.`,
                owner_only: true,
            },
        }).catch((err) => logger.error(`In-app notification for owner failed: ${err?.message || err}`));

        logSuperAdminAction({
            super_admin_id: req.user_id,
            action: "staff_activated",
            entity_type: "staff",
            entity_id: staffId,
            provider_id: providerId,
            target_name: staff.name,
            ip_address: req.ip || req.headers["x-forwarded-for"],
        }).catch(() => {});

        return returnResponse(res, StatusCodes.OK, "Staff activated successfully", {
            id: updated.id,
            is_active: updated.is_active,
            staff_status: updated.staff_status,
        });
    } catch (error) {
        logger.error(`staffActivateEndpoint error: ${error?.message || error}`);
        const msg = error?.message || "Failed to activate staff";
        const code = msg.includes("already") ? StatusCodes.BAD_REQUEST : StatusCodes.INTERNAL_SERVER_ERROR;
        return returnError(res, code, msg);
    }
};
