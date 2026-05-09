import { prisma, Staff } from "../prisma/db-models.js";
import { logger } from "./logger.js";
import { sendEmail } from "./email.js";
import crypto from "crypto";

/**
 * Deactivate a staff member (Super Admin flow)
 * @param {string} staffId - Staff ID to deactivate
 * @param {string} adminId - Super Admin user ID performing the action
 * @param {string} reason - Required reason for deactivation
 * @param {object} requestInfo - Optional request info for audit (ip, userAgent)
 * @returns {object} Updated staff
 */
export const deactivateStaff = async (staffId, adminId, reason, requestInfo = {}) => {
    if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
        throw new Error("Reason is required (minimum 10 characters)");
    }
    const trimmedReason = reason.trim();

    return await prisma.$transaction(async (tx) => {
        const staff = await tx.staff.findUnique({
            where: { id: staffId },
            include: { provider: true },
        });

        if (!staff) {
            throw new Error("Staff not found");
        }
        if (staff.is_deleted) {
            throw new Error("Staff record is deleted");
        }
        if (!staff.is_active) {
            throw new Error("Staff is already inactive");
        }

        const oldStatus = staff.staff_status;
        const oldActive = staff.is_active;

        const updated = await tx.staff.update({
            where: { id: staffId },
            data: {
                is_active: false,
                staff_status: "SUSPENDED",
            },
        });

        await tx.auditLog.create({
            data: {
                entity_type: "Staff",
                entity_id: staffId,
                action: "DEACTIVATE",
                performed_by: adminId,
                reason: trimmedReason,
                old_values: { staff_status: oldStatus, is_active: oldActive },
                new_values: { staff_status: "SUSPENDED", is_active: false },
                ip_address: requestInfo.ip || null,
                user_agent: requestInfo.userAgent || null,
            },
        });

        await revokeAllStaffTokens(tx, staffId);

        logger.info(`Staff ${staffId} deactivated by Super Admin ${adminId}. Reason: ${trimmedReason}`);
        return updated;
    });
};

/**
 * Reactivate a staff member
 * @param {string} staffId - Staff ID to reactivate
 * @param {string} adminId - Super Admin user ID performing the action
 * @param {object} requestInfo - Optional request info for audit
 * @returns {object} Updated staff
 */
export const reactivateStaff = async (staffId, adminId, requestInfo = {}) => {
    return await prisma.$transaction(async (tx) => {
        const staff = await tx.staff.findUnique({ where: { id: staffId } });
        if (!staff) throw new Error("Staff not found");
        if (staff.is_deleted) throw new Error("Staff record is deleted");
        if (staff.is_active) throw new Error("Staff is already active");

        const updated = await tx.staff.update({
            where: { id: staffId },
            data: { is_active: true, staff_status: "ACTIVE" },
        });

        await tx.auditLog.create({
            data: {
                entity_type: "Staff",
                entity_id: staffId,
                action: "REACTIVATE",
                performed_by: adminId,
                reason: "Staff reactivated by Super Admin",
                old_values: { staff_status: staff.staff_status, is_active: false },
                new_values: { staff_status: "ACTIVE", is_active: true },
                ip_address: requestInfo.ip || null,
                user_agent: requestInfo.userAgent || null,
            },
        });

        await tx.revokedToken.deleteMany({
            where: { user_id: staffId, user_type: "staff" },
        });

        logger.info(`Staff ${staffId} reactivated by Super Admin ${adminId}`);
        return updated;
    });
};

