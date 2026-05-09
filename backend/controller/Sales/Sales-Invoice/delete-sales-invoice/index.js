import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import {
  getProviderByUserId,
  getSalesInvoiceById,
  clearSalesInvoice,
  deleteSalesInvoice,
  updateProviderCustomerFinalBalance,
  restoreFranchiseInventory,
  revertProviderSalesInvoiceNumber,
} from "./query.js";

const prisma = new PrismaClient();

const deleteSalesInvoiceEndpoint = async (req, res) => {
  try {
    logger.info(`DeleteSalesInvoiceEndpoint`);
    const sales_invoice_id = req.params.sales_invoice_id;
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
       const franchise_id = req.franchise_id

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
      logger.info(`--- Starting transaction for sales invoice deletion ---`);

      logger.info(`--- Fetching sales invoice by id ---`);
      const sales_invoice = await getSalesInvoiceById(sales_invoice_id, tx);
      if (!sales_invoice) {
        throw new Error(`Sales invoice not found with id: ${sales_invoice_id}`);
      }
      logger.info(`--- Sales invoice found with id: ${sales_invoice_id} ---`);

      logger.info(`--- Checking if sales invoice is fully paid ---`);
      if (sales_invoice.is_invoice_fully_paid === true) {
        throw new Error(`Sales invoice is fully paid`);
      }
      logger.info(`--- Sales invoice is not fully paid ---`);

      // Revert customer balance
      logger.info(`--- Reverting customer final balance ---`);
      const balance_difference = -sales_invoice.invoice_pending_amount;
      const update_customer_final_balance =
        await updateProviderCustomerFinalBalance(
          sales_invoice.provider_customer_id,
          balance_difference,
          tx
        );
      if (!update_customer_final_balance) {
        throw new Error("Failed to update customer final balance");
      }
      logger.info(`--- Customer final balance reverted ---`);

      logger.info(`--- Reverting sales invoice number for provider ---`);
      await revertProviderSalesInvoiceNumber(sales_invoice.provider_id, tx);

      // Restore franchise inventory quantities
      logger.info(`--- Restoring franchise inventory quantities ---`);
      for (const part of sales_invoice.SalesPart) {
        await restoreFranchiseInventory(
          part.franchise_inventory_id,
          part.part_quantity,
          tx
        );
      }
      logger.info(`--- Franchise inventory quantities restored ---`);

      // Clear related records
      logger.info(`--- Clearing sales invoice related records ---`);
      await clearSalesInvoice(sales_invoice_id, tx);
      logger.info(`--- Sales invoice related records cleared ---`);

      // Delete the sales invoice
      logger.info(`--- Deleting sales invoice ---`);
      const deleted_sales_invoice = await deleteSalesInvoice(
        sales_invoice_id,
        tx
      );
      if (!deleted_sales_invoice) {
        throw new Error("Failed to delete sales invoice");
      }
      logger.info(`--- Sales invoice deleted ---`);

      return deleted_sales_invoice;
    });

    logger.info(`--- Transaction completed successfully ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      `Sales invoice deleted successfully`,
      result
    );
  } catch (error) {
    logger.error(`--- Error in deleting sales invoice ---`, error);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in deleting sales invoice: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { deleteSalesInvoiceEndpoint };
