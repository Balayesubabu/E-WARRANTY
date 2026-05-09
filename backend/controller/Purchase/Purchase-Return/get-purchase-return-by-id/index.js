import ExcelJS from "exceljs";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getPurchaseReturnById, getProviderByUserId,getInvoiceIdLinkedPurchaseInvoice } from "./query.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getPurchaseReturnByIdEndpoint = async (req, res) => {
  try {
    logger.info(`getPurchaseReturnByIdEndpoint`);

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

     const provider = await getProviderByUserId(user_id);

    if (!provider) {
      logger.info(`--- No provider found with user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }
    logger.info(
      `--- Provider with user id ${user_id} fetched successfully ---`
    );

    logger.info(
      `--- Fetching purchase return for id: ${purchase_invoice_id} ---`
    );
    const purchaseReturn = await getPurchaseReturnById(purchase_invoice_id, provider.id, franchise_id);

    if (!purchaseReturn) {
      logger.error(
        `--- Purchase return not found for id: ${purchase_invoice_id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Purchase return not found`
      );
    }
    if(purchaseReturn.link_to){
      const result = await getInvoiceIdLinkedPurchaseInvoice(purchaseReturn.link_to);
      if(result){
        purchaseReturn.linked_invoice_number = result.invoice_number;
      }
    }

    logger.info(`--- Purchase return found for id: ${purchase_invoice_id} ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      "Purchase return fetched successfully",
      purchaseReturn
    );
  } catch (error) {
    logger.error(`Error in getPurchaseReturnByIdEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getPurchaseReturnByIdEndpoint: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

const downloadPurchaseReturnEndpoint = async (req, res) => {
  try {
    logger.info(`downloadPurchaseReturnEndpoint`);

    const { purchase_invoice_id } = req.params;

    // --- Fetch purchase return ---
    logger.info(
      `--- Fetching purchase return details for id: ${purchase_invoice_id} ---`
    );
    const purchaseReturn = await getPurchaseReturnById(purchase_invoice_id);
    if (!purchaseReturn) {
      logger.error(
        `--- Purchase return not found for id: ${purchase_invoice_id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        "Purchase return not found"
      );
    }
    logger.info(`--- Purchase return found for id: ${purchase_invoice_id} ---`);

    // Convert to plain object
    const plainReturn = JSON.parse(JSON.stringify(purchaseReturn));

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

    // Define headers for Purchase Return
    const headers = [
      "Return Date",
      "Return Number",
      "Party Name",
      "Return Pending Amount",
      "Return Total Amount",
      "Return Status",
    ];

    const values = [
      formatDate(plainReturn.invoice_date),
      plainReturn.invoice_number ?? "",
      plainReturn.provider_customer?.customer_name ?? "",
      formatNumber(plainReturn.invoice_pending_amount),
      formatNumber(plainReturn.invoice_total_amount),
      plainReturn.invoice_payment_status ?? "",
    ];

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Purchase Return");

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
      `attachment; filename="purchase_return_${purchase_invoice_id}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error(`Error in downloadPurchaseReturnEndpoint:`, error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { getPurchaseReturnByIdEndpoint, downloadPurchaseReturnEndpoint };
