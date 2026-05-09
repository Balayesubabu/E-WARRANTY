import ExcelJS from "exceljs";
import {
  getProviderByUserId,
  getCustomerById,
  getLedgerStatement,
} from "./query.js";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const getCustomerLedgerStatementEndpoint = async (req, res) => {
  try {
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

    const { provider_customer_id } = req.query;

    logger.info(
      `--- Fetching customer details for provider_customer_id: ${provider_customer_id} ---`
    );
    const customer = await getCustomerById(provider_customer_id, provider.id);
    if (!customer) {
      logger.error(
        `--- Customer not found for provider_customer_id: ${provider_customer_id} ---`
      );
      return returnError(res, StatusCodes.NOT_FOUND, `Customer not found`);
    }

    logger.info(
      `--- Fetching ledger statement for provider_customer_id: ${provider_customer_id} ---`
    );
    const ledgerStatement = await getLedgerStatement(
      provider_customer_id,
      provider.id,
      franchise_id
    );

    // Sort ledger by date
    ledgerStatement.sort((a, b) => new Date(a.date) - new Date(b.date));

    let balance = 0;
    let totalReceivable = 0; // total amount receivable from customer

    const balance_ledger_statement = ledgerStatement.map((statement) => {
      const {
        date,
        voucher,
        invoice_number,
        credit,
        debit,
        tds_by_self,
        tds_by_party,
      } = statement;

      if (credit > 0) {
        balance -= credit;
      } else if (debit > 0) {
        balance += debit;
        totalReceivable += debit; // Add to receivable
      }

      return {
        date,
        voucher,
        invoice_number,
        credit,
        debit,
        tds_by_self,
        tds_by_party,
        balance,
      };
    });

    // Get first and last ledger date
    const firstLedgerDate =
      balance_ledger_statement.length > 0
        ? balance_ledger_statement[0].date
        : null;
    const lastLedgerDate =
      balance_ledger_statement.length > 0
        ? balance_ledger_statement[balance_ledger_statement.length - 1].date
        : null;

    const customer_info = {
      customer_name: customer.customer_name,
      first_ledger_date: firstLedgerDate,
      last_ledger_date: lastLedgerDate,
      total_receivable: totalReceivable,
    };

    return returnResponse(
      res,
      StatusCodes.OK,
      `Ledger statement fetched successfully`,
      {
        customer_info,
        ledger: balance_ledger_statement,
      }
    );
  } catch (error) {
    logger.error(`Error in getCustomerLedgerStatementEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getCustomerLedgerStatementEndpoint`
    );
  }
};

const downloadCustomerLedgerStatementEndpoint = async (req, res) => {
  try {
    logger.info(`--- downloadCustomerLedgerStatementEndpoint ---`);

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

    // --- Verify provider ---
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const { provider_customer_id } = req.query;

    // --- Fetch customer ---
    const customer = await getCustomerById(provider_customer_id, provider.id);
    if (!customer) {
      return returnError(res, StatusCodes.NOT_FOUND, "Customer not found");
    }

    // --- Fetch ledger statement ---
    const ledgerStatement = await getLedgerStatement(
      provider_customer_id,
      provider.id
    );

    if (!ledgerStatement || ledgerStatement.length === 0) {
      return returnError(res, StatusCodes.NOT_FOUND, "Ledger not found");
    }

    // Sort ledger by date
    ledgerStatement.sort((a, b) => new Date(a.date) - new Date(b.date));

    let balance = 0;
    let totalReceivable = 0;

    const balance_ledger_statement = ledgerStatement.map((statement) => {
      const {
        date,
        voucher,
        invoice_number,
        credit,
        debit,
        tds_by_self,
        tds_by_party
      } = statement;

      if (credit > 0) {
        balance -= credit;
      } else if (debit > 0) {
        balance += debit;
        totalReceivable += debit;
      }

      return {
        date,
        voucher,
        invoice_number,
        credit,
        debit,
        tds_by_self,
        tds_by_party,
        balance
      };
    });

    // Helpers
    const formatDate = (d) => {
      if (!d) return "";
      const dt = new Date(d);
      return Number.isNaN(dt.getTime())
        ? String(d)
        : dt.toLocaleDateString("en-GB");
    };

    const formatNumber = (n) =>
      n === null || n === undefined || n === ""
        ? ""
        : new Intl.NumberFormat("en-IN").format(n);

    // Headers
    const headers = [
      "Date",
      "Voucher",
      "Invoice Number",
      "Credit",
      "Debit",
      "TDS by Self",
      "TDS by Party",
      "Balance"
    ];

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Customer Ledger");

    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true
    };

    // Add ledger rows
    balance_ledger_statement.forEach((row) => {
      worksheet.addRow([
        formatDate(row.date),
        row.voucher ?? "",
        row.invoice_number ?? "",
        formatNumber(row.credit),
        formatNumber(row.debit),
        formatNumber(row.tds_by_self),
        formatNumber(row.tds_by_party),
        formatNumber(row.balance)
      ]);
    });

    // Auto-size columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;

      column.eachCell({ includeEmpty: true }, (cell) => {
        const value = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, value.length);
      });

      column.width = Math.min(Math.max(maxLength + 2, 15), 50);
    });

    // --- Convert Excel file to Buffer (instead of streaming) ---
    const buffer = await workbook.xlsx.writeBuffer();

    // --- Convert Buffer to Base64 ---
    const file_base64 = buffer.toString("base64");

    // --- Return Base64 file in JSON format ---
    return returnResponse(
      res,
      StatusCodes.OK,
      "Ledger statement fetched successfully",
      {
        filename: `ledger_${provider.id}_${customer.customer_name}.xlsx`,
        file_base64
      }
    );

  } catch (error) {
    logger.error(`Error in downloadCustomerLedgerStatementEndpoint:`, error);

    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      error.message
    );
  }
};


export {
  getCustomerLedgerStatementEndpoint,
  downloadCustomerLedgerStatementEndpoint,
};
