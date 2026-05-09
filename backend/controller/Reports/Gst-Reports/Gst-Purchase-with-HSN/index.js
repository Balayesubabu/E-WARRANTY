import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getPurchaseInvoicesByProviderId } from "./query.js";

const gstPurchaseWithHSNEndpoint = async (req, res) => {
    try {
        logger.info(`gstPurchaseWithHSNEndpoint`);

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

        logger.info(`--- Fetching purchase invoices by provider id : ${provider.id} ---`);
        const purchase_invoices = await getPurchaseInvoicesByProviderId(provider.id, franchise_id, start_date, end_date);
        logger.info(`--- Purchase invoices fetched successfully. Total records: ${purchase_invoices.length} ---`);

        const gst_purchase_with_hsn_data = [];

        let cgst = 0;
        let sgst = 0;
        let igst = 0;
        purchase_invoices.forEach((purchase_invoice) => {
            // Process Purchase Parts
            purchase_invoice.PurchasePart.forEach((part) => {
                const total_gst_amount = part.part_gst_amount || 0;
                // const cgst = total_gst_amount / 2;
                // const sgst = total_gst_amount / 2;
                // const igst = 0; // For intra-state transactions, IGST is 0
                 if(purchase_invoice.provider_customer.customer_state == purchase_invoice.franchise.state){
                     igst = 0;
                cgst = total_gst_amount / 2;
                sgst = total_gst_amount/ 2;
              
                } else {
               igst = total_gst_amount;
               cgst = 0;
               sgst = 0;
                }

                gst_purchase_with_hsn_data.push({
                    invoice_date: new Date(purchase_invoice.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                    invoice_number: purchase_invoice.invoice_number,
                    gstin: purchase_invoice.provider_customer.customer_gstin_number || "",
                    customer_name: purchase_invoice.provider_customer.customer_name,
                    item_name: part.part_name,
                    hsn_code: part.part_hsn_code || part.franchise_inventory?.product_hsn_code || "",
                    qty: part.part_quantity || 0,
                    price_per_unit: part.part_purchase_price || 0,
                    sgst: sgst,
                    cgst: cgst,
                    igst: igst,
                    amount: Number(part.part_total_price.toFixed(2)) || 0
                });
            });

            // Process Purchase Services
            purchase_invoice.PurchaseService.forEach((service) => {
                const total_gst_amount = service.service_gst_amount || 0;
                const cgst = total_gst_amount / 2;
                const sgst = total_gst_amount / 2;
                const igst = 0; // For intra-state transactions, IGST is 0

                gst_purchase_with_hsn_data.push({
                    invoice_date: new Date(purchase_invoice.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                    invoice_number: purchase_invoice.invoice_number,
                    gstin: purchase_invoice.provider_customer.customer_gstin_number || "",
                    customer_name: purchase_invoice.provider_customer.customer_name,
                    item_name: service.service_name,
                    hsn_code: service.franchise_service?.service_sac_code || "",
                    qty: 1, // Services typically have quantity 1
                    price_per_unit: service.service_price || 0,
                    sgst: sgst,
                    cgst: cgst,
                    igst: igst,
                    amount: Number(service.service_total_price.toFixed(2)) || 0
                });
            });
        });

        logger.info(`--- GST Purchase with HSN data processed successfully. Total records: ${gst_purchase_with_hsn_data.length} ---`);

        return returnResponse(res, StatusCodes.OK, "GST Purchase with HSN report generated successfully", {
            report_type: "GST_Purchase_with_HSN",
            provider_id: provider.id,
            start_date: start_date,
            end_date: end_date,
            total_records: gst_purchase_with_hsn_data.length,
            data: gst_purchase_with_hsn_data
        });

    } catch (error) {
        logger.error(`Error in gstPurchaseWithHSNEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate GST Purchase with HSN report");
    }
}

export default gstPurchaseWithHSNEndpoint;