const revokeAllStaffTokens = async (tx, staffId) => {
    const tokenHash = crypto
        .createHash("sha256")
        .update(`staff_revoke_all_${staffId}_${Date.now()}`)
        .digest("hex");
    await tx.revokedToken.create({
        data: {
            token_hash: tokenHash,
            user_id: staffId,
            user_type: "staff",
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    });
};

/**
 * Send deactivation notification email to staff
 */
export const sendStaffDeactivationNotification = async (staff, reason) => {
    const message = `
Hello ${staff.name},

Your staff account has been suspended by platform administration.

Reason: ${reason || "Not specified"}

What this means:
- You will not be able to log in to your account
- Please contact your administrator or platform support for more information

If you believe this is an error, please contact support.

Best regards,
E-Warrantify Team
    `.trim();

    try {
        await sendEmail(staff.email, "Account Suspended - Action Required", message);
        logger.info(`Staff deactivation notification sent to ${staff.email}`);
    } catch (error) {
        logger.error(`Failed to send staff deactivation notification to ${staff.email}: ${error?.message || error}`);
    }
};

/**
 * Send deactivation notification email to owner when a staff member under their account is deactivated by Super Admin
 * @param {object} staff - Staff object (must include provider with user)
 * @param {string} reason - Reason for deactivation
 */
export const sendOwnerStaffDeactivationNotification = async (staff, reason) => {
    const provider = staff?.provider;
    const ownerEmail = provider?.user?.email;
    if (!ownerEmail) {
        logger.warn(`Provider ${provider?.id} has no owner email - staff deactivation notification not sent`);
        return;
    }
    const ownerName = provider?.user?.first_name || provider?.user?.last_name || "Owner";
    const companyName = provider?.company_name || "your organization";
    const message = `
Dear ${ownerName},

A staff member under your account has been suspended by platform administration.

Staff details:
- Name: ${staff.name || "N/A"}
- Email: ${staff.email || "N/A"}

Reason: ${reason || "Not specified"}

What this means:
- This staff member can no longer log in or access the platform

If you have questions or believe this was done in error, please contact our support team.

Best regards,
E-Warrantify Team
    `.trim();

    try {
        await sendEmail(ownerEmail, `Staff Suspended - ${companyName}`, message);
        logger.info(`Owner deactivation notification sent to ${ownerEmail} for staff ${staff.id}`);
    } catch (error) {
        logger.error(`Failed to send owner staff deactivation notification to ${ownerEmail}: ${error?.message || error}`);
    }
};

/**
 * Send reactivation notification email to owner when a staff member under their account is reactivated by Super Admin
 * @param {object} staff - Staff object (must include provider with user)
 * @returns {Promise<void>}
 */
export const sendOwnerStaffReactivationNotification = async (staff) => {
    const provider = staff?.provider;
    const ownerEmail = provider?.user?.email;
    if (!ownerEmail) {
        logger.warn(`Provider ${provider?.id} has no owner email - staff reactivation notification not sent`);
        return;
    }
    const ownerName = provider?.user?.first_name || provider?.user?.last_name || "Owner";
    const companyName = provider?.company_name || "your organization";
    const message = `
Dear ${ownerName},

A staff member under your account has been reactivated by platform administration.

Staff details:
- Name: ${staff.name || "N/A"}
- Email: ${staff.email || "N/A"}

This staff member can now log in and access the platform.

Best regards,
E-Warrantify Team
    `.trim();

    try {
        await sendEmail(ownerEmail, `Staff Reactivated - ${companyName}`, message);
        logger.info(`Owner reactivation notification sent to ${ownerEmail} for staff ${staff.id}`);
    } catch (error) {
        logger.error(`Failed to send owner staff reactivation notification to ${ownerEmail}: ${error?.message || error}`);
    }
};

/**
 * Send reactivation notification email to staff
 */
export const sendStaffReactivationNotification = async (staff) => {
    const message = `
Hello ${staff.name},

Your staff account has been reactivated.

You can now log in and access your account.

Best regards,
E-Warrantify Team
    `.trim();

    try {
        await sendEmail(staff.email, "Account Reactivated - Welcome Back!", message);
        logger.info(`Staff reactivation notification sent to ${staff.email}`);
    } catch (error) {
        logger.error(`Failed to send staff reactivation notification to ${staff.email}: ${error?.message || error}`);
    }
};
