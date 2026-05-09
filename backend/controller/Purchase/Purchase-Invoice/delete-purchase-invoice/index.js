import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import {
    getProviderByUserId,
    getPurchaseInvoiceById,
    clearPurchaseInvoice,
    deletePurchaseInvoice,
    updateProviderCustomerFinalBalance,
    restoreFranchiseInventory,
    revertProviderPurchaseInvoiceNumber
} from "./query.js";

const prisma = new PrismaClient();

const deletePurchaseInvoiceEndpoint = async (req, res) => {
    try {
        logger.info(`DeletePurchaseInvoiceEndpoint`);
        const purchase_invoice_id = req.params.purchase_invoice_id;
        
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
            logger.info(`--- Starting transaction for purchase invoice deletion ---`);

            logger.info(`--- Fetching purchase invoice by id ---`);
            const purchase_invoice = await getPurchaseInvoiceById(purchase_invoice_id, tx);
            if (!purchase_invoice) {
                throw new Error(`Purchase invoice not found with id: ${purchase_invoice_id}`);
            }
            logger.info(`--- Purchase invoice found with id: ${purchase_invoice_id} ---`);

            logger.info(`--- Checking if purchase invoice is fully paid ---`);
            if (purchase_invoice.is_invoice_fully_paid === true) {
                throw new Error(`Purchase invoice is fully paid`);
            }
            logger.info(`--- Purchase invoice is not fully paid ---`);

            // Revert customer balance (for purchase invoices, we need to INCREASE the balance since we're canceling a purchase)
            logger.info(`--- Reverting customer final balance ---`);
            const balance_difference = purchase_invoice.invoice_pending_amount; // Positive value to increase balance
            const update_customer_final_balance = await updateProviderCustomerFinalBalance(
                purchase_invoice.provider_customer_id,
                balance_difference,
                tx
            );
            if (!update_customer_final_balance) {
                throw new Error('Failed to update customer final balance');
            }
            logger.info(`--- Customer final balance reverted ---`);

            logger.info(`--- Reverting purchase invoice number for provider ---`);
            await revertProviderPurchaseInvoiceNumber(purchase_invoice.provider_id, tx);

            // Restore franchise inventory quantities (for purchase invoices, we need to DECREASE inventory since we're canceling a purchase)
            logger.info(`--- Restoring franchise inventory quantities ---`);
            for (const part of purchase_invoice.PurchasePart) {
                // For purchase invoices, we need to DECREASE inventory (reverse the purchase)
                await restoreFranchiseInventory(part.franchise_inventory_id, -part.part_quantity, tx);
            }
            logger.info(`--- Franchise inventory quantities restored ---`);

            // Clear related records
            logger.info(`--- Clearing purchase invoice related records ---`);
            await clearPurchaseInvoice(purchase_invoice_id, tx);
            logger.info(`--- Purchase invoice related records cleared ---`);

            // Delete the purchase invoice
            logger.info(`--- Deleting purchase invoice ---`);
            const deleted_purchase_invoice = await deletePurchaseInvoice(purchase_invoice_id, tx);
            if (!deleted_purchase_invoice) {
                throw new Error('Failed to delete purchase invoice');
            }
            logger.info(`--- Purchase invoice deleted ---`);

            return deleted_purchase_invoice;
        });

        logger.info(`--- Transaction completed successfully ---`);
        return returnResponse(res, StatusCodes.OK, `Purchase invoice deleted successfully`, result);

    } catch (error) {
        logger.error(`--- Error in deleting purchase invoice ---`, error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in deleting purchase invoice: ${error.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

export { deletePurchaseInvoiceEndpoint };