import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getWarrantyCodesByBatchId, getWarrantyCodesByProductId } from "./query.js";
import { generateWarrantyReportPDF } from "../../../../services/pdf/warranty-report-pdf.js";

const generateReportPDFEndpoint = async (req, res) => {
    try {
        logger.info(`generateReportPDFEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider by user id ---`);
        const provider = req.type === "staff"
            ? { id: req.provider_id }
            : await getProviderByUserId(user_id);
            
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found ---`);

        const { batch_id, product_master_id, report_title } = req.body;

        if (!batch_id && !product_master_id) {
            logger.error(`--- batch_id or product_master_id is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `batch_id or product_master_id is required`);
        }

        let warranty_codes = [];

        if (batch_id) {
            logger.info(`--- Fetching warranty codes by batch id: ${batch_id} ---`);
            warranty_codes = await getWarrantyCodesByBatchId(batch_id, provider.id);
        } else if (product_master_id) {
            logger.info(`--- Fetching warranty codes by product id: ${product_master_id} ---`);
            warranty_codes = await getWarrantyCodesByProductId(product_master_id, provider.id);
        }

        if (!warranty_codes || warranty_codes.length === 0) {
            logger.error(`--- No warranty codes found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No warranty codes found`);
        }
        logger.info(`--- Found ${warranty_codes.length} warranty codes ---`);

        // Transform data for PDF generation
        const warranty_codes_data = warranty_codes.map(code => ({
            product_name: code.product_name || '—',
            warranty_code: code.warranty_code || '—',
            serial_no: code.serial_no || '—',
            dealer_name: code.assigned_dealer?.name || 'Not Assigned',
            status: code.warranty_code_status || '—'
        }));

        // Generate PDF
        const title = report_title || 'Warranty Codes Report';
        const pdfBase64 = await generateWarrantyReportPDF(warranty_codes_data, title);

        return returnResponse(res, StatusCodes.OK, `Report PDF generated successfully!`, {
            data: pdfBase64,
            total_records: warranty_codes.length
        });

    } catch (error) {
        logger.error(`generateReportPDFEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to generate report PDF`);
    }
};

export { generateReportPDFEndpoint };
