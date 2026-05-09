import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { verifyStandaloneOtp } from "../../../../services/generate-otp.js";
import { getWarrantyCustomerDetailsByContact } from "./query.js";

/**
 * Verify OTP for warranty customer
 * 
 * Uses standalone Otp table for verification - works for both flows:
 * 1. Activation flow (is_activation=true): Verifies identity for new warranty registration
 *    - Returns success with verified=true (no warranty details since registering)
 * 2. Verification flow (default): Verifies identity to view existing warranties
 *    - Returns customer details and warranty information
 */
const verifyCustomerWarrantyOTPEndpoint = async (req, res) => {
    try {
        logger.info(`verifyCustomerWarrantyOTPEndpoint`);

        const { phone_number, contact, otp, is_activation } = req.body;
        const contactValue = contact || phone_number;

        if (!contactValue || !otp) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Please provide your contact and OTP");
        }

        const contactIsEmail = contactValue.includes("@");
        const contactLabel = contactIsEmail ? "email" : "phone number";

        // Determine OTP purpose based on flow
        const otpPurpose = is_activation ? "activation" : "verification";

        logger.info(`--- Verifying OTP from standalone table for ${contactLabel} ${contactValue} (purpose: ${otpPurpose}) ---`);
        
        // Verify OTP from standalone Otp table
        const otpRecord = await verifyStandaloneOtp(contactValue, otp, otpPurpose);

        if (!otpRecord) {
            logger.error(`--- OTP verification failed ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, "Invalid or expired OTP. Please try again.");
        }
        logger.info(`--- OTP verified successfully ---`);

        // For activation flow, just confirm OTP is valid (customer will fill details next)
        if (is_activation) {
            return returnResponse(res, StatusCodes.OK, "Identity verified successfully", {
                verified: true,
                contact: contactValue,
                contact_type: contactIsEmail ? "email" : "phone"
            });
        }

        // For verification flow, fetch and return warranty customer details
        const provider_warranty_customer = await getWarrantyCustomerDetailsByContact(contactValue);

        if (!provider_warranty_customer || provider_warranty_customer.length === 0) {
            // OTP was valid but no warranties found (edge case)
            return returnResponse(res, StatusCodes.OK, "Identity verified but no warranties found", {
                verified: true,
                customer_details: null
            });
        }

        const currentDate = new Date();
        const warranty_code_data = provider_warranty_customer.map(cust => {
            const warrantyTo = cust.provider_warranty_code?.warranty_to
                ? new Date(cust.provider_warranty_code.warranty_to)
                : null;

            const isExpired = warrantyTo ? warrantyTo < currentDate : true;

            let warrantyDaysLeft = null;
            if (warrantyTo) {
                const diffMs = warrantyTo - currentDate;
                warrantyDaysLeft = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
            }

            return {
                ...cust.provider_warranty_code,
                warranty_code_expired: isExpired,
                warrantyDaysLeft
            };
        });

        let customer_details = {
            first_name: provider_warranty_customer[0].first_name,
            last_name: provider_warranty_customer[0].last_name,
            phone: provider_warranty_customer[0].phone,
            email: provider_warranty_customer[0].email,
            address: provider_warranty_customer[0].address,
            city: provider_warranty_customer[0].city,
            state: provider_warranty_customer[0].state,
            country: provider_warranty_customer[0].country,
            warranty_code: warranty_code_data
        }

        return returnResponse(res, StatusCodes.OK, "Warranty verified successfully", { customer_details });
    } catch (error) {
        logger.error(`verifyCustomerWarrantyOTPEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to verify OTP. Please try again.");
    }
}

export { verifyCustomerWarrantyOTPEndpoint };
