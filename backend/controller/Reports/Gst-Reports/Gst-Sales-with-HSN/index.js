import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getSalesInvoicesByProviderId } from "./query.js";

const gstSalesWithHSNEndpoint = async (req, res) => {
    try {
        logger.info(`gstSalesWithHSNEndpoint`);

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

        logger.info(`--- Fetching sales invoices by provider id : ${provider.id} ---`);
        const sales_invoices = await getSalesInvoicesByProviderId(provider.id,franchise_id, start_date, end_date);
        logger.info(`--- Sales invoices fetched successfully. Total records: ${sales_invoices.length} ---`);

        const gst_sales_with_hsn_data = [];

        sales_invoices.forEach((sales_invoice) => {
            let cgst = 0, sgst = 0, igst = 0;
            // Process Sales Parts only
            sales_invoice.SalesPart.forEach((part) => {
                const total_gst_amount = part.part_gst_amount || 0;

                  if(sales_invoice.provider_customer.customer_state == sales_invoice.franchise.state){
                     igst = 0;
                cgst = total_gst_amount / 2;
                sgst = total_gst_amount / 2;
              
                } else {
               igst = total_gst_amount
               cgst = 0;
               sgst = 0;
                }
                // const cgst = total_gst_amount / 2;
                // const sgst = total_gst_amount / 2;
                // const igst = 0; // For intra-state transactions, IGST is 0

                gst_sales_with_hsn_data.push({
                    invoice_date: new Date(sales_invoice.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                    invoice_number: sales_invoice.invoice_number,
                    gstin: sales_invoice.provider_customer.customer_gstin_number || "",
                    customer_name: sales_invoice.provider_customer.customer_name,
                    item_name: part.part_name,
                    hsn_code: part.part_hsn_code || part.franchise_inventory?.product_hsn_code || "",
                    qty: part.part_quantity || 0,
                    price_per_unit: part.part_selling_price || 0,
                    sgst: sgst,
                    cgst: cgst,
                    igst: igst,
                    amount: Number(part.part_total_price.toFixed(2)) || 0
                });
            });
        });

        logger.info(`--- GST Sales with HSN data processed successfully. Total records: ${gst_sales_with_hsn_data.length} ---`);

        return returnResponse(res, StatusCodes.OK, "GST Sales with HSN report generated successfully", {
            report_type: "GST_Sales_with_HSN",
            provider_id: provider.id,
            start_date: start_date,
            end_date: end_date,
            total_records: gst_sales_with_hsn_data.length,
            data: gst_sales_with_hsn_data
        });

    } catch (error) {
        logger.error(`Error in gstSalesWithHSNEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate GST Sales with HSN report");
    }
}

export default gstSalesWithHSNEndpoint;