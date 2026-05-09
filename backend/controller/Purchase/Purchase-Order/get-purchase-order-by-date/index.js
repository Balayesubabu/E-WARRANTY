import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getPurchaseOrderByDate } from "./query.js";

const getPurchaseOrderByDateEndpoint = async (req, res) => {
    try {
        logger.info(`getPurchaseOrderByDateEndpoint`);

        let user_id;
    let staff_id;
    if (req.type === "staff") {
      user_id = req.user_id;
      staff_id = req.staff_id;
    } else {
      user_id = req.user_id;
      staff_id = null;
    }

    const franchise_id = req.franchise_id;

        const { start_date, end_date } = req.query;

        // Validate required parameters
        if (!start_date || !end_date) {
            logger.error(`--- Missing required parameters: start_date and end_date ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `start_date and end_date are required`);
        }

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        logger.info(`--- Fetching purchase orders for date range: ${start_date} to ${end_date} ---`);
        const purchase_orders = await getPurchaseOrderByDate(provider.id, staff_id, franchise_id, start_date, end_date);
        logger.info(`--- Found ${purchase_orders.length} purchase orders ---`);

        // Calculate summary
        const total_purchase_order_amount = purchase_orders.reduce((sum, order) => sum + (order.invoice_total_amount || 0), 0);
        const total_pending_amount = purchase_orders.reduce((sum, order) => sum + (order.invoice_pending_amount || 0), 0);
        const total_paid_amount = purchase_orders.reduce((sum, order) => sum + (order.invoice_paid_amount || 0), 0);

        const response = {
            purchase_orders,
            summary: {
                total_purchase_order_amount,
                total_pending_amount,
                total_paid_amount,
                total_orders: purchase_orders.length
            }
        };

        return returnResponse(res, StatusCodes.OK, `Purchase orders found`, response);
    } catch (error) {
        logger.error(`Error in getPurchaseOrderByDateEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getPurchaseOrderByDateEndpoint: ${error.message}`);
    }
}

export { getPurchaseOrderByDateEndpoint };