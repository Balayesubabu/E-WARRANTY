import { prisma, Dealer, AuditLog, RevokedToken, ProviderWarrantyCustomer } from "../prisma/db-models.js";
import { logger } from "./logger.js";
import { sendEmail } from "./email.js";
import crypto from "crypto";

/**
 * Deactivate a dealer with full cascade
 * @param {string} dealerId - The dealer ID to deactivate
 * @param {string} adminId - The admin/owner ID performing the action
 * @param {string} reason - Optional reason for deactivation
 * @param {object} requestInfo - Optional request info for audit (ip, user agent)
 * @returns {object} Updated dealer
 */
export const deactivateDealer = async (dealerId, adminId, reason = null, requestInfo = {}) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Get dealer info before update
        const dealer = await tx.providerDealer.findUnique({
            where: { id: dealerId },
            include: { provider: true }
        });

        if (!dealer) {
            throw new Error("Dealer not found");
        }

        if (dealer.status === 'INACTIVE') {
            throw new Error("Dealer is already inactive");
        }

        // 2. Update dealer status
        const updatedDealer = await tx.providerDealer.update({
            where: { id: dealerId },
            data: {
                status: 'INACTIVE',
                is_active: false,
                inactivated_at: new Date(),
                inactivated_by: adminId,
                inactivation_reason: reason
            }
        });

        // 3. Create audit log
        await tx.auditLog.create({
            data: {
                entity_type: 'Dealer',
                entity_id: dealerId,
                action: 'DEACTIVATE',
                performed_by: adminId,
                reason: reason,
                old_values: { status: 'ACTIVE', is_active: true },
                new_values: { status: 'INACTIVE', is_active: false },
                ip_address: requestInfo.ip || null,
                user_agent: requestInfo.userAgent || null
            }
        });

        // 4. Revoke all active tokens for this dealer (force logout)
        await revokeAllDealerTokens(tx, dealerId);

        // 5. Keep existing warranty registrations ACTIVE - do not invalidate customer warranties

        logger.info(`Dealer ${dealerId} deactivated by ${adminId}. Reason: ${reason || 'Not specified'}`);

        return updatedDealer;
    });
};

/**
 * Reactivate a dealer
 * @param {string} dealerId - The dealer ID to reactivate
 * @param {string} adminId - The admin/owner ID performing the action
 * @param {boolean} restoreListings - Whether to restore dealer listings
 * @param {object} requestInfo - Optional request info for audit
 * @returns {object} Updated dealer
 */
export const reactivateDealer = async (dealerId, adminId, restoreListings = false, requestInfo = {}) => {
    return await prisma.$transaction(async (tx) => {
        const dealer = await tx.providerDealer.findUnique({
            where: { id: dealerId }
        });

        if (!dealer) {
            throw new Error("Dealer not found");
        }

        if (dealer.status === 'ACTIVE') {
            throw new Error("Dealer is already active");
        }

        // 1. Update dealer status
        const updatedDealer = await tx.providerDealer.update({
            where: { id: dealerId },
            data: {
                status: 'ACTIVE',
                is_active: true,
                inactivated_at: null,
                inactivated_by: null,
                inactivation_reason: null
            }
        });

        // 2. Create audit log
        await tx.auditLog.create({
            data: {
                entity_type: 'Dealer',
                entity_id: dealerId,
                action: 'REACTIVATE',
                performed_by: adminId,
                reason: 'Dealer reactivated',
                old_values: { status: 'INACTIVE', is_active: false },
                new_values: { status: 'ACTIVE', is_active: true },
                ip_address: requestInfo.ip || null,
                user_agent: requestInfo.userAgent || null
            }
        });

        // 3. Optionally restore listings
        if (restoreListings) {
            await tx.providerWarrantyCustomer.updateMany({
                where: { dealer_id: dealerId },
                data: { is_active: true }
            });
        }

        // 4. Clear revoked tokens for this dealer (allow new logins)
        await tx.revokedToken.deleteMany({
            where: { user_id: dealerId, user_type: 'dealer' }
        });

        logger.info(`Dealer ${dealerId} reactivated by ${adminId}. Restore listings: ${restoreListings}`);

        return updatedDealer;
    });
};

/**
 * Revoke all tokens for a dealer (force logout)
 * @param {object} tx - Prisma transaction client
 * @param {string} dealerId - Dealer ID
 */
