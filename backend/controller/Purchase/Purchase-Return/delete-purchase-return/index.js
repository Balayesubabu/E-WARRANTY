import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import {
    getProviderByUserId,
    getPurchaseReturnById,
    clearPurchaseReturn,
    deletePurchaseReturn,
    updateProviderCustomerFinalBalance,
    restoreFranchiseInventory,
    revertProviderPurchaseReturnNumber
} from "./query.js";

const prisma = new PrismaClient();

const deletePurchaseReturnEndpoint = async (req, res) => {
    try {
        logger.info(`DeletePurchaseReturnEndpoint`);
        const purchase_invoice_id = req.params.purchase_invoice_id;
        const user_id = req.user_id;

        // First check if provider exists outside transaction
        logger.info(`--- Fetching provider by user id ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found with user id: ${user_id} ---`);

        logger.info(`--- Wrapping all database operations in a transaction ---`);
        const result = await prisma.$transaction(async (tx) => {
            logger.info(`--- Starting transaction for purchase return deletion ---`);

            logger.info(`--- Fetching purchase return by id ---`);
            const purchase_return = await getPurchaseReturnById(purchase_invoice_id, tx);
            if (!purchase_return) {
                throw new Error(`Purchase return not found with id: ${purchase_invoice_id}`);
            }
            logger.info(`--- Purchase return found with id: ${purchase_invoice_id} ---`);

            logger.info(`--- Checking if purchase return is fully paid ---`);
            if (purchase_return.is_invoice_fully_paid === true) {
                logger.info(`--- Purchase return is fully paid, will revert full amount ---`);
            } else {
                logger.info(`--- Purchase return is not fully paid ---`);
            }

            // Revert customer balance (for purchase returns, we need to DECREASE the balance since we're canceling a return)
            logger.info(`--- Reverting customer final balance ---`);
            const balance_difference = purchase_return.is_invoice_fully_paid === true 
                ? -purchase_return.invoice_total_amount  // Revert full amount if fully paid
                : -purchase_return.invoice_pending_amount; // Revert pending amount if not fully paid
            const update_customer_final_balance = await updateProviderCustomerFinalBalance(
                purchase_return.provider_customer_id,
                balance_difference,
                tx
            );
            if (!update_customer_final_balance) {
                throw new Error('Failed to update customer final balance');
            }
            logger.info(`--- Customer final balance reverted ---`);

            logger.info(`--- Reverting purchase return number for provider ---`);
            await revertProviderPurchaseReturnNumber(purchase_return.provider_id, tx);

            // Restore franchise inventory quantities (for purchase returns, we need to INCREASE inventory since we're canceling a return)
            logger.info(`--- Restoring franchise inventory quantities ---`);
            for (const part of purchase_return.PurchasePart) {
                // For purchase returns, we need to INCREASE inventory (reverse the return)
                await restoreFranchiseInventory(part.franchise_inventory_id, part.part_quantity, tx);
            }
            logger.info(`--- Franchise inventory quantities restored ---`);

            // Clear related records
            logger.info(`--- Clearing purchase return related records ---`);
            await clearPurchaseReturn(purchase_invoice_id, tx);
            logger.info(`--- Purchase return related records cleared ---`);

            // Delete the purchase return
            logger.info(`--- Deleting purchase return ---`);
            const deleted_purchase_return = await deletePurchaseReturn(purchase_invoice_id, tx);
            if (!deleted_purchase_return) {
                throw new Error('Failed to delete purchase return');
            }
            logger.info(`--- Purchase return deleted ---`);

            return deleted_purchase_return;
        });

        logger.info(`--- Transaction completed successfully ---`);
        return returnResponse(res, StatusCodes.OK, `Purchase return deleted successfully`, result);

    } catch (error) {
        logger.error(`--- Error in deleting purchase return ---`, error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in deleting purchase return: ${error.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

export { deletePurchaseReturnEndpoint };
