import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  getProviderQuotationById,
  clearQuotationRecords,
  deleteQuotation,
} from "./query.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const deleteQuotationEndpoint = async (req, res) => {
  try {
    logger.info(`deleteQuotationEndpoint`);

   
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
        
    const { quotation_id } = req.params;

    logger.info(`--- Fetching provider for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    logger.info(`--- Fetching quotation for id: ${quotation_id} ---`);
    const quotation = await getProviderQuotationById(provider.id, quotation_id);
    if (!quotation) {
      return returnError(res, StatusCodes.NOT_FOUND, "Quotation not found");
    }

    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await clearQuotationRecords(quotation_id, tx);

      // Delete main quotation
      await deleteQuotation(quotation_id, tx);
    });

    return returnResponse(
      res,
      StatusCodes.OK,
      "Quotation deleted successfully"
    );
  } catch (error) {
    logger.error(`Error in deleteQuotationEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error deleting quotation: ${error.message}`
    );
  }
};

export { deleteQuotationEndpoint };
