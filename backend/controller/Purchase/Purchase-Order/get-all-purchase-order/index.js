import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderPurchaseOrder } from "./query.js";

const getAllPurchaseOrderEndpoint = async (req, res) => {
  try {
    logger.info(`getAllPurchaseOrderEndpoint`);

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

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    logger.info(
      `--- Fetching provider purchase order details for provider_id: ${provider.id} ---`
    );
    const providerPurchaseOrder = await getProviderPurchaseOrder(provider.id, franchise_id);

    if (!providerPurchaseOrder || providerPurchaseOrder.length === 0) {
      logger.info(
        `--- No purchase orders found for provider_id: ${provider.id} ---`
      );

      const response = {
        total_purchase_order_amount: 0,
        total_pending_amount: 0,
        total_paid_amount: 0,
        providerPurchaseOrder: [], // send empty array
      };

      return returnResponse(
        res,
        StatusCodes.OK,
        `No purchase orders found`,
        response
      );
    }

    logger.info(
      `--- Provider purchase orders found for provider_id: ${provider.id} ---`
    );

    // Calculate summary totals
    const total_purchase_order_amount = providerPurchaseOrder.reduce(
      (acc, order) => acc + order.invoice_total_amount,
      0
    );
    const total_pending_amount = providerPurchaseOrder.reduce(
      (acc, order) => acc + order.invoice_pending_amount,
      0
    );
    const total_paid_amount = providerPurchaseOrder.reduce(
      (acc, order) => acc + order.invoice_paid_amount,
      0
    );

    const response = {
      total_purchase_order_amount,
      total_pending_amount,
      total_paid_amount,
      providerPurchaseOrder,
    };

    return returnResponse(
      res,
      StatusCodes.OK,
      `Purchase orders found`,
      response
    );
  } catch (error) {
    logger.error(`Error in getAllPurchaseOrderEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getAllPurchaseOrderEndpoint: ${error.message}`
    );
  }
};

export { getAllPurchaseOrderEndpoint };
