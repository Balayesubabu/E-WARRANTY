import { returnResponse, returnError, logger } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { Provider } from "../../../prisma/db-models.js";
import { sendEmail } from "../../../services/email.js";
import { logSuperAdminAction } from "../../../services/super-admin-activity-service.js";

const MIN_REASON_LENGTH = 10;

/**
 * PUT /super-admin/providers/:id/block
 * Block a provider (sets is_blocked = true) and send email notification to owner
 * Body: { reason: string } - required blocking reason (min 10 chars, included in email)
 */
const blockProviderEndpoint = async (req, res) => {
    try {
        const { id } = req.params;
        const reason = (req.body?.reason || "").trim();

        if (!reason || reason.length < MIN_REASON_LENGTH) {
            return returnError(
                res,
                StatusCodes.BAD_REQUEST,
                `Blocking reason is required (minimum ${MIN_REASON_LENGTH} characters). Please provide a clear reason for this action.`
            );
        }

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
            data: { is_blocked: true, blocked_by_id: req.user_id },
        });
        logger.info(`Super Admin ${req.user_id} blocked provider ${id}`);

        logSuperAdminAction({
            super_admin_id: req.user_id,
            action: "provider_blocked",
            entity_type: "provider",
            entity_id: id,
            provider_id: id,
            target_name: provider.company_name,
            details: { reason },
            ip_address: req.ip || req.headers["x-forwarded-for"],
        }).catch(() => {});

        const ownerEmail = provider.user?.email;
        if (ownerEmail) {
            try {
                const subject = "Your E-Warrantify account has been suspended";
                const body = `Dear ${provider.user?.first_name || "Owner"},

Your E-Warrantify business account (${provider.company_name || "your organization"}) has been suspended.

Reason: ${reason}

You will not be able to sign in or access the platform until the issue is resolved.

If you believe this was done in error, please contact our support team.

Best regards,
E-Warrantify Team`;

                await sendEmail(ownerEmail, subject, body);
                logger.info(`Block notification email sent to ${ownerEmail}`);
            } catch (emailErr) {
                logger.error(`Failed to send block notification email: ${emailErr?.message || emailErr}`);
            }
        } else {
            logger.warn(`Provider ${id} has no owner email - block notification not sent`);
        }

        return returnResponse(res, StatusCodes.OK, "Provider blocked", { id, is_blocked: true });
    } catch (error) {
        logger.error(`blockProviderEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to block provider");
    }
};

export default blockProviderEndpoint;
