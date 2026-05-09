import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getProfitAndLossReportByProviderId,getProductsByFranchiseId,getStockDetailedReport,getPurchaseInvoiceById,getSalesInvoiceById } from "./query.js";

const profitAndLossReportEndpoint = async (req, res) => {
    try {
        logger.info(`profitAndLossReportEndpoint`);

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

        logger.info(`--- Fetching profit and loss report by provider id : ${provider.id} ---`);
        const transaction_data = await getProfitAndLossReportByProviderId(provider.id, franchise_id, start_date, end_date);
        logger.info(`--- Profit and loss report data fetched successfully. Sales: ${transaction_data.sales_invoices.length}, Purchases: ${transaction_data.purchase_invoices.length} ---`);
        // Initialize P&L components
        let sale_amount = 0;
        let credit_note_sale_return_amount = 0;
        let purchase_amount = 0;
        let debit_note_purchase_return_amount = 0;
        let tax_payable_amount = 0;
        let tax_receivable_amount = 0;
        let opening_stock_amount = 0;
        let closing_stock_amount = 0;
        let other_income_amount = 0;
        let indirect_expenses_amount = 0;

        // Process Sales Invoices
        transaction_data.sales_invoices.forEach((invoice) => {
            const total_amount = invoice.invoice_total_amount || 0;
            const gst_amount = invoice.invoice_gst_amount || 0;

            if (invoice.invoice_type === "Sales_Return" || invoice.invoice_type === "Credit_Note") {
                // Credit notes and sales returns reduce income
                credit_note_sale_return_amount += total_amount;
                tax_receivable_amount += gst_amount;
            } else if (invoice.invoice_type === "Sales") {
                // Regular sales increase income
                sale_amount += total_amount;
                tax_receivable_amount += gst_amount;
            } else if (invoice.invoice_type === "Payment_In") {
                // Payment in is other income
                other_income_amount += total_amount;
            }
        });

        // Process Purchase Invoices
        transaction_data.purchase_invoices.forEach((invoice) => {
            const total_amount = invoice.invoice_total_amount || 0;
            const gst_amount = invoice.invoice_gst_amount || 0;

            if (invoice.invoice_type === "Purchase_Return" || invoice.invoice_type === "Debit_Note") {
                // Debit notes and purchase returns increase income
                debit_note_purchase_return_amount += total_amount;
                tax_payable_amount += gst_amount;
            } else if (invoice.invoice_type === "Purchase") {
                // Regular purchases increase expenses
                purchase_amount += total_amount;
                tax_payable_amount += gst_amount;
            }
        });
        console.log("purchase_amount",purchase_amount);
        console.log("sale_amount",sale_amount);

         transaction_data.expenses.reduce((sum,expense) => {
                indirect_expenses_amount += expense.price;
         },0);

        // Calculate Gross Profit
        const gross_profit = sale_amount - credit_note_sale_return_amount - purchase_amount + debit_note_purchase_return_amount - tax_payable_amount + tax_receivable_amount - opening_stock_amount + closing_stock_amount;

        // Calculate Net Profit
        const net_profit = gross_profit + other_income_amount - indirect_expenses_amount;

        let products = await getProductsByFranchiseId(provider.id,franchise_id);
         console.log("products",products.length);
        const updatedProducts = await Promise.all(
            products.map(async (prd) => {
              if(prd.id){
                const reports = await getStockDetailedReport(provider.id,franchise_id, prd.id);
                let closing_stock = 0;
                for (let record of reports) {
                    if(record.sales_invoice_id){
                        let salesInvoice = await getSalesInvoiceById(record.sales_invoice_id);
                        if(salesInvoice.invoice_type === "Sales"){
                            closing_stock -= record.quantity;
                        }
                        if(salesInvoice.invoice_type === "Sales_Return"){
                            closing_stock += record.quantity;
                        }
                        if(salesInvoice.invoice_type === "Credit_Note"){
                            closing_stock += record.quantity;
                        }

                    }
                    else if(record.purchase_invoice_id){
                        let purchaseInvoice = await getPurchaseInvoiceById(record.purchase_invoice_id);
                        if(purchaseInvoice.invoice_type === "Purchase"){
                            closing_stock += record.quantity;
                        }
                        if(purchaseInvoice.invoice_type === "Purchase_Return"){
                            closing_stock -= record.quantity;
                        }
                        if(purchaseInvoice.invoice_type === "Debit_Note"){
                            closing_stock -= record.quantity;
                        }
                    }
                    else{
                        if(record.action === "adjustment"){
                            closing_stock += record.quantity;
                        }
                        if(record.action === "add"){
                            closing_stock += record.quantity;
                        }
                        if(record.action === "reduce"){
                            closing_stock -= record.quantity;   
                        }
                    }
                } 
                prd.product_quantity = closing_stock;
              }
              return prd;
            })
          );
        if(updatedProducts){

            closing_stock_amount = updatedProducts.reduce((total, product) => {
            const purchasePrice = Number(product.product_purchase_price || 0);
            console.log("purchasePrice",purchasePrice);
            const quantity = Number(product.product_quantity || 0);
            console.log("quantity",quantity);

            const closingStockAmount = purchasePrice * quantity;
            console.log("closingStockAmount",closingStockAmount);
            console.log("total",total);

            return total + closingStockAmount;
            }, 0);


        }


        // Create P&L data structure
        const profit_loss_data = [
            {
                particulars: "Sale(+)",
                amount: Number(sale_amount.toFixed(2))
            },
            {
                particulars: "Cr. Note/Sale Return(-)",
                amount: Number(credit_note_sale_return_amount.toFixed(2))
            },
            {
                particulars: "Purchase(-)",
                amount: Number(purchase_amount.toFixed(2))
            },
            {
                particulars: "Dr. Note/Purchase Return(+)",
                amount: Number(debit_note_purchase_return_amount.toFixed(2))
            },
            {
                particulars: "Tax Payable(-)",
                amount: Number(tax_payable_amount.toFixed(2))
            },
            {
                particulars: "Tax Receivable(+)",
                amount: Number(tax_receivable_amount.toFixed(2))
            },
            {
                particulars: "Opening Stock(-)",
                amount: Number(opening_stock_amount.toFixed(2))
            },
            {
                particulars: "Closing Stock(+)",
                amount: Number(closing_stock_amount.toFixed(2))
            },
            {
                particulars: "Gross Profit",
                amount: Number(gross_profit.toFixed(2))
            },
            {
                particulars: "Other Income(+)",
                amount: Number(other_income_amount.toFixed(2))
            },
            {
                particulars: "Indirect Expenses(-)",
                amount: Number(indirect_expenses_amount.toFixed(2))
            },
            {
                particulars: "Net Profit",
                amount: Number(net_profit.toFixed(2))
            }
        ];

        logger.info(`--- Profit and Loss Report data processed successfully ---`);

        return returnResponse(res, StatusCodes.OK, "Profit and Loss Report generated successfully", {
            report_type: "Profit_and_Loss_Report",
            provider_id: provider.id,
            start_date: start_date,
            end_date: end_date,
            // customer_name: customer_name || "",
            total_records: profit_loss_data.length,
            summary: {
                total_sales: sale_amount,
                total_purchases: purchase_amount,
                gross_profit: Number(gross_profit.toFixed(2)),
                net_profit: Number(net_profit.toFixed(2))
            },
            data: profit_loss_data
        });

    } catch (error) {
        logger.error(`Error in profitAndLossReportEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate Profit and Loss Report");
    }
}

export default profitAndLossReportEndpoint;