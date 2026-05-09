import ExcelJS from "exceljs";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getPurchaseOrderById } from "./query.js";

const getPurchaseOrderByIdEndpoint = async (req, res) => {
  try {
    logger.info(`getPurchaseOrderByIdEndpoint`);

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
    const purchase_invoice_id = req.params.purchase_invoice_id;

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    logger.info(
      `--- Fetching purchase order details for id: ${purchase_invoice_id} ---`
    );
    const purchase_order = await getPurchaseOrderById(purchase_invoice_id,  provider.id, franchise_id);
    if (!purchase_order) {
      logger.error(
        `--- Purchase order not found for id: ${purchase_invoice_id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Purchase order not found`
      );
    }
    console.log("purchase_order",purchase_order);
    logger.info(`--- Purchase order found for id: ${purchase_invoice_id} ---`);

    return returnResponse(
      res,
      StatusCodes.OK,
      `Purchase order found`,
      purchase_order
    );
  } catch (error) {
    logger.error(`Error in getPurchaseOrderByIdEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getPurchaseOrderByIdEndpoint: ${error.message}`
    );
  }
};

const downloadPurchaseOrderEndpoint = async (req, res) => {
  try {
    logger.info(`downloadPurchaseOrderEndpoint`);

    const user_id = req.user_id;

    // --- Verify provider ---
    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    const purchase_order_id = req.params.purchase_order_id;

    // --- Fetch purchase order ---
    logger.info(
      `--- Fetching purchase order details for id: ${purchase_order_id} ---`
    );
    const purchaseOrder = await getPurchaseOrderById(purchase_order_id, provider.id, franchise_id, staff_id);
    if (!purchaseOrder) {
      logger.error(
        `--- Purchase order not found for id: ${purchase_order_id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        "Purchase order not found"
      );
    }
    logger.info(`--- Purchase order found for id: ${purchase_order_id} ---`);

    // Convert to plain object
    const plainOrder = JSON.parse(JSON.stringify(purchaseOrder));

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

    // Define headers for Purchase Order
    const headers = [
      "Order Date",
      "Order Number",
      "Party Name",
      "Order Pending Amount",
      "Order Total Amount",
      "Order Payment Status",
    ];

    const values = [
      formatDate(plainOrder.invoice_date),
      plainOrder.invoice_number ?? "",
      plainOrder.provider_customer?.customer_name ?? "",
      formatNumber(plainOrder.invoice_pending_amount),
      formatNumber(plainOrder.invoice_total_amount),
      plainOrder.invoice_payment_status ?? "",
    ];

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Purchase Order");

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
      `attachment; filename="purchase_order_${purchase_order_id}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error(`Error in downloadPurchaseOrderEndpoint:`, error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { getPurchaseOrderByIdEndpoint, downloadPurchaseOrderEndpoint };
