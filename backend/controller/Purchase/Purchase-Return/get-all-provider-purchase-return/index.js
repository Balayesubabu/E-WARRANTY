import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getAllProviderPurchaseReturns,getProviderByUserId,getProviderPurchaseInvoice } from "./query.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getAllProviderPurchaseReturnEndpoint = async (req, res) => {
  try {
    logger.info(`getAllProviderPurchaseReturnEndpoint`);

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

      const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    logger.info(
      `--- Fetching all purchase returns for user_id: ${user_id} ---`
    );
    const purchaseReturns = await getAllProviderPurchaseReturns(provider.id, franchise_id);

    logger.info(`--- Found ${purchaseReturns.length} purchase returns ---`);

    for (let i = 0; i < purchaseReturns.length; i++) {
            if(purchaseReturns[i].link_to){
                const getInvoice = await getProviderPurchaseInvoice(purchaseReturns[i].link_to);
                purchaseReturns[i].linked_invoice_number = getInvoice ? getInvoice.invoice_number : null;
            }
        }
    logger.info(`--- Purchase returns fetched successfully ---`);

    return returnResponse(
      res,
      StatusCodes.OK,
      "Purchase returns fetched successfully",
      purchaseReturns
    );
  } catch (error) {
    logger.error(`Error in getAllProviderPurchaseReturnEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getAllProviderPurchaseReturnEndpoint: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { getAllProviderPurchaseReturnEndpoint };
