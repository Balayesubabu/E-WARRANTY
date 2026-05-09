import { logger } from "./logger.js";
import { sendEmail } from "./email.js";

/**
 * Send deactivation notification email to service center
 * @param {object} sc - Service center object
 * @param {string} reason - Reason for deactivation
 */
export const sendServiceCenterDeactivationNotification = async (sc, reason) => {
    const message = `
Hello ${sc.name},

Your service center account has been deactivated.
${reason ? `\nReason: ${reason}` : ""}

What this means:
- You will not be able to log in to your account
- You will not be able to receive or process warranty claims
- Existing warranty claim assignments remain valid

If you believe this is an error or have questions, please contact support.

Best regards,
E-Warrantify Team
    `.trim();

    try {
        await sendEmail(sc.email, "Account Deactivated - Action Required", message);
        logger.info(`Deactivation notification sent to service center: ${sc.email}`);
    } catch (error) {
        logger.error(`Failed to send deactivation notification to ${sc.email}: ${error.message}`);
    }
};

/**
 * Send deactivation notification email to owner when a service center under their account is deactivated by Super Admin
 * @param {object} sc - Service center object (must include provider with user)
 * @param {string} reason - Reason for deactivation
 */
export const sendOwnerServiceCenterDeactivationNotification = async (sc, reason) => {
    const provider = sc?.provider;
    const ownerEmail = provider?.user?.email;
    if (!ownerEmail) {
        logger.warn(`Provider ${provider?.id} has no owner email - service center deactivation notification not sent`);
        return;
    }
    const ownerName = provider?.user?.first_name || provider?.user?.last_name || "Owner";
    const companyName = provider?.company_name || "your organization";
    const message = `
Dear ${ownerName},

A service center under your account has been deactivated by platform administration.

Service center details:
- Name: ${sc.name || "N/A"}
- Email: ${sc.email || "N/A"}

Reason: ${reason || "Not specified"}

What this means:
- This service center can no longer log in or receive warranty claims
- Existing warranty claim assignments to this service center remain valid

If you have questions or believe this was done in error, please contact our support team.

Best regards,
E-Warrantify Team
    `.trim();

    try {
        await sendEmail(ownerEmail, `Service Center Deactivated - ${companyName}`, message);
        logger.info(`Owner deactivation notification sent to ${ownerEmail} for service center ${sc.id}`);
    } catch (error) {
        logger.error(`Failed to send owner service center deactivation notification to ${ownerEmail}: ${error.message}`);
    }
};

/**
 * Send reactivation notification email to service center
 * @param {object} sc - Service center object
 */
export const sendServiceCenterReactivationNotification = async (sc) => {
    const message = `
Hello ${sc.name},

Great news! Your service center account has been reactivated.

You can now:
- Log in to your account
- Receive and process warranty claims
- Access all service center features

Welcome back!

Best regards,
E-Warrantify Team
    `.trim();

    try {
        await sendEmail(sc.email, "Account Reactivated - Welcome Back!", message);
        logger.info(`Reactivation notification sent to service center: ${sc.email}`);
    } catch (error) {
        logger.error(`Failed to send reactivation notification to ${sc.email}: ${error.message}`);
    }
};

/**
 * Send reactivation notification email to owner when a service center under their account is reactivated by Super Admin
 * @param {object} sc - Service center object (must include provider with user)
 */
export const sendOwnerServiceCenterReactivationNotification = async (sc) => {
    const provider = sc?.provider;
    const ownerEmail = provider?.user?.email;
    if (!ownerEmail) {
        logger.warn(`Provider ${provider?.id} has no owner email - service center reactivation notification not sent`);
        return;
    }
    const ownerName = provider?.user?.first_name || provider?.user?.last_name || "Owner";
    const companyName = provider?.company_name || "your organization";
    const message = `
Dear ${ownerName},

A service center under your account has been reactivated by platform administration.

Service center details:
- Name: ${sc.name || "N/A"}
- Email: ${sc.email || "N/A"}

This service center can now log in and receive warranty claims.

Best regards,
E-Warrantify Team
    `.trim();

    try {
        await sendEmail(ownerEmail, `Service Center Reactivated - ${companyName}`, message);
        logger.info(`Owner reactivation notification sent to ${ownerEmail} for service center ${sc.id}`);
    } catch (error) {
        logger.error(`Failed to send owner service center reactivation notification to ${ownerEmail}: ${error.message}`);
    }
};
