import { User, ProviderWarrantyCustomer, Staff, ProviderDealer, Otp } from "../prisma/db-models.js";
import { logger } from "./logger.js";

// ═══════════════════════════════════════════════════════════════
// Standalone OTP Functions - Uses dedicated Otp table
// Works for any contact (email/phone) without requiring existing records
// ═══════════════════════════════════════════════════════════════

/**
 * Create a standalone OTP in the Otp table
 * Works for any contact - new or existing customers
 * @param {string} contact - Email or phone number
 * @param {string} purpose - "activation", "verification", "login", etc.
 * @returns {Object} - { otp, expires_at }
 */
const createStandaloneOtp = async (contact, purpose = "verification") => {
    try {
        logger.info(`createStandaloneOtp for ${contact} (purpose: ${purpose})`);

        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_TIME) || 1;
        const expires_at = new Date();
        expires_at.setMinutes(expires_at.getMinutes() + expiryMinutes);

        // Delete any existing OTPs for this contact and purpose
        await Otp.deleteMany({
            where: {
                contact: contact,
                purpose: purpose
            }
        });

        // Create new OTP record
        await Otp.create({
            data: {
                contact: contact,
                otp: `${otp}`,
                purpose: purpose,
                expires_at: expires_at,
                verified: false,
                attempts: 0
            }
        });

        logger.info(`--- Standalone OTP created for ${contact} ---`);

        console.log(`\n========================================`);
        console.log(`  STANDALONE OTP for ${contact}: ${otp} (expires in ${expiryMinutes} min)`);
        console.log(`  Purpose: ${purpose}`);
        console.log(`========================================\n`);

        return { otp, expires_at };
    } catch (error) {
        logger.error('Error in createStandaloneOtp:', error);
        throw error;
    }
};

/**
 * Verify a standalone OTP from the Otp table
 * @param {string} contact - Email or phone number
 * @param {string} otp - The OTP to verify
 * @param {string} purpose - "activation", "verification", "login", etc.
 * @returns {Object|null} - OTP record if valid, null if invalid
 */
const verifyStandaloneOtp = async (contact, otp, purpose = "verification") => {
    try {
        logger.info(`verifyStandaloneOtp for ${contact} (purpose: ${purpose})`);

        const otpRecord = await Otp.findFirst({
            where: {
                contact: contact,
                otp: `${otp}`,
                purpose: purpose,
                expires_at: {
                    gte: new Date()
                },
                verified: false
            }
        });

        if (!otpRecord) {
            // Increment attempts for rate limiting (find any OTP for this contact)
            await Otp.updateMany({
                where: {
                    contact: contact,
                    purpose: purpose
                },
                data: {
                    attempts: {
                        increment: 1
                    }
                }
            });
            logger.error(`--- OTP verification failed for ${contact} ---`);
            return null;
        }

        // Mark as verified
        await Otp.update({
            where: {
                id: otpRecord.id
            },
            data: {
                verified: true
            }
        });

        logger.info(`--- OTP verified successfully for ${contact} ---`);
        return otpRecord;
    } catch (error) {
        logger.error('Error in verifyStandaloneOtp:', error);
        throw error;
    }
};

/**
 * Cleanup expired OTPs (can be called periodically)
 */
