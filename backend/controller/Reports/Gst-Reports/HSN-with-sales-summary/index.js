import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getSalesInvoicesByProviderId } from "./query.js";

const hsnWithSalesSummaryEndpoint = async (req, res) => {
    try {
        logger.info(`hsnWithSalesSummaryEndpoint`);

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
        const sales_invoices = await getSalesInvoicesByProviderId(provider.id, franchise_id, start_date, end_date);
        logger.info(`--- Sales invoices fetched successfully. Total records: ${sales_invoices.length} ---`);

        // Aggregate data by HSN code
        const hsnSummary = new Map();

        sales_invoices.forEach((sales_invoice) => {

            let igst = 0, cgst = 0, sgst = 0;
            // Process Sales Parts only
            sales_invoice.SalesPart.forEach((part) => {
                   if(sales_invoice.provider_customer.customer_state == sales_invoice.franchise.state){
                     igst = 0;
                cgst = sales_invoice.invoice_total_tax_amount / 2;
                sgst = sales_invoice.invoice_total_tax_amount / 2;
              
                } else {
               igst = Number(sales_invoice.invoice_total_tax_amount.toFixed(2));
               cgst = 0;
               sgst = 0;
                }
                const hsnCode = part.part_hsn_code || part.franchise_inventory?.product_hsn_code || "";
                const itemName = part.part_name;
                const quantity = part.part_quantity || 0;
                const totalValue = Number(part.part_total_price.toFixed(2)) || 0;
                const totalGstAmount = Number(part.part_gst_amount.toFixed(2)) || 0;
                const taxableValue = totalValue - totalGstAmount; // Base amount before GST
                // const cgst = totalGstAmount / 2;
                // const sgst = totalGstAmount / 2;
                // const igst = 0; // For intra-state transactions
                const cess = 0; // Assuming no CESS for now
                const totalTaxAmount = totalGstAmount + cess;

                if (hsnSummary.has(hsnCode)) {
                    
                    const existing = hsnSummary.get(hsnCode);
                    existing.total_qty = existing.total_qty + quantity;
                    existing.total_value = Number((existing.total_value + totalValue).toFixed(2));
                    existing.taxable_value = Number((existing.taxable_value + taxableValue).toFixed(2));
                    existing.igst = Number((existing.igst + igst).toFixed(2));
                    existing.cgst = Number((existing.cgst + cgst).toFixed(2));
                    existing.sgst = Number((existing.sgst + sgst).toFixed(2));
                    existing.cess = Number((existing.cess + cess).toFixed(2));
                    existing.total_tax_amount = Number((existing.total_tax_amount + totalTaxAmount).toFixed(2));
                } else {
                    hsnSummary.set(hsnCode, {
                        hsn_code: hsnCode,
                        item_name: itemName,
                        total_qty: quantity,
                        total_value: Number(totalValue.toFixed(2)),
                        taxable_value: Number(taxableValue.toFixed(2)),
                        igst: Number(igst.toFixed(2)),
                        cgst: Number(cgst.toFixed(2)),
                        sgst: Number(sgst.toFixed(2)),
                        cess: Number(cess.toFixed(2)),
                        total_tax_amount: Number(totalTaxAmount.toFixed(2))
                    });
                }
                
                // console.log("hsnSummary", hsnSummary);
            });
        });

        const hsn_with_sales_summary_data = Array.from(hsnSummary.values());

        logger.info(`--- HSN with Sales Summary data processed successfully. Total records: ${hsn_with_sales_summary_data.length} ---`);

        return returnResponse(res, StatusCodes.OK, "HSN with Sales Summary report generated successfully", {
            report_type: "HSN_with_Sales_Summary",
            provider_id: provider.id,
            start_date: start_date,
            end_date: end_date,
            total_records: hsn_with_sales_summary_data.length,
            data: hsn_with_sales_summary_data
        });

    } catch (error) {
        logger.error(`Error in hsnWithSalesSummaryEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate HSN with Sales Summary report");
    }
}

export default hsnWithSalesSummaryEndpoint; 