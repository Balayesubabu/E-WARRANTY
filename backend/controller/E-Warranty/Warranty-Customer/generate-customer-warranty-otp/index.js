import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { createStandaloneOtp } from "../../../../services/generate-otp.js";
import sendSMS from "../../../../services/sms.js";
import { sendEmail } from "../../../../services/email.js";
import { getProviderWarrantyCustomerByContact } from "./query.js";

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/**
 * Generate OTP for warranty customer verification
 * 
 * Uses standalone Otp table - works for both new and existing customers
 * 
 * Supports two flows:
 * 1. Activation flow (is_activation=true): New customer activating warranty via QR code
 *    - Skips existing warranty check since they're registering for the first time
 *    - OTP stored in Otp table with purpose="activation"
 * 2. Verification flow (default): Existing customer checking their warranties
 *    - Requires existing warranty records
 *    - OTP stored in Otp table with purpose="verification"
 */
const generateCustomerWarrantyOTPEndpoint = async (req, res) => {
    try {
        logger.info(`generateCustomerWarrantyOTPEndpoint`);

        const { phone_number, contact, is_activation } = req.body;
        const contactValue = contact || phone_number;

        if (!contactValue) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Please provide an email or phone number");
        }

        const contactIsEmail = isEmail(contactValue);
        const contactLabel = contactIsEmail ? "email" : "phone number";

        // Determine OTP purpose based on flow
        const otpPurpose = is_activation ? "activation" : "verification";

        // For verification flow, check if customer has existing warranties
        // For activation flow, skip this check (new customers registering first warranty)
        if (!is_activation) {
            logger.info(`--- Checking if provider warranty customer exists with ${contactLabel} ${contactValue} ---`);
            const provider_warranty_customer = await getProviderWarrantyCustomerByContact(contactValue);
            if (!provider_warranty_customer || provider_warranty_customer.length === 0) {
                logger.error(`--- Provider warranty customer does not exist ---`);
                return returnError(res, StatusCodes.BAD_REQUEST, `No warranty found for this ${contactLabel}. Please check and try again.`);
            }
            logger.info(`--- Provider warranty customer exists ---`);
        } else {
            logger.info(`--- Activation flow: Skipping existing warranty check for ${contactLabel} ${contactValue} ---`);
        }

        // Create OTP in standalone Otp table (works for new and existing customers)
        const otp_data = await createStandaloneOtp(contactValue, otpPurpose);

        if (contactIsEmail) {
            logger.info(`--- Sending OTP to email ${contactValue} ---`);
            try {
                await sendEmail(
                    contactValue,
                    "Your Warranty Verification OTP",
                    `Your OTP for warranty verification is: ${otp_data.otp}\n\nThis OTP is valid for ${parseInt(process.env.OTP_EXPIRY_TIME) || 5} minutes.\n\nIf you did not request this, please ignore this email.`
                );
                logger.info(`--- OTP email sent ---`);
            } catch (emailErr) {
                logger.warn(`--- Email sending failed, OTP is logged in console ---`);
            }
        } else {
            logger.info(`--- Sending OTP to phone ${contactValue} ---`);
            try {
                await sendSMS(contactValue, 'Phone+Validation+From+GVCC&var1=' + otp_data.otp);
                logger.info(`--- OTP sent via SMS ---`);
            } catch (smsErr) {
                logger.error(`--- SMS sending failed: ${smsErr.message} ---`);
                return returnError(
                    res,
                    StatusCodes.BAD_GATEWAY,
                    smsErr.message?.includes("Invalid phone")
                        ? smsErr.message
                        : "Failed to send OTP to your phone. Please try with your email address instead."
                );
            }
        }

        const maskedContact = contactIsEmail
            ? contactValue.replace(/(.{2})(.*)(@.*)/, '$1***$3')
            : contactValue.replace(/(\d{2})\d+(\d{2})/, '$1****$2');

        return returnResponse(res, StatusCodes.OK, `OTP sent to ${maskedContact}`, {
            contact_type: contactIsEmail ? "email" : "phone",
            masked_contact: maskedContact
        });
    } catch (error) {
        logger.error(`generateCustomerWarrantyOTPEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to generate OTP. Please try again.`);
    }
}

export { generateCustomerWarrantyOTPEndpoint };
