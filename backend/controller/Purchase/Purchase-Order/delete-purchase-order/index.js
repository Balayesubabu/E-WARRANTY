import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { 
    getProviderByUserId, 
    getPurchaseOrderById, 
    deletePurchaseOrder,
    clearPurchaseOrder,
    revertProviderPurchaseOrderNumber
} from "./query.js";

const deletePurchaseOrderEndpoint = async (req, res) => {
    try {
        logger.info(`deletePurchaseOrderEndpoint`);

        const user_id = req.user_id;
        const purchase_invoice_id = req.params.purchase_invoice_id;

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        logger.info(`--- Fetching purchase order details for id: ${purchase_invoice_id} ---`);
        const purchase_order = await getPurchaseOrderById(purchase_invoice_id);
        if (!purchase_order) {
            logger.error(`--- Purchase order not found for id: ${purchase_invoice_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Purchase order not found`);
        }
        logger.info(`--- Purchase order found for id: ${purchase_invoice_id} ---`);

        // Validate that it's actually a purchase order
        if (purchase_order.invoice_type !== "Purchase_Order") {
            logger.error(`--- Invalid invoice type. Expected Purchase_Order, got ${purchase_order.invoice_type} ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Invalid invoice type. Only Purchase_Order can be deleted`);
        }

        // Check if purchase order is already deleted
        if (purchase_order.is_deleted) {
            logger.error(`--- Purchase order is already deleted ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Purchase order is already deleted`);
        }

        logger.info(`--- Deleting purchase order and related data for id: ${purchase_invoice_id} ---`);
        
        // Delete purchase order and all related data
        await clearPurchaseOrder(purchase_invoice_id);
        
        // Mark purchase order as deleted
        await deletePurchaseOrder(purchase_invoice_id, user_id);
        
        // Revert the invoice number
        await revertProviderPurchaseOrderNumber(provider.id);

        logger.info(`--- Purchase order deleted successfully for id: ${purchase_invoice_id} ---`);

        return returnResponse(res, StatusCodes.OK, `Purchase order deleted successfully`);
    } catch (error) {
        logger.error(`Error in deletePurchaseOrderEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in deletePurchaseOrderEndpoint: ${error.message}`);
    }
}

export { deletePurchaseOrderEndpoint };