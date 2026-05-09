import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getSalesInvoiceByProviderId, getSalesReturnByProviderId, getPurchaseReturnByProviderId } from "./query.js";

const gstr1SalesEndpoint = async (req, res) => {
    try {
        logger.info(`gstr1SalesEndpoint`);

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

        let { start_date, end_date, report_type } = req.query;

        if (!start_date || !end_date) {
            return returnError(res, StatusCodes.BAD_REQUEST, "start_date and end_date are required");
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Invalid date format");
        }

        if (startDate > endDate) {
            return returnError(res, StatusCodes.BAD_REQUEST, "start_date cannot be greater than end_date");
        }

        let igst = 0, cgst = 0, sgst = 0;

        report_type = report_type || "Sales";
        if (report_type === "Sales") {
            logger.info(`--- GSTR-1 Sales Report ---`);

            logger.info(`--- Fetching sales invoice by provider id : ${provider.id} ---`);
            const sales_data = await getSalesInvoiceByProviderId(provider.id, franchise_id, start_date, end_date);

            const gstr1_sales_data = sales_data.map((sales_invoice) => {

                igst = sales_invoice.invoice_total_tax_amount;
                cgst = sales_invoice.invoice_total_tax_amount / 2;
                sgst = sales_invoice.invoice_total_tax_amount / 2;
              
             
                

                return {
                    gst_number: sales_invoice.provider_customer.customer_gstin_number || "",
                    customer_name: sales_invoice.provider_customer.customer_name,
                    invoice_number: `${sales_invoice.invoice_number}${sales_invoice.original_invoice_number ? ` / ${sales_invoice.original_invoice_number}` : ""}`,
                    invoice_date: new Date(sales_invoice.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                    invoice_value: Number(sales_invoice.invoice_total_amount.toFixed(2)),
                    taxable_value: Number((sales_invoice.invoice_total_parts_services_amount - sales_invoice.invoice_additional_discount_amount).toFixed(2)) || Number(sales_invoice.invoice_total_amount.toFixed(2)),
                    cgst: Number(cgst.toFixed(2)),
                    sgst: Number(sgst.toFixed(2)),
                    igst: Number(igst.toFixed(2)),
                    total_tax: Number(sales_invoice.invoice_total_tax_amount.toFixed(2)),
                }
            });

            logger.info(`--- GSTR-1 Sales data processed successfully. Total records: ${gstr1_sales_data.length} ---`);


            return returnResponse(res, StatusCodes.OK, "GSTR-1 Sales report generated successfully", {
                report_type: "Sales",
                provider_id: provider.id,
                start_date: start_date,
                end_date: end_date,
                total_records: gstr1_sales_data.length,
                data: gstr1_sales_data
            });

        } else if(report_type === "Sales_Return/Credit_Note") {
            logger.info(`--- GSTR-1 Sales Return/Credit Note Report ---`);
            logger.info(`--- Fetching sales return by provider id : ${provider.id} ---`);
            const sales_return_data = await getSalesReturnByProviderId(provider.id, franchise_id, start_date, end_date);

            const gstr1_sales_return_data = sales_return_data.map((sales_return) => {
    
                igst = sales_return.invoice_total_tax_amount;
                cgst = sales_return.invoice_total_tax_amount / 2;
                sgst = sales_return.invoice_total_tax_amount / 2;

                return {
                    gst_number: sales_return.provider_customer.customer_gstin_number || "",
                    customer_name: sales_return.provider_customer.customer_name,
                    invoice_number: `${sales_return.invoice_number}${sales_return.original_invoice_number ? ` / ${sales_return.original_invoice_number}` : ""}`,
                    invoice_date: new Date(sales_return.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                    invoice_value: Number(sales_return.invoice_total_amount.toFixed(2)),
                    taxable_value: Number(sales_return.invoice_total_parts_services_amount.toFixed(2)) || Number(sales_return.invoice_total_amount.toFixed(2)),
                    cgst: Number(cgst.toFixed(2)),
                    sgst: Number(sgst.toFixed(2)),
                    igst: Number(igst.toFixed(2)),
                    total_tax: Number(sales_return.invoice_total_tax_amount.toFixed(2))
                }
            });

            logger.info(`--- GSTR-1 Sales Return/Credit Note data processed successfully. Total records: ${gstr1_sales_return_data.length} ---`);

            return returnResponse(res, StatusCodes.OK, "GSTR-1 Sales Return/Credit Note report generated successfully", {
                report_type: "Sales_Return/Credit_Note",
                provider_id: provider.id,
                start_date: start_date,
                end_date: end_date,
                total_records: gstr1_sales_return_data.length,
                data: gstr1_sales_return_data
            });
        }
        else if (report_type === "Purchase_Return/Debit_Note") {
            logger.info(`--- GSTR-1 Purchase Return/Debit Note Report ---`);

            logger.info(`--- Fetching purchase return by provider id : ${provider.id} ---`);
            const purchase_return_data = await getPurchaseReturnByProviderId(provider.id, franchise_id, start_date, end_date);

            const gstr1_purchase_return_data = purchase_return_data.map((purchase_return) => {
                igst = purchase_return.invoice_total_tax_amount;
                cgst = purchase_return.invoice_total_tax_amount / 2;
                sgst = purchase_return.invoice_total_tax_amount / 2;


                return {
                    gst_number: purchase_return.provider_customer.customer_gstin_number || "",
                    customer_name: purchase_return.provider_customer.customer_name,
                    invoice_number: `${purchase_return.invoice_number}${purchase_return.original_invoice_number ? ` / ${purchase_return.original_invoice_number}` : ""}`,
                    invoice_date: new Date(purchase_return.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                    invoice_value: Number(purchase_return.invoice_total_amount.toFixed(2)),
                    taxable_value: Number(purchase_return.invoice_total_parts_services_amount.toFixed(2)) || Number(purchase_return.invoice_total_amount.toFixed(2)),
                    cgst: Number(cgst.toFixed(2)),
                    sgst: Number(sgst.toFixed(2)),
                    igst: Number(igst.toFixed(2)),
                    total_tax: Number(purchase_return.invoice_total_tax_amount.toFixed(2)),
                }
            });
            logger.info(`--- GSTR-1 Purchase Return/Debit Note data processed successfully. Total records: ${gstr1_purchase_return_data.length} ---`);

            return returnResponse(res, StatusCodes.OK, "GSTR-1 Purchase Return/Debit Note report generated successfully", {
                report_type: "Purchase_Return/Debit_Note",
                provider_id: provider.id,
                start_date: start_date,
                end_date: end_date,
                total_records: gstr1_purchase_return_data.length,
                data: gstr1_purchase_return_data
            });
        }
        else {
            logger.info(`--- Unsupported report type: ${report_type} ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Unsupported report type: ${report_type}. Only 'Sales' is supported.`);
        }

    } catch (error) {
        logger.error(`Error in gstr1SalesEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
    }
}

export default gstr1SalesEndpoint;