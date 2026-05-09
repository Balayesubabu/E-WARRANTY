import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import {
  getProviderByUserId,
  getProformaInvoiceById,
  clearProformaInvoiceRecords,
  deleteProformaInvoice,
} from "./query.js";

const prisma = new PrismaClient();

const deleteProformaInvoiceEndpoint = async (req, res) => {
  try {
    logger.info(`deleteProformaInvoiceEndpoint`);
    const { proforma_invoice_id } = req.params;
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

    logger.info(`--- Fetching provider by user id ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found with user id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }

    logger.info(
      `--- Starting DB transaction for proforma invoice deletion ---`
    );
    const result = await prisma.$transaction(async (tx) => {
      logger.info(`--- Fetching proforma invoice by id ---`);
      const invoice = await getProformaInvoiceById(
        proforma_invoice_id,
        provider.id,
        tx
      );
      if (!invoice) {
        throw new Error(
          `Proforma invoice not found with id: ${proforma_invoice_id}`
        );
      }

      logger.info(`--- Clearing related records ---`);
      await clearProformaInvoiceRecords(proforma_invoice_id, tx);

      logger.info(`--- Deleting proforma invoice ---`);
      const deleted = await deleteProformaInvoice(proforma_invoice_id, tx);
      if (!deleted) {
        throw new Error("Failed to delete proforma invoice");
      }

      return deleted;
    });

    logger.info(`--- Proforma invoice deleted successfully ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      `Proforma invoice deleted successfully`,
      result
    );
  } catch (error) {
    logger.error(`--- Error in deleting proforma invoice ---`, error);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in deleting proforma invoice: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { deleteProformaInvoiceEndpoint };
