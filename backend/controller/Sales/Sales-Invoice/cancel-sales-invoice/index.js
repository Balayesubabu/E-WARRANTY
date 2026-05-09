import {logger, returnError, returnResponse} from "../../../../services/logger.js";
import {StatusCodes} from "http-status-codes";
import { PrismaClient } from "@prisma/client";
  import {
    getProviderByUserId,
    getSalesInvoiceById,
    updateCustomerBalance,
    restoreFranchiseInventory,
    changeStatusOfSalesInvoice,
    changeStatusOfSalesTransaction,
    changeStatusOfTransaction
  } from "./query.js";
  const prisma = new PrismaClient();

const cancelSalesInvoiceEndPoint = async (req, res) => {
    try {
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
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${user_id}`);
        }
        const {sales_invoice_id} = req.params;
        console.log("sales_invoice_id",sales_invoice_id)
        logger.info(`--- Fetching sales invoice  ---`);
        const salesInvoice = await getSalesInvoiceById(provider.id ,sales_invoice_id);
        if (!salesInvoice) {
            return returnError(res, StatusCodes.NOT_FOUND, `Sales invoice not found with id ${sales_invoice_id}`);
        }
        logger.info(`sales invoice found with id ${sales_invoice_id} `);

        logger.info(`--- Checking if sales invoice is fully paid ---`);
      if (salesInvoice.is_invoice_fully_paid === true ) {
        throw new Error(`Sales invoice is fully paid`);
      }
      if(salesInvoice.invoice_paid_amount > 0 ){
        throw new Error(`Sales invoice has some payments, cannot cancel`);
      }
      if(salesInvoice.invoice_paid_amount == 0 ){
        logger.info(`--- Sales invoice is not fully paid ---`);
        logger.info(`changing sales invoice status`)
        await changeStatusOfSalesInvoice(provider.id, sales_invoice_id);
        logger.info(`sales invoice status chnged successfully`);


        logger.info(`changing sales invoice transaction status`);
        await changeStatusOfSalesTransaction(sales_invoice_id);
        logger.info(`sales invoice transaction status chnged successfully`);

        logger.info(`changing transaction status`);
        await changeStatusOfTransaction(provider.id, sales_invoice_id);
        logger.info(`transaction status chnged successfully`);
        logger.info(`restoring customer balance`);
        const balance_difference = -salesInvoice.invoice_pending_amount;
        await updateCustomerBalance(provider.id, salesInvoice.provider_customer_id, balance_difference);
        logger.info(`customer balance restored successfully`);

        logger.info(`--- Restoring franchise inventory quantities ---`);
      for (const part of salesInvoice.SalesPart) {
        await restoreFranchiseInventory(
          part.franchise_inventory_id,
          part.part_quantity
        );
      }
      logger.info(`--- Franchise inventory quantities restored ---`);

        
      }
      
      return returnResponse(res, StatusCodes.OK, "Sales invoice cancelled successfully");

    } catch (error) {
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}  

export {cancelSalesInvoiceEndPoint};