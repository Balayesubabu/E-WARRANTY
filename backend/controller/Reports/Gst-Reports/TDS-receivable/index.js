import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getTDSReceivableByProviderId } from "./query.js";

const tdsReceivableEndpoint = async (req, res) => {
    try {
        logger.info(`tdsReceivableEndpoint`);

      let user_id;
        let staff_id;
        if(req.type == 'staff'){
           user_id = req.user_id;
            staff_id = req.staff_id;
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
            staff_id = null;
        }
        const franchise_id = req.franchise_id;

        logger.info(`--- Fetching provider by user id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.info(`--- Provider not found for user id : ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found with user id : ${user_id} ---`);

        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return returnError(res, StatusCodes.BAD_REQUEST, "start_date and end_date are required");
        }

        logger.info(`--- Fetching TDS receivable by provider id : ${provider.id} ---`);
        const tds_receivable = await getTDSReceivableByProviderId(provider.id,franchise_id, start_date, end_date);
        logger.info(`--- TDS receivable fetched successfully. Total records: ${tds_receivable.length} ---`);

        const tds_receivable_data = tds_receivable.map((invoice) => {
            return {
                customer_name: invoice.provider_customer.customer_name || "",
                customer_gst: invoice.provider_customer.customer_gstin_number || "",
                customer_pan: invoice.provider_customer.customer_pan_number || "",
                invoice_number: invoice.invoice_number,
                taxable_amount: Number((invoice.invoice_total_parts_services_amount - invoice.invoice_total_parts_services_tax_amount + invoice.invoice_discount_amount - invoice.invoice_additional_discount_amount).toFixed(2)) || Number(invoice.invoice_total_amount.toFixed(2)),
                tds_amount: Number(invoice.invoice_tds_amount.toFixed(2)) || 0,
                // tax_name: "TDS",
                // tax_section: "194C", // Common TDS section for payments to contractors
                // tax_rate: invoice.invoice_tds_percentage || 0
                tds_percentage: invoice.invoice_tds_percentage || 0
            }
        });

        logger.info(`--- TDS Receivable data processed successfully. Total records: ${tds_receivable_data.length} ---`);

        return returnResponse(res, StatusCodes.OK, "TDS Receivable report generated successfully", {
            report_type: "TDS_Receivable",
            provider_id: provider.id,
            start_date: start_date,
            end_date: end_date,
            total_records: tds_receivable_data.length,
            data: tds_receivable_data
        });

    } catch (error) {
        logger.error(`Error in tdsReceivableEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate TDS Receivable report");
    }
}

export default tdsReceivableEndpoint;