import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getAuditTrailByProviderId } from "./query.js";

const auditTrailEndpoint = async (req, res) => {
    try {
        logger.info(`auditTrailEndpoint`);

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

        logger.info(`--- Fetching audit trail by provider id : ${provider.id} ---`);
        const audit_data = await getAuditTrailByProviderId(provider.id,franchise_id, start_date, end_date);
        logger.info(`--- Audit trail fetched successfully. Sales: ${audit_data.sales_invoices.length}, Purchases: ${audit_data.purchase_invoices.length} ---`);

        const audit_trail_data = [];

        // Process Sales Invoices (including all types)
        audit_data.sales_invoices.forEach((invoice) => {
            const userName = invoice.staff ? invoice.staff.name : (invoice.provider ? invoice.provider.company_name : 'Unknown User');

            // Determine action based on invoice type
            let action = "Created";
            switch (invoice.invoice_type) {
                case "Sales":
                    action = "Created (Sales Invoice)";
                    break;
                case "Sales_Return":
                    action = "Created (Sales Return)";
                    break;
                case "Credit_Note":
                    action = "Created (Credit Note)";
                    break;
                case "Booking":
                    action = "Created (Booking)";
                    break;
                case "Quotation":
                    action = "Created (Quotation)";
                    break;
                case "Payment_In":
                    action = "Created (Payment In)";
                    break;
                case "Delivery_Order":
                    action = "Created (Delivery Order)";
                    break;
                case "Proforma_Invoice":
                    action = "Created (Proforma Invoice)";
                    break;
                default:
                    action = `Created (${invoice.invoice_type})`;
            }

            audit_trail_data.push({
                date: new Date(invoice.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                voucher_no: invoice.invoice_number,
                action: action,
                by_user: userName
            });
        });

        // Process Purchase Invoices (including all types)
        audit_data.purchase_invoices.forEach((invoice) => {
            const userName = invoice.staff ? invoice.staff.name : (invoice.provider ? invoice.provider.company_name : 'Unknown User');

            // Determine action based on invoice type
            let action = "Created";
            switch (invoice.invoice_type) {
                case "Purchase":
                    action = "Created (Purchase Invoice)";
                    break;
                case "Purchase_Return":
                    action = "Created (Purchase Return)";
                    break;
                case "Debit_Note":
                    action = "Created (Debit Note)";
                    break;
                case "Purchase_Order":
                    action = "Created (Purchase Order)";
                    break;
                default:
                    action = `Created (${invoice.invoice_type})`;
            }

            audit_trail_data.push({
                date: new Date(invoice.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                voucher_no: invoice.invoice_number,
                action: action,
                by_user: userName
            });
        });

        // Sort by date (newest first)
        audit_trail_data.sort((a, b) => new Date(b.date) - new Date(a.date));

        logger.info(`--- Audit Trail data processed successfully. Total records: ${audit_trail_data.length} ---`);

        return returnResponse(res, StatusCodes.OK, "Audit Trail report generated successfully", {
            report_type: "Audit_Trail",
            provider_id: provider.id,
            start_date: start_date,
            end_date: end_date,
            total_records: audit_trail_data.length,
            data: audit_trail_data
        });

    } catch (error) {
        logger.error(`Error in auditTrailEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate Audit Trail report");
    }
}

export default auditTrailEndpoint;