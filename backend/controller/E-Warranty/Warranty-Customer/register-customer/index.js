import { sendEmail, sendEmailWithAttachment, sendEmailWithCertificateAttachment } from "../../../../services/email.js";
import { returnResponse, logger, returnError } from "../../../../services/logger.js";
import { createAuditLog } from "../../../../services/auditLogService.js";
import sendSMS from "../../../../services/sms.js";
import { StatusCodes } from "http-status-codes";
import { renderWarrantyCertificate, attachCompanyLogo } from "../../../../services/pdf/warranty-templates/index.js";
import { getDealerByDealerKey, getProviderById, getWarrantyCodeByAllfields, checkIfWarrantyCodeIsRegistered, updateWarrantyCode, createWarrantyCustomerFromProvider, createWarrantyCustomerFromDealer, createWarrantyCustomerFromCustomer, createDealerRegistrationWithTransaction, createCustomerRegistrationWithTransaction, getDealerByDealerNameAndEmail, getSettingsByProviderId, updateCustomFields, checkWarrantyCodeWithProviderById, getExistingCustomerByProviderAndContact, getMasterCustomerByProviderAndContact } from "./query.js";
import { User } from "../../../../prisma/db-models.js";
import { findGlobalEmailLoginConflict } from "../../../../utils/globalEmailIdentity.js";
import { resolveCustomerAuthUrlFromRequest } from "../../../../utils/resolveRegistrationUrl.js";

const normalizeEmail = (value) => (value || "").trim().toLowerCase();
const normalizePhone = (value) => {
    const digits_only = (value || "").replace(/\D/g, "");
    if (!digits_only) return "";
    return digits_only.length > 10 ? digits_only.slice(-10) : digits_only;
};

/**
 * Find or create a User account for the customer
 * This enables customers to log in to the dashboard after warranty registration
 * 
 * @param {Object} customerData - Customer details from warranty registration
 * @returns {Object} - { user, isNewAccount }
 */
