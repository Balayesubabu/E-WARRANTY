import { logger, returnError, returnResponse } from "../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  createInvoiceSettings,
  getInvoiceSettings,
  updateInvoiceSettings,
  deleteInvoiceSettings,
} from "./query.js";

import { Prisma } from "@prisma/client";

// ✅ Create InvoiceSettings
const createInvoiceSettingsEndPoint = async (req, res) => {
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
        const franchise_id = req.franchise_id;
    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);

    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    // ✅ Check if invoice settings already exist
    const existingInvoiceSettings = await getInvoiceSettings(provider.id);
    if (existingInvoiceSettings) {
      logger.warn(
        `--- InvoiceSettings already exists for provider_id: ${provider.id} ---`
      );
      return returnError(
        res,
        StatusCodes.CONFLICT,
        "InvoiceSettings already exists for this provider"
      );
    }

    const data = req.body;
    const invoiceSettings = await createInvoiceSettings(provider.id, data);

    if (!invoiceSettings) {
      logger.error(`--- InvoiceSettings not created ---`);
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "InvoiceSettings not created"
      );
    }

    logger.info(`--- InvoiceSettings created ---`);
    return returnResponse(
      res,
      StatusCodes.CREATED,
      "InvoiceSettings created",
      invoiceSettings
    );
  } catch (error) {
    logger.error("Error in createInvoiceSettingsEndPoint:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return returnError(
        res,
        StatusCodes.CONFLICT,
        "InvoiceSettings with same provider_id already exists"
      );
    }

    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Internal Server Error"
    );
  }
};

// ✅ Get InvoiceSettings
const getInvoiceSettingsEndPoint = async (req, res) => {
  try {
    const user_id = req.user_id;
    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);

    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    const invoiceSettings = await getInvoiceSettings(provider.id);

    logger.info(`--- InvoiceSettings fetched ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      "InvoiceSettings fetched",
      invoiceSettings
    );
  } catch (error) {
    logger.error("Error in getInvoiceSettingsEndPoint:", error);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Internal Server Error"
    );
  }
};

// ✅ Update InvoiceSettings
const updateInvoiceSettingsEndPoint = async (req, res) => {
  try {
    const invoiceSettingsId = req.params.id;
    const user_id = req.user_id;

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    const data = req.body;

    const invoiceSettings = await updateInvoiceSettings(
      invoiceSettingsId,
      provider.id,
      data
    );

    if (!invoiceSettings) {
      logger.error(`--- InvoiceSettings not updated ---`);
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        "InvoiceSettings not found or you do not have permission to update it"
      );
    }

    logger.info(`--- InvoiceSettings updated ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      "InvoiceSettings updated",
      invoiceSettings
    );
  } catch (error) {
    logger.error("Error in updateInvoiceSettingsEndPoint:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return returnError(
        res,
        StatusCodes.CONFLICT,
        "InvoiceSettings with same provider_id already exists"
      );
    }

    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Internal Server Error"
    );
  }
};

const deleteInvoiceSettingsEndPoint = async (req, res) => {
  try {
    const user_id = req.user_id;
    const invoiceSettingsId = req.params.id;

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);

    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    const deletedInvoiceSettings = await deleteInvoiceSettings(
      invoiceSettingsId,
      provider.id
    );

    if (!deletedInvoiceSettings) {
      logger.error(
        `--- InvoiceSettings not found for provider_id: ${provider.id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        "InvoiceSettings not found"
      );
    }

    logger.info(
      `--- InvoiceSettings deleted successfully for provider_id: ${provider.id} ---`
    );
    return returnResponse(
      res,
      StatusCodes.OK,
      "InvoiceSettings deleted successfully",
      deletedInvoiceSettings
    );
  } catch (error) {
    logger.error("Error in deleteInvoiceSettingsEndPoint:", error);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Internal Server Error"
    );
  }
};

export {
  createInvoiceSettingsEndPoint,
  getInvoiceSettingsEndPoint,
  updateInvoiceSettingsEndPoint,
  deleteInvoiceSettingsEndPoint,
};