const revokeAllDealerTokens = async (tx, dealerId) => {
    // Create a revocation record that will be checked in middleware
    // This invalidates all existing tokens for the dealer
    const tokenHash = crypto.createHash('sha256')
        .update(`dealer_revoke_all_${dealerId}_${Date.now()}`)
        .digest('hex');

    await tx.revokedToken.create({
        data: {
            token_hash: tokenHash,
            user_id: dealerId,
            user_type: 'dealer',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
    });
};

/**
 * Check if a dealer is active
 * @param {string} dealerId - Dealer ID
 * @returns {boolean} True if active
 */
export const isDealerActive = async (dealerId) => {
    const dealer = await Dealer.findUnique({
        where: { id: dealerId },
        select: { status: true, is_active: true }
    });

    if (!dealer) return false;
    return dealer.status === 'ACTIVE' && dealer.is_active === true;
};

/**
 * Get dealer status details
 * @param {string} dealerId - Dealer ID
 * @returns {object} Dealer status info
 */
export const getDealerStatus = async (dealerId) => {
    const dealer = await Dealer.findUnique({
        where: { id: dealerId },
        select: {
            id: true,
            name: true,
            email: true,
            status: true,
            is_active: true,
            inactivated_at: true,
            inactivated_by: true,
            inactivation_reason: true
        }
    });

    return dealer;
};

/**
 * Send deactivation notification email to dealer
 * @param {object} dealer - Dealer object
 * @param {string} reason - Reason for deactivation
 */
export const sendDeactivationNotification = async (dealer, reason) => {
    const message = `
Hello ${dealer.name},

Your dealer account has been deactivated.
${reason ? `\nReason: ${reason}` : ''}

What this means:
- You will not be able to log in to your account
- You will not be able to register new warranties
- Your existing warranty registrations remain valid and active

If you believe this is an error or have questions, please contact support.

Best regards,
E-Warrantify Team
    `.trim();

    try {
        await sendEmail(dealer.email, "Account Deactivated - Action Required", message);
        logger.info(`Deactivation notification sent to dealer: ${dealer.email}`);
    } catch (error) {
        logger.error(`Failed to send deactivation notification to ${dealer.email}: ${error.message}`);
    }
};

/**
 * Send deactivation notification email to owner when a dealer under their account is deactivated by Super Admin
 * @param {object} dealer - Dealer object (must include provider with user)
 * @param {string} reason - Reason for deactivation
 */
export const sendOwnerDealerDeactivationNotification = async (dealer, reason) => {
    const provider = dealer?.provider;
    const ownerEmail = provider?.user?.email;
    if (!ownerEmail) {
        logger.warn(`Provider ${provider?.id} has no owner email - dealer deactivation notification not sent`);
        return;
    }
    const ownerName = provider?.user?.first_name || provider?.user?.last_name || "Owner";
    const companyName = provider?.company_name || "your organization";
    const message = `
Dear ${ownerName},

A dealer under your account has been deactivated by platform administration.

Dealer details:
- Name: ${dealer.name || "N/A"}
- Email: ${dealer.email || "N/A"}

Reason: ${reason || "Not specified"}

What this means:
- This dealer can no longer log in or register warranties
- Existing warranty registrations made by this dealer remain valid

If you have questions or believe this was done in error, please contact our support team.

Best regards,
E-Warrantify Team
    `.trim();

    try {
        await sendEmail(ownerEmail, `Dealer Deactivated - ${companyName}`, message);
        logger.info(`Owner deactivation notification sent to ${ownerEmail} for dealer ${dealer.id}`);
    } catch (error) {
        logger.error(`Failed to send owner dealer deactivation notification to ${ownerEmail}: ${error.message}`);
    }
};

/**
 * Send reactivation notification email to owner when a dealer under their account is reactivated by Super Admin
 * @param {object} dealer - Dealer object (must include provider with user)
 * @returns {Promise<void>}
 */
export const sendOwnerDealerReactivationNotification = async (dealer) => {
    const provider = dealer?.provider;
    const ownerEmail = provider?.user?.email;
    if (!ownerEmail) {
        logger.warn(`Provider ${provider?.id} has no owner email - dealer reactivation notification not sent`);
        return;
    }
    const ownerName = provider?.user?.first_name || provider?.user?.last_name || "Owner";
    const companyName = provider?.company_name || "your organization";
    const message = `
Dear ${ownerName},

A dealer under your account has been reactivated by platform administration.

Dealer details:
- Name: ${dealer.name || "N/A"}
- Email: ${dealer.email || "N/A"}

This dealer can now log in and access the platform.

Best regards,
E-Warrantify Team
    `.trim();

    try {
        await sendEmail(ownerEmail, `Dealer Reactivated - ${companyName}`, message);
        logger.info(`Owner reactivation notification sent to ${ownerEmail} for dealer ${dealer.id}`);
    } catch (error) {
        logger.error(`Failed to send owner dealer reactivation notification to ${ownerEmail}: ${error.message}`);
    }
};

/**
 * Send reactivation notification email to dealer
 * @param {object} dealer - Dealer object
 */
export const sendReactivationNotification = async (dealer) => {
    const message = `
Hello ${dealer.name},

Great news! Your dealer account has been reactivated.

You can now:
- Log in to your account
- Access all your dealer features
- Continue managing your warranty registrations

Welcome back!

Best regards,
E-Warrantify Team
    `.trim();

    try {
        await sendEmail(dealer.email, "Account Reactivated - Welcome Back!", message);
        logger.info(`Reactivation notification sent to dealer: ${dealer.email}`);
    } catch (error) {
        logger.error(`Failed to send reactivation notification to ${dealer.email}: ${error.message}`);
    }
};

/**
 * Get audit logs for a dealer
 * @param {string} dealerId - Dealer ID
 * @param {number} limit - Max records to return
 * @returns {array} Audit logs
 */
export const getDealerAuditLogs = async (dealerId, limit = 50) => {
    const logs = await AuditLog.findMany({
        where: {
            entity_type: 'Dealer',
            entity_id: dealerId
        },
        orderBy: { created_at: 'desc' },
        take: limit
    });

    return logs;
};