const findOrCreateCustomerAccount = async (customerData) => {
    const { first_name, last_name, phone, email, address, city, state, country } = customerData;
    
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = normalizeEmail(email);
    
    if (!normalizedPhone && !normalizedEmail) {
        logger.warn("Cannot create customer account - no phone or email provided");
        return { user: null, isNewAccount: false };
    }

    try {
        // First, check if user already exists by phone or email
        let existingUser = null;
        
        if (normalizedPhone) {
            existingUser = await User.findFirst({
                where: { phone_number: normalizedPhone }
            });
        }
        
        if (!existingUser && normalizedEmail) {
            existingUser = await User.findFirst({
                where: {
                    email: { equals: normalizedEmail, mode: "insensitive" },
                    is_deleted: false,
                },
            });
        }

        if (existingUser) {
            logger.info(`--- Customer account already exists for ${normalizedPhone || normalizedEmail} ---`);
            return { user: existingUser, isNewAccount: false };
        }

        if (normalizedEmail) {
            const reserved = await findGlobalEmailLoginConflict(normalizedEmail, {});
            if (reserved) {
                logger.warn(
                    `Skipping portal User auto-create: email ${normalizedEmail} is already used as ${reserved}`
                );
                return { user: null, isNewAccount: false };
            }
        }

        // Create new customer account (phone optional when email is present)
        const phoneForAccount = normalizedPhone || null;

        const newUser = await User.create({
            data: {
                first_name: first_name || "",
                last_name: last_name || "",
                phone_number: phoneForAccount,
                email: normalizedEmail || null,
                is_deleted: false,
                address: address || null,
                city: city || null,
                state: state || null,
                user_type: "customer",
                is_phone_verified: !!normalizedPhone,
                is_email_verified: !!normalizedEmail,
                auth_provider: "otp",
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        logger.info(`--- New customer account created for ${normalizedPhone || normalizedEmail} ---`);
        return { user: newUser, isNewAccount: true };

    } catch (error) {
        logger.error(`Error in findOrCreateCustomerAccount: ${error.message}`);
        // Don't fail the warranty registration if account creation fails
        return { user: null, isNewAccount: false };
    }
};

const buildCanonicalCustomerDetails = (masterCustomer, existingWarrantyCustomer) => {
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
            country: masterCustomer.customer_country || ""
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
            country: existingWarrantyCustomer.country || ""
        };
    }

    return null;
};

const registerCustomerEndpoint = async (req, res) => {
    try {
        logger.info(`registerCustomerEndpoint`);

        const data = req.body;
        // console.log(data);

        let {
            provider_id,
            dealer_key,
            is_provider,
            is_dealer,
            is_customer,
            first_name,
            last_name,
            phone,
            email,
            address,
            city,
            state,
            country,
            invoice_number,
            serial_number,
            product_name,
            product_id,
            service_id,
            vehicle_number,
            vehicle_chassis_number,
            warranty_code,
            date_of_installation,
            is_active,
            dealer_name,
            dealer_email,
            warranty_image_url,
            custom_value1,
            custom_value2,
            custom_field_values
        } = data;


        let created_warranty_customer;
        let dealer;
        let provider;
        let existing_customer_profile = null;
        let is_existing_customer = false;

        const checkWarrantyCodeWithProvider = await checkWarrantyCodeWithProviderById(provider_id,warranty_code);
        if (!checkWarrantyCodeWithProvider) {
            logger.error(`--- Warranty code does not belong to provider ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `This warranty code is registered to a different seller. Please enter a valid code from the selected seller.`);
        }
        console.log(checkWarrantyCodeWithProvider, "checkWarrantyCodeWithProvider");
        logger.info(`--- Fetching warranty code with warranty code : ${warranty_code} ---`);
        const warranty_code_data_temp = await getWarrantyCodeByAllfields(warranty_code, product_name, product_id, serial_number);
        console.log(`--- Warranty code data fetched successfully ---`, warranty_code_data_temp);
        if (!warranty_code_data_temp) {
            logger.error(`--- Warranty code not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Unable to register and details are mismatch`);
        }
        logger.info(`--- Warranty code found ---`);

        const updateCustomerFields = await updateCustomFields(warranty_code, custom_value1, custom_value2, custom_field_values);
        if (!updateCustomerFields) {
            logger.error(`--- Failed to update custom fields ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Failed to update custom fields`);
        }

        const warranty_code_data = await getWarrantyCodeByAllfields(warranty_code, product_name, product_id, serial_number);
        console.log(`--- Warranty code data fetched successfully ---`, warranty_code_data);
        if (!warranty_code_data) {
            logger.error(`--- Warranty code not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Unable to register and details are mismatch`);
        }
        logger.info(`--- Warranty code found ---`);


        logger.info(`--- Checking if warranty code is all ready registered for code : ${warranty_code} ---`);
        const is_registered = await checkIfWarrantyCodeIsRegistered(warranty_code, product_name, product_id, serial_number);
        if (is_registered) {
            logger.error(`--- Warranty code is already registered ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Warranty code is already registered`);
        }
        // else if (is_registered === null) {
        //     logger.info(`--- Warranty code is not registered ---`);
        //     return returnError(res, StatusCodes.BAD_REQUEST, `Warranty code is already registered`);
        // }


        logger.info(`--- Warranty code is not registered : ${JSON.stringify(is_registered)} ---`);

        const warranty_days = warranty_code_data.warranty_days;

        const new_warranty_from = new Date(date_of_installation);

        if (isNaN(new_warranty_from)) {
            return res.status(400).json({ message: "Invalid date_of_installation" });
        }

        // Convert to full ISO-8601 DateTime string for Prisma compatibility
        date_of_installation = new_warranty_from.toISOString();

        // Add warranty_days to installation date
        const new_warranty_to = new Date(
            new_warranty_from.getTime() + warranty_days * 24 * 60 * 60 * 1000
        );

        // Always use ISO format for DB & API
        const warranty_from_str = new_warranty_from.toISOString();
        const warranty_to_str = new_warranty_to.toISOString();

        console.log("Warranty FROM:", warranty_from_str);
        console.log("Warranty TO:", warranty_to_str);
        if (is_provider === true && is_dealer === false && is_customer === false) {

            logger.info(`--- Checking if provider exists ---`);
            provider = await getProviderById(provider_id);
            if (!provider) {
                logger.error(`--- Provider not found ---`);
                return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
            }
            logger.info(`--- Provider found ---`);

            logger.error(`--- Owner direct customer warranty activation is not allowed ---`);
            return returnError(res, StatusCodes.FORBIDDEN, `Owner cannot directly activate customer warranty. Please use dealer/customer flow.`);
        }
        if (is_dealer === true && is_provider === false && is_customer === false) {
            console.log("warranty_code_data2nddd", warranty_code_data);
            logger.info(`--- Checking if dealer exists ---`);
            if (dealer_key) {
                console.log(dealer_key, " dealer key");
            }
            dealer = await getDealerByDealerKey(dealer_key);

            console.log(dealer);
            if (!dealer) {
                logger.error(`--- Dealer not found ---`);
                return returnError(res, StatusCodes.NOT_FOUND, `Dealer not found`);
            }
            logger.info(`--- Dealer found ---`);

            const existing_master_customer = await getMasterCustomerByProviderAndContact(dealer.provider.id, phone, email);
            existing_customer_profile = await getExistingCustomerByProviderAndContact(dealer.provider.id, phone, email);

            if (existing_master_customer || existing_customer_profile) {
                if (phone && email && existing_master_customer) {
                    const normalized_input_phone = normalizePhone(phone);
                    const normalized_input_email = normalizeEmail(email);
                    const normalized_master_phone = normalizePhone(existing_master_customer.customer_phone);
                    const normalized_master_email = normalizeEmail(existing_master_customer.customer_email);

                    if (
                        (normalized_master_phone && normalized_master_phone !== normalized_input_phone) ||
                        (normalized_master_email && normalized_master_email !== normalized_input_email)
                    ) {
                        logger.error(`--- Dealer entered mismatched customer phone/email pair ---`);
                        return returnError(
                            res,
                            StatusCodes.BAD_REQUEST,
                            `Phone and email do not belong to the same customer profile`
                        );
                    }
                }

                const canonical_details = buildCanonicalCustomerDetails(existing_master_customer, existing_customer_profile);
                if (canonical_details) {
                    first_name = canonical_details.first_name || first_name;
                    last_name = canonical_details.last_name || last_name;
                    phone = canonical_details.phone || phone;
                    email = canonical_details.email || email;
                    address = canonical_details.address || address;
                    city = canonical_details.city || city;
                    state = canonical_details.state || state;
                    country = canonical_details.country || country;
                }
                is_existing_customer = true;
            } else {
                logger.info(`--- New customer, no existing master record ---`);
            }

            if (warranty_code_data.warranty_code_status === "Active") {
                logger.error(`--- Warranty code is already activated ---`);
                return returnError(res, StatusCodes.BAD_REQUEST, `Warranty is already activated`);
            }

            if (warranty_code_data.warranty_code_status !== "Inactive") {
                logger.error(`--- Warranty code is not in an assignable status ---`);
                return returnError(res, StatusCodes.BAD_REQUEST, `Warranty cannot be activated from current status`);
            }

            // Enforce dealer-specific assignment: dealer can register only codes assigned to them.
            if (!warranty_code_data.assigned_dealer_id || warranty_code_data.assigned_dealer_id !== dealer.id) {
                logger.error(`--- Warranty code is not assigned to this dealer ---`);
                return returnError(res, StatusCodes.FORBIDDEN, `This warranty code is not assigned to this dealer`);
            }

            logger.info(`--- Creating new warranty customer and updating warranty code status (transactional) ---`);
            try {
                const dealerProviderSettings = await getSettingsByProviderId(dealer.provider.id);
                const certificateTemplate = (dealerProviderSettings?.certificate_template || 'classic').toString().trim();
                const transactionResult = await createDealerRegistrationWithTransaction(
                    {
                        provider_id: dealer.provider.id,
                        dealer_id: dealer.id,
                        warranty_code_id: warranty_code_data.id,
                        is_provider,
                        is_dealer,
                        is_customer,
                        first_name,
                        last_name,
                        phone,
                        email,
                        address,
                        city,
                        state,
                        country,
                        invoice_number,
                        serial_number: warranty_code_data?.serial_no,
                        product_name: warranty_code_data?.product_name,
                        product_id: warranty_code_data?.product_id,
                        service_id: warranty_code_data?.service_id,
                        vehicle_number,
                        vehicle_chassis_number,
                        warranty_code,
                        date_of_installation,
                        dealer_name: dealer.name,
                        dealer_email: dealer.email,
                        is_active,
                        warranty_image_url,
                        certificate_template: certificateTemplate
                    },
                    {
                        warranty_code,
                        warranty_from: new_warranty_from,
                        warranty_to: new_warranty_to,
                        status: "Active"
                    }
                );
                created_warranty_customer = transactionResult.customer;
                logger.info(`--- Warranty customer created and warranty code updated to Active (transactional) ---`);
            } catch (txError) {
                logger.error(`--- Transaction failed: ${txError.message} ---`);
                return returnError(res, StatusCodes.BAD_REQUEST, `Failed to create warranty customer: ${txError.message}`);
            }
        }
        if (is_customer === true && is_provider === false && is_dealer === false) {
            logger.info(`--- Checking if dealer exists ---`);
            dealer = await getDealerByDealerNameAndEmail(dealer_name, dealer_email);
            if (!dealer) {
                logger.error(`--- Dealer not found ---`);
                return returnError(res, StatusCodes.NOT_FOUND, `Dealer not found`);
            }
            logger.info(`--- Dealer found ---`);

            const existing_master_customer = await getMasterCustomerByProviderAndContact(dealer.provider.id, phone, email);
            existing_customer_profile = await getExistingCustomerByProviderAndContact(dealer.provider.id, phone, email);

            if (existing_master_customer || existing_customer_profile) {
                if (phone && email && existing_master_customer) {
                    const normalized_input_phone = normalizePhone(phone);
                    const normalized_input_email = normalizeEmail(email);
                    const normalized_master_phone = normalizePhone(existing_master_customer.customer_phone);
                    const normalized_master_email = normalizeEmail(existing_master_customer.customer_email);

                    if (
                        (normalized_master_phone && normalized_master_phone !== normalized_input_phone) ||
                        (normalized_master_email && normalized_master_email !== normalized_input_email)
                    ) {
                        logger.error(`--- Customer entered mismatched phone/email pair ---`);
                        return returnError(
                            res,
                            StatusCodes.BAD_REQUEST,
                            `Phone and email do not belong to the same customer profile`
                        );
                    }
                }

                const canonical_details = buildCanonicalCustomerDetails(existing_master_customer, existing_customer_profile);
                if (canonical_details) {
                    first_name = canonical_details.first_name || first_name;
                    last_name = canonical_details.last_name || last_name;
                    phone = canonical_details.phone || phone;
                    email = canonical_details.email || email;
                    address = canonical_details.address || address;
                    city = canonical_details.city || city;
                    state = canonical_details.state || state;
                    country = canonical_details.country || country;
                }
                is_existing_customer = true;
            } else {
                logger.info(`--- New customer, no existing master record ---`);
            }

            if (warranty_code_data.warranty_code_status !== "Inactive") {
                logger.error(`--- Warranty code cannot be registered from current status ---`);
                return returnError(res, StatusCodes.BAD_REQUEST, `Warranty cannot be activated from current status`);
            }

            // Enforce dealer-specific assignment for customer self-registration.
            if (!warranty_code_data.assigned_dealer_id || warranty_code_data.assigned_dealer_id !== dealer.id) {
                logger.error(`--- Warranty code is not assigned to selected dealer ---`);
                return returnError(res, StatusCodes.FORBIDDEN, `This warranty code is not assigned to the selected dealer`);
            }

            logger.info(`--- Creating new warranty customer and updating warranty code status (transactional) ---`);
            try {
                const customerProviderSettings = await getSettingsByProviderId(dealer.provider.id);
                const certificateTemplate = (customerProviderSettings?.certificate_template || 'classic').toString().trim();
                const transactionResult = await createCustomerRegistrationWithTransaction(
                    {
                        provider_id: dealer.provider.id,
                        dealer_id: dealer.id,
                        warranty_code_id: warranty_code_data.id,
                        is_provider,
                        is_dealer,
                        is_customer,
                        first_name,
                        last_name,
                        phone,
                        email,
                        address,
                        city,
                        state,
                        country,
                        invoice_number,
                        serial_number: warranty_code_data?.serial_no,
                        product_name: warranty_code_data?.product_name,
                        product_id: warranty_code_data?.product_id,
                        service_id,
                        vehicle_number,
                        vehicle_chassis_number,
                        warranty_code,
                        date_of_installation,
                        dealer_name: dealer.name,
                        dealer_email: dealer.email,
                        is_active,
                        warranty_image_url,
                        certificate_template: certificateTemplate
                    },
                    {
                        warranty_code,
                        warranty_from: new_warranty_from,
                        warranty_to: new_warranty_to,
                        status: "Active"
                    }
                );
                created_warranty_customer = transactionResult.customer;
                logger.info(`--- Warranty customer created and warranty code updated to Active (transactional) ---`);
            } catch (txError) {
                logger.error(`--- Transaction failed: ${txError.message} ---`);
                return returnError(res, StatusCodes.BAD_REQUEST, `Failed to create warranty customer: ${txError.message}`);
            }
        }

        const expirydate = new_warranty_to.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

        let comapanyName;
        let companyLogo;
        let custom_field_name1;
        let custom_field_name2;
        let custom_field_value1;
        let custom_field_value2;
        let dynamicCustomFields = [];

        const resolvedProviderId = is_provider ? provider_id : dealer.provider.id;
        const providerData = await getProviderById(resolvedProviderId);
        comapanyName = providerData.company_name;
        companyLogo = providerData.company_logo;

        const providerSettings = await getSettingsByProviderId(resolvedProviderId);
        if (providerSettings) {
            custom_field_name1 = providerSettings.custom_field1;
            custom_field_name2 = providerSettings.custom_field2;
        }
        custom_field_value1 = warranty_code_data.custom_value1;
        custom_field_value2 = warranty_code_data.custom_value2;

        const savedCustomFieldValues = warranty_code_data.custom_field_values;
        if (savedCustomFieldValues && typeof savedCustomFieldValues === 'object') {
            dynamicCustomFields = Object.entries(savedCustomFieldValues).map(([label, value]) => ({ label, value }));
        }

        // if (!is_customer) {
        //     logger.info(`--- Sending SMS to customer ---`);
        //     // const message = `Welcome! your e-warranty number - ${warranty_code}, is valid until ${expirydate}. Powered by GVCC Solutions Pvt Ltd.`
        //     const message = `Welcome!\n\nYour E-Warranty for ${provider?.company_name} number-${warranty_code}, is valid Until ${expirydate}.\n\nThank you!\n\nPowered by GVCC Solutions Private Limited.`
        //     // await sendSMS(phone, message);
        //     logger.info(`--- SMS sent to customer ---`);

        //     logger.info(`--- Sending email to customer ---`);
        //     // const email_message = `Welcome! your e-warranty number - ${warranty_code}, is valid until ${expirydate}. Powered by ${comapanyName}`
        //     const companyNameForEmail = is_provider ? provider?.company_name : dealer?.provider?.company_name;
        //     const email_message = `Welcome!\n\nYour E-Warranty for ${companyNameForEmail} number-${warranty_code}, is valid Until ${expirydate}.\n\nThank you!\nPowered by GVCC Solutions Private Limited.`
        //     await sendEmail(email, "Warranty Registration", email_message);
        //     logger.info(`--- Email sent to customer ---`);
        // }

        const warrantyStartDateFormatted = new Date(date_of_installation).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const sellerName = is_provider ? (provider?.company_name || comapanyName) : (dealer?.provider?.company_name ?? comapanyName) || 'N/A';
        const instNameDealer = is_provider ? (provider?.company_name || comapanyName) : (dealer?.name ?? comapanyName) || 'N/A';

        const nameParts = [first_name, last_name].filter(Boolean).map((s) => String(s).trim());
        const customerName = nameParts.length === 2 && nameParts[0] === nameParts[1] ? nameParts[0] : nameParts.join(' ');
        const certificateData = {
            customerName,
            productName: warranty_code_data?.product_name || '',
            itemCode: warranty_code_data?.product_id || warranty_code_data?.service_id || '',
            warrantyStartDate: warrantyStartDateFormatted,
            warrantyEndDate: expirydate,
            sellerName,
            dopInstallation: warrantyStartDateFormatted,
            instNameDealer,
            vehicleNumber: vehicle_number || '',
            vehicleChassisNumber: vehicle_chassis_number || '',
            custom_field_name1: custom_field_name1 || '',
            custom_field_value1: custom_field_value1 || '',
            custom_field_name2: custom_field_name2 || '',
            custom_field_value2: custom_field_value2 || '',
            phone: phone || '',
            serialNo: warranty_code_data?.serial_no || '',
            warrantyCode: warranty_code || '',
            invoiceNumber: invoice_number || '',
            companyName: comapanyName || '',
            companyLogoUrl: companyLogo || '',
            signatureImageUrl: providerData?.signature_image || '',
            qrCodeImageUrl: providerData?.qr_code_image || '',
            company_website: providerData?.company_website || '',
            terms_and_conditions: Array.isArray(warranty_code_data?.terms_and_conditions)
                ? warranty_code_data.terms_and_conditions.join('\n')
                : (warranty_code_data?.terms_and_conditions || ''),
            terms_and_conditions_link: warranty_code_data?.terms_and_conditions_link || warranty_code_data?.terms_url || '',
        };

        await attachCompanyLogo(certificateData);
        // Use ONLY provider settings (Warranty Settings) so selected template is always used
        const rawTemplate = (providerSettings?.certificate_template || 'classic').toString().trim();
        const templateId = rawTemplate.toLowerCase();
        logger.info(`Certificate PDF: provider_template="${providerSettings?.certificate_template ?? 'none'}", using="${templateId}"`);
        const finalString = await renderWarrantyCertificate(templateId, certificateData);

        const companyNameForEmail = is_provider ? provider?.company_name : dealer?.provider?.company_name;
        const loginUrl = resolveCustomerAuthUrlFromRequest(req);
        const loginCta = loginUrl
            ? `<br><br><a href="${loginUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:600">Log in to your dashboard</a>
               <br><span style="font-size:12px;color:#64748b">Or copy this link: ${loginUrl}</span>`
            : "";
        const message = `Welcome!<br><br>Your ${companyNameForEmail} E-Warranty number-${warranty_code}, is valid Until ${expirydate}.${loginCta}<br><br>Thank you!<br>Powered by GVCC Solutions Private Limited.`;
        const fileName = `${first_name} ${last_name} ${companyNameForEmail} - Warranty.pdf`;

        if (!is_customer) {
            await sendEmailWithCertificateAttachment(email, "Warranty Document", message, finalString, fileName);
        }

        const performedBy = is_dealer && dealer ? `dealer:${dealer.id}` : is_customer && dealer ? `customer:${email || phone}` : "system";
        createAuditLog({
            entity_type: "WarrantyRegistration",
            entity_id: created_warranty_customer?.id || warranty_code,
            action: "REGISTER",
            performed_by: performedBy,
            old_values: null,
            new_values: { warranty_code, product_name, status: is_dealer ? "Active" : "Pending" },
            ip_address: req.ip || req.headers?.["x-forwarded-for"] || null,
            user_agent: req.headers?.["user-agent"] || null,
        }).catch((err) => logger.warn(`Audit log failed: ${err.message}`));

        // Auto-create customer account for dashboard access (only for customer self-registration)
        let customerAccount = null;
        let isNewAccount = false;
        
        if (is_customer) {
            const accountResult = await findOrCreateCustomerAccount({
                first_name,
                last_name,
                phone,
                email,
                address,
                city,
                state,
                country
            });
            customerAccount = accountResult.user;
            isNewAccount = accountResult.isNewAccount;

            // Send welcome email for new accounts
            if (isNewAccount && email) {
                const loginUrl = resolveCustomerAuthUrlFromRequest(req);
                const welcomeMessage = `
                    <h2>Welcome to ${companyNameForEmail}!</h2>
                    <p>Your warranty has been registered successfully.</p>
                    <p><strong>Warranty Code:</strong> ${warranty_code}</p>
                    <p><strong>Product:</strong> ${warranty_code_data?.product_name || product_name}</p>
                    <p><strong>Valid Until:</strong> ${expirydate}</p>
                    <br>
                    <p><strong>Good news!</strong> Your account has been created automatically.</p>
                    <p>You can now log in to your dashboard to:</p>
                    <ul>
                        <li>View all your warranties</li>
                        <li>File warranty claims</li>
                        <li>Contact support</li>
                        <li>Register more products</li>
                    </ul>
                    ${
                        loginUrl
                            ? `<p><a href="${loginUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:600">Log in to your dashboard</a></p>
                               <p style="font-size:12px;color:#64748b;margin-top:8px">If the button doesn’t work, copy and paste this link: <br><span>${loginUrl}</span></p>`
                            : `<p>Simply visit our website and log in with your phone number or email - no password needed, just verify with OTP!</p>`
                    }
                    <br>
                    <p>Thank you for choosing ${companyNameForEmail}!</p>
                    <p>Powered by GVCC Solutions Private Limited.</p>
                `;
                
                sendEmail(email, `Welcome to ${companyNameForEmail} - Your Account is Ready!`, welcomeMessage, { html: true })
                    .catch((err) => logger.warn(`Welcome email failed: ${err.message}`));
            }
        }

        return returnResponse(res, StatusCodes.OK, `Successfully created customer details!`, {
            created_warranty_customer: created_warranty_customer,
            finalString,
            customer_profile_status: is_existing_customer ? "EXISTING_CUSTOMER" : "NEW_CUSTOMER",
            existing_customer_profile_id: existing_customer_profile?.id || null,
            // New: Account info for dashboard access
            account_created: isNewAccount,
            has_account: !!customerAccount,
            can_access_dashboard: !!customerAccount
        });

    } catch (error) {
        logger.error(`registerCustomerEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to register customer`);
    }
}

export { registerCustomerEndpoint, findOrCreateCustomerAccount };