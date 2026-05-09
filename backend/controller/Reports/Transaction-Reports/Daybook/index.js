import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getDaybookReportByProviderId } from "./query.js";

const daybookEndpoint = async (req, res) => {
    try {
        logger.info(`daybookEndpoint`);

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

        const { start_date, end_date, provider_customer_id, transaction_type } = req.query;

        if (!start_date || !end_date) {
            return returnError(res, StatusCodes.BAD_REQUEST, "start_date and end_date are required");
        }

        logger.info(`--- Fetching daybook report by provider id : ${provider.id} ---`);
        const transaction_data = await getDaybookReportByProviderId(provider.id, franchise_id, start_date, end_date, provider_customer_id, transaction_type);
        logger.info(`--- Daybook report data fetched successfully. Sales: ${transaction_data.sales_invoices.length}, Purchases: ${transaction_data.purchase_invoices.length} ---`);

        const daybook_data = [];
        let running_balance = 0;

        // Process Sales Invoices
        transaction_data.sales_invoices.forEach((invoice) => {
            const customer_name = invoice.provider_customer.customer_name || "";
            const total_amount = invoice.invoice_total_amount || 0;
            const paid_amount = invoice.invoice_paid_amount || 0;
            const pending_amount = invoice.invoice_pending_amount || 0;

            // Determine transaction type based on invoice type
            let transaction_type_name = "Sales";
            switch (invoice.invoice_type) {
                case "Sales":
                    transaction_type_name = "Sales Invoice";
                    break;
                case "Sales_Return":
                    transaction_type_name = "Sales Return";
                    break;
                case "Credit_Note":
                    transaction_type_name = "Credit Note";
                    break;
                case "Booking":
                    transaction_type_name = "Booking";
                    break;
                case "Quotation":
                    transaction_type_name = "Quotation";
                    break;
                case "Payment_In":
                    transaction_type_name = "Payment In";
                    break;
                case "Delivery_Order":
                    transaction_type_name = "Delivery Order";
                    break;
                case "Proforma_Invoice":
                    transaction_type_name = "Proforma Invoice";
                    break;
                default:
                    transaction_type_name = invoice.invoice_type;
            }

            // Calculate money in/out based on transaction type
            let money_in = 0;
            let money_out = 0;

            if (invoice.invoice_type === "Sales_Return" || invoice.invoice_type === "Credit_Note") {
                // For returns and credit notes, money goes out (we refund)
                money_out = total_amount;
                money_in = 0;
            } else {
                // For regular sales, money comes in
                money_in = total_amount;
                money_out = 0;
            }

            // Update running balance
            running_balance += money_in - money_out;

            daybook_data.push({
                date: new Date(invoice.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                customer_name: customer_name,
                transaction_type: transaction_type_name,
                transaction_no: invoice.invoice_number,
                total_amount: Number(total_amount.toFixed(2)),
                money_in: Number(money_in.toFixed(2)),
                money_out: Number(money_out.toFixed(2)),
                balance_amount: Number(running_balance.toFixed(2))
            });
        });

        // Process Purchase Invoices
        transaction_data.purchase_invoices.forEach((invoice) => {
            const customer_name = invoice.provider_customer.customer_name || "";
            const total_amount = invoice.invoice_total_amount || 0;
            const paid_amount = invoice.invoice_paid_amount || 0;
            const pending_amount = invoice.invoice_pending_amount || 0;

            // Determine transaction type based on invoice type
            let transaction_type_name = "Purchase";
            switch (invoice.invoice_type) {
                case "Purchase":
                    transaction_type_name = "Purchase Invoice";
                    break;
                case "Purchase_Return":
                    transaction_type_name = "Purchase Return";
                    break;
                case "Debit_Note":
                    transaction_type_name = "Debit Note";
                    break;
                case "Purchase_Order":
                    transaction_type_name = "Purchase Order";
                    break;
                default:
                    transaction_type_name = invoice.invoice_type;
            }

            // Calculate money in/out based on transaction type
            let money_in = 0;
            let money_out = 0;

            if (invoice.invoice_type === "Purchase_Return" || invoice.invoice_type === "Debit_Note") {
                // For returns and debit notes, money comes in (we get refund)
                money_in = total_amount;
                money_out = 0;
            } else {
                // For regular purchases, money goes out
                money_out = total_amount;
                money_in = 0;
            }

            // Update running balance
            running_balance += money_in - money_out;

            daybook_data.push({
                date: new Date(invoice.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                customer_name: customer_name,
                transaction_type: transaction_type_name,
                transaction_no: invoice.invoice_number,
                total_amount: Number(total_amount.toFixed(2)),
                money_in: Number(money_in.toFixed(2)),
                money_out: Number(money_out.toFixed(2)),
                balance_amount: Number(running_balance.toFixed(2))
            });
        });

        // Sort by date (newest first)
        daybook_data.sort((a, b) => new Date(b.date) - new Date(a.date));

        logger.info(`--- Daybook Report data processed successfully. Total records: ${daybook_data.length} ---`);

        return returnResponse(res, StatusCodes.OK, "Daybook Report generated successfully", {
            report_type: "Daybook_Report",
            provider_id: provider.id,
            start_date: start_date,
            end_date: end_date,
            provider_customer_id: provider_customer_id || "",
            transaction_type: transaction_type || "All",
            total_records: daybook_data.length,
            final_balance: (running_balance).toFixed(2),
            data: daybook_data
        });

    } catch (error) {
        logger.error(`Error in daybookEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate Daybook Report");
    }
}

export default daybookEndpoint;