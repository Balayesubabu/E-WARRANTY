import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
    getProviderByUserId,
    getPurchaseInvoiceById,
    deletePurchaseInvoice,
    updateProviderCustomerFinalBalance,
    restoreFranchiseInventory,
    revertProviderDebitNoteNumber
} from "./query.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const deleteDebitNoteEndpoint = async (req, res) => {
    try {
        logger.info(`deleteDebitNoteEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        const debit_note_id = req.params.id;

        if (!debit_note_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Debit note ID is required");
        }

        logger.info(`--- Fetching debit note details for debit_note_id: ${debit_note_id} ---`);
        const debit_note = await getPurchaseInvoiceById(debit_note_id);
        if (!debit_note) {
            logger.error(`--- Debit note not found for debit_note_id: ${debit_note_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Debit note not found`);
        }
        logger.info(`--- Debit note found for debit_note_id: ${debit_note_id} ---`);

        // Check if debit note belongs to the provider
        if (debit_note.provider_id !== provider.id) {
            logger.error(`--- Debit note does not belong to provider ---`);
            return returnError(res, StatusCodes.FORBIDDEN, `Debit note does not belong to this provider`);
        }

        // Check if debit note is already deleted
        if (debit_note.is_deleted === true) {
            logger.error(`--- Debit note is already deleted ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Debit note is already deleted`);
        }

        logger.info(`--- Processing debit note deletion ---`);

        // Calculate balance difference for reversal
        const balance_difference = debit_note.is_invoice_fully_paid === true
            ? debit_note.invoice_total_amount  // Revert full amount if fully paid
            : debit_note.invoice_pending_amount; // Revert pending amount if not fully paid

        // Wrap all database operations in a transaction
        const result = await prisma.$transaction(async (tx) => {
            logger.info(`--- Starting transaction for debit note deletion ---`);

            // Restore franchise inventory (increment quantities back)
            logger.info(`--- Restoring franchise inventory ---`);
            for (const part of debit_note.PurchasePart) {
                await restoreFranchiseInventory(part.franchise_inventory_id, part.part_quantity, tx);
            }

            // Update customer final balance (reverse the debit note effect)
            logger.info(`--- Updating customer final balance ---`);
            await updateProviderCustomerFinalBalance(debit_note.provider_customer_id, balance_difference, tx);

            // Revert the debit note number counter
            logger.info(`--- Reverting debit note number counter ---`);
            await revertProviderDebitNoteNumber(provider.id, tx);

            // Soft delete the debit note
            logger.info(`--- Soft deleting debit note ---`);
            const deleted_debit_note = await deletePurchaseInvoice(debit_note_id, user_id, tx);

            if (!deleted_debit_note) {
                throw new Error('Failed to delete debit note');
            }

            logger.info(`--- Debit note deleted successfully ---`);
            return deleted_debit_note;
        });

        logger.info(`--- Transaction completed successfully ---`);
        return returnResponse(res, StatusCodes.OK, "Debit note deleted successfully", result);

    } catch (error) {
        logger.error(`Error in deleteDebitNoteEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in deleteDebitNoteEndpoint: ${error.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

export { deleteDebitNoteEndpoint };