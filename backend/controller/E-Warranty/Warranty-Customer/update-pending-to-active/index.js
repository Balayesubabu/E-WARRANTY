import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getPendingCustomers, updatePendingCustomersToActive, getWarrantyCodeByWarrantyCode, getDealerByDealerId, getWarrantyRegisterCustomerById, getProviderById, getSettingsByProviderId } from "./query.js";
import { sendEmailWithCertificateAttachment } from "../../../../services/email.js";
import { renderWarrantyCertificate, attachCompanyLogo } from "../../../../services/pdf/warranty-templates/index.js";

const updatePendingToActiveEndpoint = async (req, res) => {
    try {
        logger.info(`updatePendingToActiveEndpoint`);

        const user_id = req.user_id;

        const { warranty_code, registered_customer_id } = req.body;

        logger.info(`--- Getting provider details with user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with user_id : ${user_id} ---`);

        logger.info(`--- Getting pending customers with warranty_code : ${warranty_code} and registered_customer_id : ${registered_customer_id} ---`);
        const pending_customers = await getPendingCustomers(warranty_code, registered_customer_id);
        if (!pending_customers) {
            logger.error(`--- Pending customers not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Pending customers not found`);
        }
        logger.info(`--- Pending customers found with warranty_code : ${warranty_code} and registered_customer_id : ${registered_customer_id} ---`);

        logger.info(`--- Updating pending customers to active with warranty_code : ${warranty_code} and registered_customer_id : ${registered_customer_id} ---`);
        const updated_customers = await updatePendingCustomersToActive(warranty_code, registered_customer_id);
        if (!updated_customers) {
            logger.error(`--- Failed to update pending customers to active ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Failed to update pending customers to active`);
        }
        logger.info(`--- Pending customers updated to active with warranty_code : ${warranty_code} and registered_customer_id : ${registered_customer_id} ---`);

        logger.info(`--- Fetching warranty register customer id : ${registered_customer_id} ---`);
        const warranty_register_customer_data = await getWarrantyRegisterCustomerById(registered_customer_id);
        if (!warranty_register_customer_data) {
            logger.error(`--- warranty register customer id not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `warranty register customer id not found`);
        }
        logger.info(`--- warranty register customer id found ---`);

        let first_name = warranty_register_customer_data.first_name;
        let last_name = warranty_register_customer_data.last_name;
        let product_id = warranty_register_customer_data.product_id;
        let service_id = warranty_register_customer_data.service_id;
        let is_provider = warranty_register_customer_data.is_provider;
        let is_dealer = warranty_register_customer_data.is_dealer;
        let is_customer = warranty_register_customer_data.is_customer;
        let dealer = null;

        // Try to fetch dealer if dealer_id exists
        if (warranty_register_customer_data.dealer_id) {
            logger.info(`--- Checking if dealer exists with dealer_id: ${warranty_register_customer_data.dealer_id} ---`);
            dealer = await getDealerByDealerId(warranty_register_customer_data.dealer_id);
            if (dealer) {
                logger.info(`--- Dealer found ---`);
            } else {
                logger.warn(`--- Dealer not found for dealer_id: ${warranty_register_customer_data.dealer_id}, continuing without dealer ---`);
            }
        } else {
            logger.info(`--- No dealer_id on this registration, skipping dealer lookup ---`);
        }

        let date_of_installation = warranty_register_customer_data.date_of_installation;
        let product_name = warranty_register_customer_data.product_name;
        let invoice_number = warranty_register_customer_data.invoice_number;
        let serial_number = warranty_register_customer_data.serial_number;
        let phone = warranty_register_customer_data.phone;
        let vehicle_number = warranty_register_customer_data.vehicle_number;
        let email = warranty_register_customer_data.email;
        let vehicle_chassis_number = warranty_register_customer_data.vehicle_chassis_number;

        logger.info(`--- Fetching warranty code with warranty code : ${warranty_code} ---`);
        const warranty_code_data = await getWarrantyCodeByWarrantyCode(warranty_code);
        if (!warranty_code_data) {
            logger.error(`--- Warranty code not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Warranty code not found`);
        }
        logger.info(`--- Warranty code found ---`);

        const warranty_days = warranty_code_data.warranty_days;

        const new_warranty_from = new Date(date_of_installation);
        let new_warranty_to = new Date(new_warranty_from);
        new_warranty_to.setDate(new_warranty_from.getDate() + warranty_days);

        const expirydate = new_warranty_to.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

        // Determine the provider_id to use for fetching company details
        // Priority: dealer's provider > warranty_register_customer_data.provider_id > provider from user login
        const resolved_provider_id = dealer?.provider?.id 
            || warranty_register_customer_data.provider_id 
            || provider?.id;

        let comapanyName = 'N/A';
        let companyLogo;
        let companyWebsite;
        let signatureImage = '';
        let qrCodeImage = '';
        let custom_field_name1;
        let custom_field_name2;
        let custom_field_value1;
        let custom_field_value2;
        let providerSettings = null;

        if (resolved_provider_id) {
            logger.info(`--- Get Provider Company Name with provider_id: ${resolved_provider_id} ---`);
            const providerData = await getProviderById(resolved_provider_id);
            if (providerData) {
                comapanyName = providerData.company_name || 'N/A';
                companyLogo = providerData.company_logo;
                companyWebsite = providerData.company_website || '';
                signatureImage = providerData.signature_image || '';
                qrCodeImage = providerData.qr_code_image || '';
                logger.info(`--- Provider Company Name --- ${comapanyName}`);
            }

            logger.info(`--- Get Provider Custom Fields Name --- ${resolved_provider_id}`);
            providerSettings = await getSettingsByProviderId(resolved_provider_id);
            if (providerSettings) {
                custom_field_name1 = providerSettings.custom_field1;
                custom_field_name2 = providerSettings.custom_field2;
                logger.info(`--- Provider Custom Fields Name --- ${custom_field_name1} --- ${custom_field_name2}`);
            }

            custom_field_value1 = warranty_code_data.custom_value1;
            custom_field_value2 = warranty_code_data.custom_value2;
            logger.info(`--- Provider Custom Fields values --- ${custom_field_value1} --- ${custom_field_value2}`);
        } else {
            logger.warn(`--- Could not resolve provider_id for company details ---`);
        }

        const warrantyStartDateFormatted = new Date(date_of_installation).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const nameParts = [first_name, last_name].filter(Boolean).map((s) => String(s).trim());
        const customerName = nameParts.length === 2 && nameParts[0] === nameParts[1] ? nameParts[0] : nameParts.join(' ');
        const certificateData = {
            customerName,
            productName: warranty_code_data?.product_name || '',
            itemCode: warranty_code_data?.product_id || warranty_code_data?.service_id || '',
            warrantyStartDate: warrantyStartDateFormatted,
            warrantyEndDate: expirydate,
            sellerName: comapanyName || 'N/A',
            dopInstallation: warrantyStartDateFormatted,
            instNameDealer: dealer?.name || comapanyName || 'N/A',
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
            signatureImageUrl: signatureImage || '',
            qrCodeImageUrl: qrCodeImage || '',
            company_website: companyWebsite || '',
            terms_and_conditions: Array.isArray(warranty_code_data?.terms_and_conditions)
                ? warranty_code_data.terms_and_conditions.join('\n')
                : (warranty_code_data?.terms_and_conditions || ''),
            terms_and_conditions_link: warranty_code_data?.terms_and_conditions_link || warranty_code_data?.terms_url || '',
        };

        await attachCompanyLogo(certificateData);
        // Use ONLY provider settings (Warranty Settings) - never warranty-stored value to avoid wrong/stale template
        const rawTemplate = (providerSettings?.certificate_template || 'classic').toString().trim();
        const templateId = (rawTemplate || 'classic').toLowerCase();
        const finalString = await renderWarrantyCertificate(templateId, certificateData);

        logger.info(`--- Sending Email to customer ---`);
        const companyNameForEmail = comapanyName || 'N/A';
        const message1 = `Welcome!<br>Your ${companyNameForEmail} E-Warranty number-${warranty_code}, is valid Until ${expirydate}.<br>Powered by ${companyNameForEmail}`;
        const fileName = `${first_name} ${last_name} ${companyNameForEmail} - Warranty.pdf`;
        await sendEmailWithCertificateAttachment(email, "Warranty Document", message1, finalString, fileName);
        logger.info(`--- Email sent to customer ---`);

        return returnResponse(res, StatusCodes.OK, `Successfully created customer details!`, { updated_customers: updated_customers, finalString });
    } catch (error) {
        logger.error(`updatePendingToActiveEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update pending to active`);
    }
}

export { updatePendingToActiveEndpoint };