const cleanupExpiredOtps = async () => {
    try {
        const result = await Otp.deleteMany({
            where: {
                expires_at: {
                    lt: new Date()
                }
            }
        });
        logger.info(`--- Cleaned up ${result.count} expired OTPs ---`);
        return result.count;
    } catch (error) {
        logger.error('Error in cleanupExpiredOtps:', error);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════════
// Legacy OTP Functions - Uses entity-specific tables
// Kept for backward compatibility with existing login flows
// ═══════════════════════════════════════════════════════════════

const generateOTP = async (user_id, expiryMinutesOverride) => {
    try {
        logger.info("generateOTP");

        logger.info(`--- Generating OTP for user ${user_id} ---`);
        const otp = Math.floor(100000 + Math.random() * 900000);
        logger.info(`--- OTP generated: ${otp} ---`);

        const expiryMinutes = expiryMinutesOverride != null ? expiryMinutesOverride : (parseInt(process.env.OTP_EXPIRY_TIME) || 5);
        logger.info(`--- Setting OTP expiry to ${expiryMinutes} minutes from now ---`);
        const otp_expiry = new Date();
        otp_expiry.setMinutes(otp_expiry.getMinutes() + expiryMinutes);
        logger.info(`--- OTP expiry: ${otp_expiry} ---`);

        logger.info(`--- Updating user with OTP and OTP expiry ---`);
        await User.update({
            where: {
                id: user_id
            },
            data: {
                otp: `${otp}`,
                otp_expiry: otp_expiry
            }
        });
        logger.info(`--- OTP updated for user ${user_id} ---`);

        console.log(`\n========================================`);
        console.log(`  USER OTP: ${otp} (expires in ${expiryMinutes} min)`);
        console.log(`========================================\n`);

        return { otp, otp_expiry };
    } catch (error) {
        logger.error('Error in generateOTP:', error);
        throw error;
    }
}

const generateOTPForWarrantyCustomer = async (phone_number) => {
    try {
        logger.info("generateOTPForWarrantyCustomer");

        logger.info(`--- Generating OTP for phone number ${phone_number} ---`);
        const otp = Math.floor(100000 + Math.random() * 900000);
        logger.info(`--- OTP generated: ${otp} ---`);

        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_TIME) || 5;
        logger.info(`--- Setting OTP expiry to ${expiryMinutes} minutes from now ---`);
        const otp_expiry = new Date();
        otp_expiry.setMinutes(otp_expiry.getMinutes() + expiryMinutes);
        logger.info(`--- OTP expiry: ${otp_expiry} ---`);

        logger.info(`--- Updating user with OTP and OTP expiry ---`);
        await ProviderWarrantyCustomer.updateMany({
            where: {
                phone: phone_number
            },
            data: {
                otp: `${otp}`,
                otp_expiry: otp_expiry
            }
        });
        logger.info(`--- OTP updated for phone number ${phone_number} ---`);

        console.log(`\n========================================`);
        console.log(`  CUSTOMER OTP for ${phone_number}: ${otp} (expires in ${expiryMinutes} min)`);
        console.log(`========================================\n`);

        return { otp, otp_expiry };
    } catch (error) {
        logger.error('Error in generateOTP:', error);
        throw error;
    }
}

const generateOTPForWarrantyCustomerByEmail = async (email) => {
    try {
        logger.info("generateOTPForWarrantyCustomerByEmail");

        logger.info(`--- Generating OTP for email ${email} ---`);
        const otp = Math.floor(100000 + Math.random() * 900000);
        logger.info(`--- OTP generated: ${otp} ---`);

        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_TIME) || 5;
        logger.info(`--- Setting OTP expiry to ${expiryMinutes} minutes from now ---`);
        const otp_expiry = new Date();
        otp_expiry.setMinutes(otp_expiry.getMinutes() + expiryMinutes);
        logger.info(`--- OTP expiry: ${otp_expiry} ---`);

        logger.info(`--- Updating warranty customer with OTP and OTP expiry ---`);
        await ProviderWarrantyCustomer.updateMany({
            where: {
                email: email
            },
            data: {
                otp: `${otp}`,
                otp_expiry: otp_expiry
            }
        });
        logger.info(`--- OTP updated for email ${email} ---`);

        console.log(`\n========================================`);
        console.log(`  CUSTOMER OTP for ${email}: ${otp} (expires in ${expiryMinutes} min)`);
        console.log(`========================================\n`);

        return { otp, otp_expiry };
    } catch (error) {
        logger.error('Error in generateOTPForWarrantyCustomerByEmail:', error);
        throw error;
    }
}

const generateOTPForStaff = async (phone_number) => {
    try {
        logger.info("generateOTPForStaff");

        logger.info(`--- Generating OTP for phone number ${phone_number} ---`);
        const otp = Math.floor(100000 + Math.random() * 900000);
        logger.info(`--- OTP generated: ${otp} ---`);

        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_TIME) || 5;
        logger.info(`--- Setting OTP expiry to ${expiryMinutes} minutes from now ---`);
        const otp_expiry = new Date();
        otp_expiry.setMinutes(otp_expiry.getMinutes() + expiryMinutes);
        logger.info(`--- OTP expiry: ${otp_expiry} ---`);

        logger.info(`--- Updating staff with OTP and OTP expiry ---`);
        await Staff.updateMany({
            where: {
                phone: phone_number
            },
            data: {
                otp: `${otp}`,
                otp_expiry: otp_expiry
            }
        });
        logger.info(`--- OTP updated for phone number ${phone_number} ---`);

        console.log(`\n========================================`);
        console.log(`  STAFF OTP for ${phone_number}: ${otp} (expires in ${expiryMinutes} min)`);
        console.log(`========================================\n`);

        return { otp, otp_expiry };
    } catch (error) {
        logger.error('Error in generateOTPForStaff:', error);
        throw error;
    }
}

const generateOTPForDealer = async (phone_number) => {
    try {
        logger.info("generateOTPForDealer");

        logger.info(`--- Generating OTP for phone number ${phone_number} ---`);
        const otp = Math.floor(100000 + Math.random() * 900000);
        logger.info(`--- OTP generated: ${otp} ---`);

        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_TIME) || 5;
        logger.info(`--- Setting OTP expiry to ${expiryMinutes} minutes from now ---`);
        const otp_expiry = new Date();
        otp_expiry.setMinutes(otp_expiry.getMinutes() + expiryMinutes);
        logger.info(`--- OTP expiry: ${otp_expiry} ---`);

        logger.info(`--- Updating dealer with OTP and OTP expiry ---`);
        await ProviderDealer.updateMany({
            where: {
                phone_number: phone_number
            },
            data: {
                otp: `${otp}`,
                otp_expiry: otp_expiry
            }
        });
        logger.info(`--- OTP updated for phone number ${phone_number} ---`);

        console.log(`\n========================================`);
        console.log(`  DEALER OTP for ${phone_number}: ${otp} (expires in ${expiryMinutes} min)`);
        console.log(`========================================\n`);

        return { otp, otp_expiry };
    } catch (error) {
        logger.error('Error in generateOTPForDealer:', error);
        throw error;
    }
}

export { 
    generateOTP, 
    generateOTPForWarrantyCustomer, 
    generateOTPForWarrantyCustomerByEmail, 
    generateOTPForStaff, 
    generateOTPForDealer,
    // Standalone OTP functions (new - uses Otp table)
    createStandaloneOtp,
    verifyStandaloneOtp,
    cleanupExpiredOtps
};