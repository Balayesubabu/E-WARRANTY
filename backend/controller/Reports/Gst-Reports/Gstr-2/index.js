import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getPurchaseInvoicesByProviderId, getPurchaseReturnInvoicesByProviderId } from "./query.js";

const gstr2Endpoint = async (req, res) => {
    try {
        logger.info(`gstr2Endpoint`);

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
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.info(`--- Provider not found for user id : ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found with user id : ${user_id} ---`);

        let cgst = 0, sgst = 0, igst = 0;
        let { report_type, start_date, end_date } = req.query;

            report_type = report_type || "Purchase";
        if (report_type === "Purchase") {
            logger.info(`--- Fetching purchase invoices by provider id : ${provider.id} ---`);
            const purchase_invoices = await getPurchaseInvoicesByProviderId(provider.id,franchise_id, start_date, end_date);
            logger.info(`--- Purchase invoices fetched successfully. Total records: ${purchase_invoices.length} ---`);

            const gstr2_purchase_data = purchase_invoices.map((purchase_invoice) => {
                // Calculate CGST and SGST based on the actual GST amount
                // For most cases, CGST and SGST are equal (50% each of total GST)
                const total_gst_amount = purchase_invoice.invoice_gst_amount || 0;
                igst = purchase_invoice.invoice_total_tax_amount;
                cgst = purchase_invoice.invoice_total_tax_amount / 2;
                sgst = purchase_invoice.invoice_total_tax_amount / 2;
              

                return {
                    gst_number: purchase_invoice.provider_customer.customer_gstin_number || "",
                    customer_name: purchase_invoice.provider_customer.customer_name,
                    invoice_number: purchase_invoice.invoice_number,
                    invoice_date: new Date(purchase_invoice.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                    invoice_value: Number(purchase_invoice.invoice_total_amount.toFixed(2)),
                    taxable_value: Number(purchase_invoice.invoice_total_parts_services_amount.toFixed(2)) || Number(purchase_invoice.invoice_total_amount.toFixed(2)),
                    cgst: Number(cgst.toFixed(2)),
                    sgst: Number(sgst.toFixed(2)),
                    igst: Number(igst.toFixed(2)),
                    total_tax: Number(purchase_invoice.invoice_total_tax_amount.toFixed(2)),
                }
            });

            return returnResponse(res, StatusCodes.OK, "GSTR-2 Purchase report generated successfully", {
                report_type: "Purchase",
                provider_id: provider.id,
                start_date: start_date,
                end_date: end_date,
                total_records: gstr2_purchase_data.length,
                data: gstr2_purchase_data
            });
        }
        else if (report_type === "Purchase_Return") {
            logger.info(`--- Fetching purchase return invoices by provider id : ${provider.id} ---`);
            const purchase_return_invoices = await getPurchaseReturnInvoicesByProviderId(provider.id, franchise_id, start_date, end_date);
            logger.info(`--- Purchase return invoices fetched successfully. Total records: ${purchase_return_invoices.length} ---`);

            const gstr2_purchase_return_data = purchase_return_invoices.map((purchase_return_invoice) => {
                // Calculate CGST and SGST based on the actual GST amount
                // For most cases, CGST and SGST are equal (50% each of total GST)
                const total_gst_amount = purchase_return_invoice.invoice_gst_amount || 0;
                
                igst = purchase_return_invoice.invoice_total_tax_amount;
                cgst = purchase_return_invoice.invoice_total_tax_amount / 2;
                sgst = purchase_return_invoice.invoice_total_tax_amount / 2;
              
               

                return {
                    gst_number: purchase_return_invoice.provider_customer.customer_gstin_number || "",
                    customer_name: purchase_return_invoice.provider_customer.customer_name,
                    invoice_number: purchase_return_invoice.invoice_number,
                    invoice_date: new Date(purchase_return_invoice.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                    invoice_value: Number(purchase_return_invoice.invoice_total_amount.toFixed(2)),
                    taxable_value: Number(purchase_return_invoice.invoice_total_parts_services_amount.toFixed(2)) || Number(purchase_return_invoice.invoice_total_amount.toFixed(2)),
                    cgst: Number(cgst.toFixed(2)),
                    sgst: Number(sgst.toFixed(2)),
                    igst: Number(igst.toFixed(2)),
                    total_tax: Number(purchase_return_invoice.invoice_total_tax_amount.toFixed(2)),
                }
            });

            return returnResponse(res, StatusCodes.OK, "GSTR-2 Purchase Return report generated successfully", {
                report_type: "Purchase_Return",
                provider_id: provider.id,
                start_date: start_date,
                end_date: end_date,
                total_records: gstr2_purchase_return_data.length,
                data: gstr2_purchase_return_data
            });
        }
        else {
            logger.info(`--- Invalid report type : ${report_type} ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, "Invalid report type");
        }
    } catch (error) {
        logger.error(`Error in gstr2Endpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate GSTR-2 report");
    }
}

export default gstr2Endpoint;