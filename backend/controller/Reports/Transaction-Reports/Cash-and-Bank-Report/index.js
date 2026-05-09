import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getCashAndBankReportByProviderId } from "./query.js";

const cashAndBankReportEndpoint = async (req, res) => {
    try {
        logger.info(`cashAndBankReportEndpoint`);

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

        logger.info(`--- Fetching cash and bank report by provider id : ${provider.id} ---`);
        const transaction_data = await getCashAndBankReportByProviderId(provider.id, franchise_id, start_date, end_date, provider_customer_id, transaction_type);
        logger.info(`--- Cash and bank report data fetched successfully. Sales: ${transaction_data.sales_invoices.length}, Purchases: ${transaction_data.purchase_invoices.length} ---`);

        const cash_and_bank_data = [];
        let running_balance = 0;

        // Process Sales Invoices
        transaction_data.sales_invoices.forEach((invoice) => {
            const customer_name = invoice.provider_customer.customer_name || "";
            const invoice_amount = invoice.invoice_total_amount || 0;
            const paid_amount = invoice.invoice_paid_amount || 0;
            const pending_amount = invoice.invoice_pending_amount || 0;

            // Determine voucher type based on invoice type
            let voucher_type = "Sales";
            switch (invoice.invoice_type) {
                case "Sales":
                    voucher_type = "Sales Invoice";
                    break;
                case "Sales_Return":
                    voucher_type = "Sales Return";
                    break;
                case "Credit_Note":
                    voucher_type = "Credit Note";
                    break;
                case "Booking":
                    voucher_type = "Booking";
                    break;
                case "Quotation":
                    voucher_type = "Quotation";
                    break;
                case "Payment_In":
                    voucher_type = "Payment In";
                    break;
                case "Delivery_Order":
                    voucher_type = "Delivery Order";
                    break;
                case "Proforma_Invoice":
                    voucher_type = "Proforma Invoice";
                    break;
                default:
                    voucher_type = invoice.invoice_type;
            }

            // Get payment mode from transactions
            let pay_mode = "Cash";
            if (invoice.SalesInvoiceTransactions && invoice.SalesInvoiceTransactions.length > 0) {
                pay_mode = invoice.SalesInvoiceTransactions[0].transaction_type || "Cash";
            }

            // Calculate received amount (for sales, money comes in)
            const received = paid_amount;
            const paid = 0; // For sales, we don't pay out

            // Update running balance
            running_balance += received - paid;

            cash_and_bank_data.push({
                date: new Date(invoice.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                voucher_type: voucher_type,
                pay_mode: pay_mode,
                invoice_no: invoice.invoice_number,
                customer_name: customer_name,
                paid: Number(paid.toFixed(2)),
                received: Number(received.toFixed(2)),
                // balance: Number(running_balance.toFixed(2)),
                notes: `Invoice Amount: ${invoice_amount}, Pending: ${pending_amount}`
            });
        });

        // Process Purchase Invoices
        transaction_data.purchase_invoices.forEach((invoice) => {
            const customer_name = invoice.provider_customer.customer_name || "";
            const invoice_amount = invoice.invoice_total_amount || 0;
            const paid_amount = invoice.invoice_paid_amount || 0;
            const pending_amount = invoice.invoice_pending_amount || 0;

            // Determine voucher type based on invoice type
            let voucher_type = "Purchase";
            switch (invoice.invoice_type) {
                case "Purchase":
                    voucher_type = "Purchase Invoice";
                    break;
                case "Purchase_Return":
                    voucher_type = "Purchase Return";
                    break;
                case "Debit_Note":
                    voucher_type = "Debit Note";
                    break;
                case "Purchase_Order":
                    voucher_type = "Purchase Order";
                    break;
                default:
                    voucher_type = invoice.invoice_type;
            }

            // Get payment mode from transactions
            let pay_mode = "Cash";
            if (invoice.PurchaseInvoiceTransactions && invoice.PurchaseInvoiceTransactions.length > 0) {
                pay_mode = invoice.PurchaseInvoiceTransactions[0].transaction_type || "Cash";
            }

            // Calculate paid amount (for purchases, money goes out)
            const paid = paid_amount;
            const received = 0; // For purchases, we don't receive money

            // Update running balance
            running_balance += received - paid;

            cash_and_bank_data.push({
                date: new Date(invoice.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                voucher_type: voucher_type,
                pay_mode: pay_mode,
                invoice_no: invoice.invoice_number,
                customer_name: customer_name,
                paid: Number(paid.toFixed(2)),
                received: Number(received.toFixed(2)),
                // balance: Number(running_balance.toFixed(2)),
                notes: `Invoice Amount: ${invoice_amount}, Pending: ${pending_amount}`
            });
        });

        // Sort by date (newest first)
        cash_and_bank_data.sort((a, b) => new Date(b.date) - new Date(a.date));

        logger.info(`--- Cash and Bank Report data processed successfully. Total records: ${cash_and_bank_data.length} ---`);

        return returnResponse(res, StatusCodes.OK, "Cash and Bank Report generated successfully", {
            report_type: "Cash_and_Bank_Report",
            provider_id: provider.id,
            start_date: start_date,
            end_date: end_date,
            provider_customer_id: provider_customer_id || "",
            transaction_type: transaction_type || "All",
            total_records: cash_and_bank_data.length,
            // final_balance: Number((running_balance).toFixed(2)),
            data: cash_and_bank_data
        });

    } catch (error) {
        logger.error(`Error in cashAndBankReportEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate Cash and Bank Report");
    }
}

export default cashAndBankReportEndpoint;