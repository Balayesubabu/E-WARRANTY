import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getWarrantyCodesByGroupId, getWarrantyCodesByBatchId, getProviderWarrantySettings} from "./query.js";
import { resolveRegistrationUrlFromRequest } from "../../../../utils/resolveRegistrationUrl.js";
import { generateWarrantyQRPDF } from "../../../../services/pdf/e-warranty-qr.js";

const generateQRCodeEndpoint = async (req, res) => {
    try {
        logger.info(`generateQRCodeEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider by user id ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found ---`);

        const { group_id, batch_id, print_type } = req.body;

        if (!group_id && !batch_id) {
            logger.error(`--- group_id or batch_id is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `group_id or batch_id is required`);
        }

        let warranty_codes = [];
        if (batch_id) {
            logger.info(`--- Fetching warranty codes by batch id: ${batch_id} ---`);
            warranty_codes = await getWarrantyCodesByBatchId(batch_id, provider.id);
        } else if (group_id) {
            logger.info(`--- Fetching warranty codes by group id: ${group_id} ---`);
            warranty_codes = await getWarrantyCodesByGroupId(group_id, provider.id);
        }

        if (!warranty_codes || warranty_codes.length === 0) {
            logger.error(`--- Warranty codes not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Warranty codes not found`);
        }
        logger.info(`--- Found ${warranty_codes.length} warranty codes ---`);
        const provider_id = provider.id;
        let warranty_codes_data = [];
        for (const warranty_code of warranty_codes) {
            warranty_codes_data.push({
                provider_id:provider_id,
                product_name: warranty_code.product_name,
                product_id: warranty_code.product_id,
                service_id: warranty_code.service_id,
                serial_no: warranty_code.serial_no,
                warranty_id: warranty_code.warranty_code,
                warranty_from:warranty_code.warranty_from,
                warranty_to: warranty_code.warranty_to,
                warranty_days:warranty_code.warranty_days,
                custom_value1:warranty_code.custom_value1,
                custom_value2:warranty_code.custom_value2,
                warranty_period_readable:warranty_code.warranty_period_readable
            });
        }
        console.log(warranty_codes, "warranty codes ");
        const rawRegistrationUrl = await getProviderWarrantySettings(provider.id);
        // For QR PDFs, prefer a LAN/public base URL so scans work from mobile.
        const comapanyUrl = resolveRegistrationUrlFromRequest(rawRegistrationUrl ?? "", req, { for_qr: true });
        if (!comapanyUrl) {
            logger.error(`--- Registration URL not configured (System Settings or FRONTEND_URL) ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Registration URL not configured. Set it under System Settings or set FRONTEND_URL on the server to your public app URL.`);
        }
        logger.info(`--- Registration URL resolved for QR PDF ---`);

        let finalString = "";
        finalString = await generateWarrantyQRPDF(comapanyUrl, warranty_codes_data, print_type || 'A4');

        return returnResponse(res, StatusCodes.OK, `QR code is successfully generated!`, {
            data: finalString
        });

    } catch (error) {
        logger.error(`generateQRCodeEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to generate QR code`);
    }
}

export { generateQRCodeEndpoint };