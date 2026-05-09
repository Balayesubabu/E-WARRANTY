import ExcelJS from "exceljs";
import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { getProviderByUserId, getCustomerById } from "./query.js";

const getProviderCustomerById = async (req, res) => {
  try {
    logger.info(`getProviderCustomerById`);

    const user_id = req.user_id;
    const customer_id = req.params.customer_id;

    logger.info(`--- Fetching provider by user id ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found with user id ${user_id} ---`);
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Provider not found with user id ${user_id}`
      );
    }
    logger.info(`--- Provider found with id ${provider.id} ---`);

    logger.info(
      `--- Fetching customer ${customer_id} for provider ${provider.id} ---`
    );
    const customer = await getCustomerById(customer_id, provider.id);

    if (!customer) {
      logger.error(
        `--- Customer not found with id ${customer_id} for provider ${provider.id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Customer not found with id ${customer_id}`
      );
    }

    logger.info(
      `--- Customer ${customer_id} found for provider ${provider.id} ---`
    );
    return returnResponse(
      res,
      StatusCodes.OK,
      `Provider customer fetched successfully`,
      customer
    );
  } catch (error) {
    logger.error(`Error in getProviderCustomerById: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
  }
};

const downloadProviderCustomerById = async (req, res) => {
  try {
    logger.info(`downloadProviderCustomerById`);

    const user_id = req.user_id;
    const customer_id = req.params.customer_id;

    // --- Verify provider ---
    logger.info(`--- Fetching provider by user id ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`Provider not found for user id ${user_id}`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    // --- Fetch single customer ---
    logger.info(
      `--- Fetching customer ${customer_id} for provider ${provider.id} ---`
    );
    const customer = await getCustomerById(customer_id, provider.id);
    if (!customer) {
      logger.error(
        `Customer not found with id ${customer_id} for provider ${provider.id}`
      );
      return returnError(res, StatusCodes.NOT_FOUND, "Customer not found");
    }

    const plainCustomer = JSON.parse(JSON.stringify(customer));

    // Helpers
    const formatDate = (d) => {
      if (!d) return "";
      const dt = new Date(d);
      return Number.isNaN(dt.getTime())
        ? String(d)
        : dt.toLocaleDateString("en-GB"); // DD/MM/YYYY
    };

    // Headers (customize as per your schema)
    const headers = [
      "Date",
      "Customer Name",
      "Email",
      "Phone",
      "Address",
      "City",
      "State",
      "Country",
      "Pincode",
    ];

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Customer");

    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    // Add customer row
    worksheet.addRow([
      formatDate(plainCustomer.created_at),
      plainCustomer.customer_name ?? "",
      plainCustomer.customer_email ?? "",
      plainCustomer.customer_phone ?? "",
      plainCustomer.customer_address ?? "",
      plainCustomer.customer_city ?? "",
      plainCustomer.customer_state ?? "",
      plainCustomer.customer_country ?? "",
      plainCustomer.customer_pincode ?? "",
    ]);

    // Auto-size columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(Math.max(maxLength + 2, 15), 50);
    });

    // Set response headers for download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="provider_customer_${customer_id}.xlsx"`
    );

    // Stream file directly to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error(`Error in downloadProviderCustomerById:`, error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { getProviderCustomerById, downloadProviderCustomerById };
