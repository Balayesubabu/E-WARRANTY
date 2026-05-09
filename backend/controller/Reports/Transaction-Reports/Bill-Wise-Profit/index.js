import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId, getBillWiseProfitByProviderId } from "./query.js";

const billWiseProfitEndpoint = async (req, res) => {
    try {
        logger.info(`billWiseProfitEndpoint`);

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

        const { start_date, end_date, provider_customer_id } = req.query;

        if (!start_date || !end_date) {
            return returnError(res, StatusCodes.BAD_REQUEST, "start_date and end_date are required");
        }

        logger.info(`--- Fetching bill wise profit by provider id : ${provider.id} ---`);
        const sales_invoices = await getBillWiseProfitByProviderId(provider.id,franchise_id, start_date, end_date, provider_customer_id);
        logger.info(`--- Bill wise profit data fetched successfully. Total records: ${sales_invoices.length} ---`);

        const bill_wise_profit_data = [];
        let total_profit = 0;

        // sales_invoices.forEach((invoice) => {
        //     // Calculate profit (simplified calculation)
        //     // In a real scenario, you would need to fetch purchase data for each item
        //     // For now, we'll use a simplified calculation based on invoice amounts
        //     const invoice_amount = invoice.invoice_total_amount || 0;
        //     const sales_amount = invoice.invoice_total_parts_services_amount || 0;
            
        //     // Simplified purchase amount calculation (in real scenario, this would be fetched from purchase data)
        //     // For now, we'll assume purchase amount is 70% of sales amount as an example
        //     const purchase_amount = sales_amount * 0.7;
        //     const profit = sales_amount - purchase_amount;
            
        //     total_profit += profit;

        //     bill_wise_profit_data.push({
        //         date: invoice.invoice_date,
        //         invoice_no: invoice.invoice_number,
        //         customer_name: invoice.provider_customer.customer_name || "",
        //         invoice_amount: invoice_amount,
        //         sales_amount: sales_amount,
        //         purchase_amount: purchase_amount,
        //         profit: profit
        //     });
        // });

    sales_invoices.map(invoice => {
    // Calculate total purchase price for all parts in this invoice
    const totalPurchasePrice = invoice.SalesPart.reduce((total, part) => {
        // Get the purchase price from the related product
        // console.log("part ",part);
        const purchasePrice = part.franchise_inventory?.product_purchase_price + (part.franchise_inventory?.product_purchase_price * part.franchise_inventory?.product_gst_percentage / 100) || 0;
        console.log("Purchase Price:", purchasePrice);
        // Get quantity from the sales part
        const quantity = part.part_quantity || 0;
            console.log("Quantity:", quantity);
        
        // Calculate cost for this part (purchase price * quantity)
        const purchase_cost = purchasePrice * quantity;
        // console.log(purchase_cost, " purchase_cost");

        return total + purchase_cost;   
    }, 0);

     const invoice_amount = invoice.invoice_total_amount || 0;
    const sales_amount = invoice.invoice_total_parts_services_amount || 0;
    // console.log("sales amount ",sales_amount);
    // console.log("total purchase price ",totalPurchasePrice);
    const profit = sales_amount - totalPurchasePrice;
    // console.log("profit ", profit);
    total_profit += profit;
          bill_wise_profit_data.push({
                date: new Date(invoice.invoice_date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                invoice_no: invoice.invoice_number,
                customer_name: invoice.provider_customer.customer_name || "",
                invoice_amount: invoice_amount,
                sales_amount: Number(sales_amount.toFixed(2)),
                purchase_amount: Number(totalPurchasePrice.toFixed(2)),
                profit: Number(profit.toFixed(2))
            });
        });


        logger.info(`--- Bill Wise Profit data processed successfully. Total records: ${bill_wise_profit_data.length} ---`);

        return returnResponse(res, StatusCodes.OK, "Bill Wise Profit report generated successfully", {
            report_type: "Bill_Wise_Profit",
            provider_id: provider.id,
            start_date: start_date,
            end_date: end_date,
            provider_customer_id: provider_customer_id,
            total_profit: (total_profit).toFixed(2),
            total_records: bill_wise_profit_data.length,
            data: bill_wise_profit_data
        });
    

    } catch (error) {
        logger.error(`Error in billWiseProfitEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to generate Bill Wise Profit report");
    }
}

export default billWiseProfitEndpoint;