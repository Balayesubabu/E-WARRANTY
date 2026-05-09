import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import {
  getProviderByUserId,
  getDeliveryChallanById,
  clearDeliveryChallanRecords,
  deleteDeliveryChallan,
} from "./query.js";

const prisma = new PrismaClient();

const deleteDeliveryChallanEndpoint = async (req, res) => {
  try {
    logger.info(`deleteDeliveryChallanEndpoint`);
    const { delivery_challan_id } = req.params;
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

    logger.info(`--- Wrapping all DB operations in a transaction ---`);
    const result = await prisma.$transaction(async (tx) => {
      logger.info(`--- Fetching delivery challan by id ---`);
      const deliveryChallan = await getDeliveryChallanById(
        delivery_challan_id,
        provider.id,
        tx
      );
      if (!deliveryChallan) {
        throw new Error(
          `Delivery challan not found with id: ${delivery_challan_id}`
        );
      }

      logger.info(`--- Clearing related records ---`);
      await clearDeliveryChallanRecords(delivery_challan_id, tx);

      logger.info(`--- Deleting delivery challan ---`);
      const deleted = await deleteDeliveryChallan(delivery_challan_id, tx);
      if (!deleted) {
        throw new Error("Failed to delete delivery challan");
      }

      return deleted;
    });

    logger.info(`--- Transaction completed successfully ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      `Delivery challan deleted successfully`,
      result
    );
  } catch (error) {
    logger.error(`--- Error in deleting delivery challan ---`, error);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in deleting delivery challan: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { deleteDeliveryChallanEndpoint };
