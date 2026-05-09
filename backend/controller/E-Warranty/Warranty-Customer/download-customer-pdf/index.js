import { returnResponse, logger, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { User } from "../../../../prisma/db-models.js";
import { getWarrantyRegisterCustomerById, getWarrantyCodeByWarrantyCode, getProviderById, getDealerByDealerId, getSettingsByProviderId } from "./query.js";
import { renderWarrantyCertificate, attachCompanyLogo } from "../../../../services/pdf/warranty-templates/index.js";

const downloadCustomerPdfEndpoint = async (req, res) => {
    try {
        logger.info(`downloadCustomerEndpoint`);

        const { warranty_register_customer_id } = req.body;
        logger.info(`--- Fetching warranty register customer id : ${warranty_register_customer_id} ---`);
        const warranty_register_customer_data = await getWarrantyRegisterCustomerById(warranty_register_customer_id);
        if (!warranty_register_customer_data) {
            logger.error(`--- warranty register customer id not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `warranty register customer id not found`);
        }
        logger.info(`--- warranty register customer id found ---`);

        // Ownership validation: when customer token, ensure warranty belongs to this customer
        if (req.user_type === "customer" && req.user_id) {
            const user = await User.findUnique({ where: { id: req.user_id } });
            if (!user) {
                return returnError(res, StatusCodes.UNAUTHORIZED, "User not found");
            }
            const userPhone = user.phone_number && !String(user.phone_number).startsWith("temp_") ? user.phone_number : null;
            const userEmail = user.email || null;
            const warrantyPhone = warranty_register_customer_data.phone || "";
            const warrantyEmail = (warranty_register_customer_data.email || "").trim().toLowerCase();

            let matches = false;
            if (userPhone && warrantyPhone) {
                const userLast10 = userPhone.replace(/\D/g, "").slice(-10);
                const warrantyDigits = warrantyPhone.replace(/\D/g, "");
                if (userLast10 && warrantyDigits.endsWith(userLast10)) matches = true;
            }
            if (userEmail && warrantyEmail && userEmail.toLowerCase() === warrantyEmail) matches = true;

            if (!matches) {
                logger.error(`--- Customer ${req.user_id} attempted to download warranty ${warranty_register_customer_id} - ownership mismatch ---`);
                return returnError(res, StatusCodes.FORBIDDEN, "You can only download your own warranty certificates");
            }
        }

        let first_name = warranty_register_customer_data.first_name;
        let last_name = warranty_register_customer_data.last_name;
        let product_id = warranty_register_customer_data.product_id;
        let service_id = warranty_register_customer_data.service_id;
        let is_provider = warranty_register_customer_data.is_provider;
        let is_dealer = warranty_register_customer_data.is_dealer;
        let is_customer = warranty_register_customer_data.is_customer;
        let dealer = null;
        if (!is_provider && warranty_register_customer_data.dealer_id) {
            logger.info(`--- Checking if dealer exists ---`);
            dealer = await getDealerByDealerId(warranty_register_customer_data.dealer_id);

            if (!dealer) {
                logger.warn(`--- Dealer not found with id: ${warranty_register_customer_data.dealer_id}, continuing without dealer ---`);
            } else {
                logger.info(`--- Dealer found ---`);
            }
        }

        let date_of_installation = warranty_register_customer_data.date_of_installation;
        let product_name = warranty_register_customer_data.product_name;
        let provider_id = warranty_register_customer_data.provider_id;
        let invoice_number = warranty_register_customer_data.invoice_number;
        let serial_number = warranty_register_customer_data.serial_number;
        let phone = warranty_register_customer_data.phone;
        let vehicle_number = warranty_register_customer_data.vehicle_number;
        let vehicle_chassis_number = warranty_register_customer_data.vehicle_chassis_number;


        let warranty_code = warranty_register_customer_data.warranty_code;

        logger.info(`--- Checking if provider exists ---`);
        const provider = await getProviderById(provider_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found ---`);



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
        const warrantyStartDateFormatted = new Date(date_of_installation).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

        // Use warranty's provider_id so we always get the correct owner's warranty settings (including certificate template)
        const resolvedProviderId = provider_id;
        let providerSettings = null;
        try {
            providerSettings = await getSettingsByProviderId(resolvedProviderId);
            if (!providerSettings) {
                logger.warn(`No warranty settings found for provider ${resolvedProviderId} - certificate will use classic template`);
            }
        } catch (settingsErr) {
            logger.warn(`Could not fetch provider warranty settings (certificate will use classic template): ${settingsErr?.message || settingsErr}`);
        }
        const providerData = await getProviderById(resolvedProviderId);

        const comapanyName = providerData?.company_name || '';
        const companyLogo = providerData?.company_logo || null;
        const signatureImage = providerData?.signature_image || null;
        const qrCodeImage = providerData?.qr_code_image || null;
        const custom_field_name1 = providerSettings?.custom_field1 || '';
        const custom_field_name2 = providerSettings?.custom_field2 || '';
        const custom_field_value1 = warranty_code_data.custom_value1 || '';
        const custom_field_value2 = warranty_code_data.custom_value2 || '';

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
            signatureImageUrl: signatureImage || '',
            qrCodeImageUrl: qrCodeImage || '',
            company_website: providerData?.company_website || '',
            terms_and_conditions: Array.isArray(warranty_code_data?.terms_and_conditions)
                ? warranty_code_data.terms_and_conditions.join('\n')
                : (warranty_code_data?.terms_and_conditions || ''),
            terms_and_conditions_link: warranty_code_data?.terms_and_conditions_link || warranty_code_data?.terms_url || '',
        };

        await attachCompanyLogo(certificateData);
        // Use ONLY provider settings (Warranty Settings) - never warranty-stored value to avoid wrong/stale template
        const rawTemplate = (providerSettings?.certificate_template || 'classic').toString().trim();
        const templateId = rawTemplate || 'classic';
        logger.info(`Certificate PDF: provider=${resolvedProviderId}, provider_template="${providerSettings?.certificate_template ?? 'none'}", using="${templateId}"`);
        const finalString = await renderWarrantyCertificate(templateId, certificateData);

        return returnResponse(res, StatusCodes.OK, `Successfully created customer details!`, {
            warranty_register_customer_data: warranty_register_customer_data,
            finalString,
        });

    } catch (error) {
        logger.error(`downloadCustomerPdfEndpoint error: ${error?.message || error}`);
        if (error?.stack) logger.error(error.stack);
        const msg = error?.response?.data?.message || error?.message || 'Failed to generate certificate';
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, msg);
    }
}

export { downloadCustomerPdfEndpoint };