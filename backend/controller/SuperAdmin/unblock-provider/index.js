import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { Provider } from "../../../prisma/db-models.js";
import { sendEmail } from "../../../services/email.js";
import { logSuperAdminAction } from "../../../services/super-admin-activity-service.js";

/**
 * PUT /super-admin/providers/:id/unblock
 * Unblock a provider (sets is_blocked = false)
 */
const unblockProviderEndpoint = async (req, res) => {
    try {
        const { id } = req.params;
        const provider = await Provider.findUnique({
            where: { id },
            include: { user: { select: { email: true, first_name: true, last_name: true } } },
        });
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        if (provider.is_deleted) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider is deleted");
        }
        await Provider.update({
            where: { id },
            data: { is_blocked: false, blocked_by_id: null },
        });
        logger.info(`Super Admin ${req.user_id} unblocked provider ${id}`);

        logSuperAdminAction({
            super_admin_id: req.user_id,
            action: "provider_unblocked",
            entity_type: "provider",
            entity_id: id,
            provider_id: id,
            target_name: provider.company_name,
            ip_address: req.ip || req.headers["x-forwarded-for"],
        }).catch(() => {});

        const ownerEmail = provider.user?.email;
        if (ownerEmail) {
            try {
                const subject = "Your E-Warrantify account has been reinstated";
                const body = `Dear ${provider.user?.first_name || "Owner"},

Your E-Warrantify business account (${provider.company_name || "your organization"}) has been reinstated.

You can now sign in and access the platform.

Best regards,
E-Warrantify Team`;
                await sendEmail(ownerEmail, subject, body);
                logger.info(`Unblock notification email sent to ${ownerEmail}`);
            } catch (emailErr) {
                logger.error(`Failed to send unblock notification email: ${emailErr?.message || emailErr}`);
            }
        } else {
            logger.warn(`Provider ${id} has no owner email - unblock notification not sent`);
        }

        return returnResponse(res, StatusCodes.OK, "Provider unblocked", { id, is_blocked: false });
    } catch (error) {
        logger.error(`unblockProviderEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to unblock provider");
    }
};

export default unblockProviderEndpoint;
