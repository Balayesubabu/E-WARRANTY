import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import {
  getProviderByUserId,
  getOverviewKPIs,
  getAllPurchaseOrders,
  getInventoryMovement,
  getAggregateDealerLedger,
  getPaymentRecords,
  getWarrantyRegistry,
  getProductMaster,
} from "./query.js";

const withProvider = (handler) => async (req, res) => {
  try {
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    return await handler(req, res, provider.id);
  } catch (error) {
    logger.error(`Owner console error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const overviewEndpoint = withProvider(async (req, res, providerId) => {
  logger.info("overviewEndpoint");
  const data = await getOverviewKPIs(providerId);
  return returnResponse(res, StatusCodes.OK, "Overview data fetched", data);
});

export const purchaseOrdersEndpoint = withProvider(async (req, res, providerId) => {
  logger.info("purchaseOrdersEndpoint");
  const { page, limit, search, status } = req.query;
  const data = await getAllPurchaseOrders(providerId, {
    page: parseInt(page) || 1,
    limit: Math.min(parseInt(limit) || 20, 100),
    search,
    status,
  });
  return returnResponse(res, StatusCodes.OK, "Purchase orders fetched", data);
});

export const inventoryMovementEndpoint = withProvider(async (req, res, providerId) => {
  logger.info("inventoryMovementEndpoint");
  const { search } = req.query;
  const data = await getInventoryMovement(providerId, { search });
  return returnResponse(res, StatusCodes.OK, "Inventory movement fetched", data);
});

export const dealerLedgerEndpoint = withProvider(async (req, res, providerId) => {
  logger.info("dealerLedgerEndpoint");
  const data = await getAggregateDealerLedger(providerId);
  return returnResponse(res, StatusCodes.OK, "Dealer ledger fetched", data);
});

export const paymentRecordsEndpoint = withProvider(async (req, res, providerId) => {
  logger.info("paymentRecordsEndpoint");
  const { page, limit, search, dealer_id } = req.query;
  const data = await getPaymentRecords(providerId, {
    page: parseInt(page) || 1,
    limit: Math.min(parseInt(limit) || 20, 100),
    search,
    dealerId: dealer_id,
  });
  return returnResponse(res, StatusCodes.OK, "Payment records fetched", data);
});

export const warrantyRegistryEndpoint = withProvider(async (req, res, providerId) => {
  logger.info("warrantyRegistryEndpoint");
  const { page, limit, search, dealer_id, product } = req.query;
  const data = await getWarrantyRegistry(providerId, {
    page: parseInt(page) || 1,
    limit: Math.min(parseInt(limit) || 20, 100),
    search,
    dealerId: dealer_id,
    product,
  });
  return returnResponse(res, StatusCodes.OK, "Warranty registry fetched", data);
});

export const productMasterEndpoint = withProvider(async (req, res, providerId) => {
  logger.info("productMasterEndpoint");
  const data = await getProductMaster(providerId);
  return returnResponse(res, StatusCodes.OK, "Product master fetched", data);
});
