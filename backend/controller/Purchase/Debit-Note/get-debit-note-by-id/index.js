import ExcelJS from "exceljs";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getDebitNoteById } from "./query.js";

const getDebitNoteByIdEndpoint = async (req, res) => {
  try {
    logger.info(`getDebitNoteByIdEndpoint`);

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

    const debit_note_id = req.params.id;
    logger.info(
      `--- Fetching debit note details for debit_note_id: ${debit_note_id} ---`
    );
    const debit_note = await getDebitNoteById(debit_note_id, provider.id,  franchise_id);
    if (!debit_note) {
      logger.error(
        `--- Debit note not found for debit_note_id: ${debit_note_id} ---`
      );
      return returnError(res, StatusCodes.NOT_FOUND, `Debit note not found`);
    }
    logger.info(`--- Debit note found for debit_note_id: ${debit_note_id} ---`);

    logger.info(`--- Debit note fetched successfully ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      `Debit note fetched successfully`,
      debit_note
    );
  } catch (error) {
    logger.error(`Error in getDebitNoteByIdEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getDebitNoteByIdEndpoint: ${error.message}`
    );
  }
};

const downloadDebitNoteEndpoint = async (req, res) => {
  try {
    logger.info(`downloadDebitNoteEndpoint`);

    const user_id = req.user_id;

    // --- Fetch provider ---
    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    const debit_note_id = req.params.id;

    // --- Fetch debit note ---
    logger.info(`--- Fetching debit note details for id: ${debit_note_id} ---`);
    const debitNote = await getDebitNoteById(debit_note_id, provider.id);
    if (!debitNote) {
      logger.error(`--- Debit note not found for id: ${debit_note_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Debit note not found");
    }
    logger.info(`--- Debit note found for id: ${debit_note_id} ---`);

    // Convert to plain object
    const plainDebitNote = JSON.parse(JSON.stringify(debitNote));

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

    // Define headers for Debit Note
    const headers = [
      "Debit Note Date",
      "Debit Note Number",
      "Party Name",
      "Pending Amount",
      "Total Amount",
      "Status",
    ];

    const values = [
      formatDate(plainDebitNote.invoice_date),
      plainDebitNote.invoice_number ?? "",
      plainDebitNote.provider_customer?.customer_name ?? "",
      formatNumber(plainDebitNote.invoice_pending_amount),
      formatNumber(plainDebitNote.invoice_total_amount),
      plainDebitNote.invoice_payment_status ?? "",
    ];

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Debit Note");

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
      `attachment; filename="debit_note_${debit_note_id}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error(`Error in downloadDebitNoteEndpoint:`, error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { getDebitNoteByIdEndpoint, downloadDebitNoteEndpoint };
