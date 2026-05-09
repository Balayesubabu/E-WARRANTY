import { ProviderProductWarrantyCode } from "../../../../prisma/db-models.js";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getExistingCustomerByProviderAndContact, getMasterCustomerByProviderAndContact } from "../register-customer/query.js";

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const normalizePhone = (value) => {
    const digits = (value || "").replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
};

const buildProfile = (masterCustomer, existingWarrantyCustomer) => {
    if (masterCustomer) {
        const fullName = (masterCustomer.customer_name || "").trim();
        const [firstName = "", ...rest] = fullName.split(" ");
        const lastName = rest.join(" ");
        return {
            first_name: firstName,
            last_name: lastName,
            phone: masterCustomer.customer_phone || "",
            email: masterCustomer.customer_email || "",
            address: masterCustomer.customer_address || "",
            city: masterCustomer.customer_city || "",
            state: masterCustomer.customer_state || "",
            country: masterCustomer.customer_country || "",
            invoice_number: "",
        };
    }
    if (existingWarrantyCustomer) {
        return {
            first_name: existingWarrantyCustomer.first_name || "",
            last_name: existingWarrantyCustomer.last_name || "",
            phone: existingWarrantyCustomer.phone || "",
            email: existingWarrantyCustomer.email || "",
            address: existingWarrantyCustomer.address || "",
            city: existingWarrantyCustomer.city || "",
            state: existingWarrantyCustomer.state || "",
            country: existingWarrantyCustomer.country || "",
            invoice_number: existingWarrantyCustomer.invoice_number || "",
        };
    }
    return null;
};

/**
 * Check if contact belongs to an existing customer for this provider.
 * Used during QR activation: if existing, skip OTP and pre-fill form.
 * Works for both manual (phone/email) and Google-created accounts - we match by contact.
 */
const checkExistingForActivationEndpoint = async (req, res) => {
    try {
        logger.info("checkExistingForActivationEndpoint");

        const { activation_token, contact } = req.body;

        if (!activation_token || !contact || !String(contact).trim()) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Activation token and contact (phone or email) are required");
        }

        const contactValue = String(contact).trim();
        const contactIsEmail = isEmail(contactValue);
        const phone = contactIsEmail ? "" : contactValue;
        const email = contactIsEmail ? contactValue : "";

        const code = await ProviderProductWarrantyCode.findUnique({
            where: { activation_token: activation_token },
            include: { provider: { select: { id: true } } },
        });

        if (!code || !code.provider) {
            return returnError(res, StatusCodes.NOT_FOUND, "Invalid or expired activation token");
        }

        if (code.is_deleted) {
            return returnError(res, StatusCodes.GONE, "This warranty code has been deactivated");
        }

        const isRegistered = code.warranty_code_status === "Active" || code.warranty_code_status === "Pending";
        if (isRegistered) {
            return returnError(res, StatusCodes.BAD_REQUEST, "This warranty has already been registered");
        }

        const providerId = code.provider.id;

        let existingWarrantyCustomer = await getExistingCustomerByProviderAndContact(providerId, phone, email);

        if (!existingWarrantyCustomer && phone) {
            const normalizedPhone = normalizePhone(contactValue);
            if (normalizedPhone && normalizedPhone !== phone) {
                existingWarrantyCustomer = await getExistingCustomerByProviderAndContact(providerId, normalizedPhone, "");
            }
        }

        let masterCustomer = await getMasterCustomerByProviderAndContact(providerId, phone, email);

        if (!existingWarrantyCustomer && !masterCustomer) {
            return returnResponse(res, StatusCodes.OK, "New customer", {
                isExistingCustomer: false,
                profile: null,
            });
        }

        const profile = buildProfile(masterCustomer, existingWarrantyCustomer);
        if (!profile) {
            return returnResponse(res, StatusCodes.OK, "New customer", {
                isExistingCustomer: false,
                profile: null,
            });
        }

        logger.info(`--- Existing customer found for ${contactIsEmail ? "email" : "phone"}, pre-fill profile ---`);

        return returnResponse(res, StatusCodes.OK, "Existing customer found", {
            isExistingCustomer: true,
            profile,
        });
    } catch (error) {
        logger.error(`checkExistingForActivationEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to check customer status");
    }
};

export default checkExistingForActivationEndpoint;
