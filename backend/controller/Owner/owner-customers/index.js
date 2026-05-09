import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import {
  getProviderByUserId,
  getCustomerSummary,
  getCustomerList,
  getCustomerDetail,
  toggleCustomerStatus,
  updateInternalNotes,
  getDealersForFilter,
} from "./query.js";

/**
 * GET /owner/customers/summary
 * Returns KPI analytics for the owner's customer base
 */
const customerSummaryEndpoint = async (req, res) => {
  try {
    logger.info("customerSummaryEndpoint");
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const summary = await getCustomerSummary(provider.id);
    return returnResponse(res, StatusCodes.OK, "Customer summary fetched", summary);
  } catch (error) {
    logger.error(`customerSummaryEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch customer summary");
  }
};

/**
 * GET /owner/customers/list
 * Returns paginated, searchable, filterable customer list
 */
const customerListEndpoint = async (req, res) => {
  try {
    logger.info("customerListEndpoint");
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const {
      page = 1,
      limit = 20,
      search,
      dealer_id: dealerId,
      region,
      claim_status: claimStatus,
      sort_by: sortBy,
      sort_order: sortOrder,
    } = req.query;

    const result = await getCustomerList(provider.id, {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10) || 20, 100),
      search,
      dealerId,
      region,
      claimStatus,
      sortBy,
      sortOrder,
    });

    return returnResponse(res, StatusCodes.OK, "Customer list fetched", result);
  } catch (error) {
    logger.error(`customerListEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch customer list");
  }
};

/**
 * GET /owner/customers/:id
 * Returns full customer detail (profile, products, claims, timeline)
 */
const customerDetailEndpoint = async (req, res) => {
  try {
    logger.info("customerDetailEndpoint");
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const { id } = req.params;
    if (!id) {
      return returnError(res, StatusCodes.BAD_REQUEST, "Customer ID is required");
    }

    const detail = await getCustomerDetail(provider.id, id);
    if (!detail) {
      return returnError(res, StatusCodes.NOT_FOUND, "Customer not found");
    }

    return returnResponse(res, StatusCodes.OK, "Customer detail fetched", detail);
  } catch (error) {
    logger.error(`customerDetailEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch customer detail");
  }
};

/**
 * PATCH /owner/customers/:id/status
 * Toggle customer Active/Blocked status
 */
const customerStatusEndpoint = async (req, res) => {
  try {
    logger.info("customerStatusEndpoint");
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return returnError(res, StatusCodes.BAD_REQUEST, "is_active must be a boolean");
    }

    const updated = await toggleCustomerStatus(id, is_active);
    return returnResponse(
      res,
      StatusCodes.OK,
      `Customer ${is_active ? "activated" : "blocked"} successfully`,
      { id: updated.id, is_active: updated.is_active }
    );
  } catch (error) {
    logger.error(`customerStatusEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update customer status");
  }
};

/**
 * POST /owner/customers/:id/notes
 * Add/Update internal notes for a customer
 */
const customerNotesEndpoint = async (req, res) => {
  try {
    logger.info("customerNotesEndpoint");
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const { id } = req.params;
    const { notes } = req.body;

    if (typeof notes !== "string") {
      return returnError(res, StatusCodes.BAD_REQUEST, "notes must be a string");
    }

    const updated = await updateInternalNotes(id, notes);
    return returnResponse(res, StatusCodes.OK, "Internal notes updated", {
      id: updated.id,
      internal_notes: updated.internal_notes,
    });
  } catch (error) {
    logger.error(`customerNotesEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update notes");
  }
};

/**
 * GET /owner/customers/dealers
 * Returns dealer list for filter dropdown
 */
const customerDealersEndpoint = async (req, res) => {
  try {
    logger.info("customerDealersEndpoint");
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const dealers = await getDealersForFilter(provider.id);
    return returnResponse(res, StatusCodes.OK, "Dealers fetched", { dealers });
  } catch (error) {
    logger.error(`customerDealersEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch dealers");
  }
};

export {
  customerSummaryEndpoint,
  customerListEndpoint,
  customerDetailEndpoint,
  customerStatusEndpoint,
  customerNotesEndpoint,
  customerDealersEndpoint,
};
