import { getProviderByUserId, getPurchaseAndSalesByCustomers } from './query.js';
import { logger, returnError, returnResponse } from '../../../../services/logger.js';
import { StatusCodes } from 'http-status-codes';


const getPartyReportByItemEndpoint = async (req, res) => {
    try {
        logger.info(`get user id`);
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
        logger.info(`user id is ${user_id}`);

        logger.info(`--- Fetching provider id from the user id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${user_id} ---`);
        const { franchise_inventory_id, start_date, end_date } = req.query
        logger.info(`--- Fetching purchase and sales from the provider id ${provider.id} ---`);
        const purchaseAndSales = await getPurchaseAndSalesByCustomers(provider.id, franchise_id, franchise_inventory_id, start_date, end_date);
        // console.log("purchaseAndSales",purchaseAndSales);
        if (!purchaseAndSales) {
            logger.error(`--- purchase and sales not found for provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `purchase and sales not found for provider id ${provider.id}`);
        }
        logger.info(`--- purchase and sales found for provider id ${provider.id} ---`);

        const reportData = purchaseAndSales.map(customer => {
            // Calculate Purchase Quantity and Purchase Amount
            const purchaseSummary = customer.PurchaseInvoice.reduce((acc, invoice) => {
                const parts = invoice.PurchasePart || [];
                return parts.reduce((partAcc, part) => ({
                    quantity: partAcc.quantity + (part.part_quantity || 0),
                    amount: partAcc.amount + (part.part_total_price || 0)
                }), acc);
            }, { quantity: 0, amount: 0 });

            // Calculate Sale Quantity and Sale Amount
            const salesSummary = customer.SalesInvoice.reduce((acc, invoice) => {
                const parts = invoice.SalesPart || [];
                return parts.reduce((partAcc, part) => ({
                    quantity: partAcc.quantity + (part.part_quantity || 0),
                    amount: partAcc.amount + (part.part_total_price || 0)
                }), acc);
            }, { quantity: 0, amount: 0 });

            if(salesSummary.quantity > 0 && purchaseSummary.quantity > 0){
            return {
                customer_name: customer.customer_name,
                sale_quantity: salesSummary.quantity,
                sale_amount: Number((salesSummary.amount).toFixed(2)),
                purchase_quantity: purchaseSummary.quantity,
                purchase_amount: Number((purchaseSummary.amount).toFixed(2))
            };
        }
        else if(salesSummary.quantity > 0 && purchaseSummary.quantity == 0){
            return {
                customer_name: customer.customer_name,
                sale_quantity: salesSummary.quantity,
                sale_amount: Number((salesSummary.amount).toFixed(2)),
                purchase_quantity: 0,
                purchase_amount: 0
            };
        }
        else if(purchaseSummary.quantity > 0 && salesSummary.quantity == 0){
            return {
                customer_name: customer.customer_name,
                sale_quantity: 0,
                sale_amount: 0,
                purchase_quantity: purchaseSummary.quantity,
                purchase_amount: Number((purchaseSummary.amount).toFixed(2))
            };
        }
        else{
            return;
        }
        }).filter(Boolean);

        // Return the formatted report data
        return returnResponse(res, StatusCodes.OK, `purchase and sales fetched successfully`, reportData);
    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { getPartyReportByItemEndpoint }