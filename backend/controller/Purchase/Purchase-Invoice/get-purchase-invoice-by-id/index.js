import ExcelJS from "exceljs";
import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { getProviderByUserId, getPurchaseInvoiceById } from "./query.js";

const getPurchaseInvoiceByIdEndpoint = async (req, res) => {
  try {
    logger.info(`getPurchaseInvoiceByIdEndpoint`);

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

    const purchase_invoice_id = req.params.purchase_invoice_id;

    logger.info(
      `--- Fetching purchase invoice details for purchaseInvoiceId: ${purchase_invoice_id} ---`
    );
    const purchaseInvoice = await getPurchaseInvoiceById(purchase_invoice_id, provider.id, franchise_id, staff_id);
    if (!purchaseInvoice) {
      logger.error(
        `--- Purchase invoice not found for purchaseInvoiceId: ${purchase_invoice_id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Purchase invoice not found`
      );
    }
    logger.info(
      `--- Purchase invoice found for purchaseInvoiceId: ${purchase_invoice_id} ---`
    );
    return returnResponse(
      res,
      StatusCodes.OK,
      `Purchase invoice found`,
      purchaseInvoice
    );
  } catch (error) {
    logger.error(`--- Error in getPurchaseInvoiceByIdEndpoint: ${error} ---`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Internal server error`
    );
  }
};

const downloadPurchaseInvoiceEndpoint = async (req, res) => {
  try {
    logger.info(`downloadPurchaseInvoiceEndpoint`);

  
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

    console.log("franchise_id in req", franchise_id);
    

    // --- Verify provider ---
    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    const purchase_invoice_id = req.params.purchase_invoice_id;

    // --- Fetch purchase invoice ---
    logger.info(
      `--- Fetching purchase invoice details for purchaseInvoiceId: ${purchase_invoice_id} ---`
    );
    const purchaseInvoice = await getPurchaseInvoiceById(purchase_invoice_id, provider.id, franchise_id, staff_id);
    if (!purchaseInvoice) {
      logger.error(
        `--- Purchase invoice not found for purchaseInvoiceId: ${purchase_invoice_id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        "Purchase invoice not found"
      );
    }
    logger.info(
      `--- Purchase invoice found for purchaseInvoiceId: ${purchase_invoice_id} ---`
    );

    // Convert to plain object
    const plainInvoice = JSON.parse(JSON.stringify(purchaseInvoice));

    // Helpers
    const formatDate = (d) => {
      if (!d) return "";
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString("en-GB"); // DD/MM/YYYY
    };
    const formatNumber = (n) =>
      n === null || n === undefined || n === ""
        ? ""
        : new Intl.NumberFormat("en-IN").format(n);

    // Pick required fields
    const headers = [
      "Invoice Date",
      "Invoice Number",
      "Party Name",
      "Invoice Pending Amount",
      "Invoice Total Amount",
      "Invoice Payment Status",
    ];

    const values = [
      formatDate(plainInvoice.invoice_date),
      plainInvoice.invoice_number ?? "",
      plainInvoice.provider_customer?.customer_name ?? "",
      formatNumber(plainInvoice.invoice_pending_amount),
      formatNumber(plainInvoice.invoice_total_amount),
      plainInvoice.invoice_payment_status ?? "",
    ];

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Purchase Invoice");

    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    // Add data row
    const valueRow = worksheet.addRow(values);
    valueRow.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: true,
    };

    // Auto-size columns
    headers.forEach((_, idx) => {
      const headerLen = String(headers[idx] ?? "").length;
      const valueLen = String(values[idx] ?? "").length;
      const maxLen = Math.max(headerLen, valueLen, 10);
      worksheet.getColumn(idx + 1).width = Math.min(
        Math.max(maxLen + 2, 15),
        50
      );
    });

    // Response headers for download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="purchase_invoice_${purchase_invoice_id}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error(`Error in downloadPurchaseInvoiceEndpoint:`, error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { getPurchaseInvoiceByIdEndpoint, downloadPurchaseInvoiceEndpoint };
