import ExcelJS from "exceljs";
import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { getProviderByUserId, getProviderCustomersFlexible,getLedgerStatementByDate } from "./query.js";

const getProviderCustomers = async (req, res) => {
  try {
    logger.info(`getProviderCustomers`);
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
    const { start_date, end_date } = req.query;

    logger.info(`--- Fetching provider id from the user id ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Provider not found with user id ${user_id}`
      );
    }
    logger.info(`--- Fetching provider customers for provider id: ${provider.id} ---`);

    const providerCustomers = await getProviderCustomersFlexible(provider.id);
    if (!providerCustomers || providerCustomers.length === 0) {
      return returnResponse(
        res,
        StatusCodes.OK,
        `Provider customers not found for provider id ${provider.id}`,
        providerCustomers
      );
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        logger.error(`--- Invalid date format ---`);
        return returnError(res, StatusCodes.BAD_REQUEST, `Invalid date format. Use YYYY-MM-DD format`);
    }

    // Validate date range
    if (startDate > endDate) {
        logger.error(`--- Start date cannot be after end date ---`);
        return returnError(res, StatusCodes.BAD_REQUEST, `Start date cannot be after end date`);
    }

    for (let i = providerCustomers.length - 1; i >= 0; i--) {
        const provider_customer = providerCustomers[i];
        logger.info(`--- Fetching ledger statement for provider_customer_id: ${provider_customer.id} from ${start_date} to ${end_date} ---`);
        const ledgerStatement = await getLedgerStatementByDate(provider_customer.id, provider.id, franchise_id, startDate, endDate);
        // console.log("Provider_customers:", provider_customer.id);
        // console.log(`${JSON.stringify(ledgerStatement)}`);
        logger.info(`--- Ledger statement fetched for provider_customer_id: ${provider_customer.id} ---`);
        

        logger.info(`--- Sorting ledger statement according to date ---`);
        ledgerStatement.sort((a, b) => new Date(a.date) - new Date(b.date));

        logger.info(`--- Ledger statement sorted according to date ---`);

        logger.info(`--- Adding balance to each Ledger Statement ---`);
        let balance = 0;

        let balance_ledger_statement = [];
        for (const statement of ledgerStatement) {
            const { date, voucher, invoice_number, credit, debit, tds_by_self, tds_by_party, } = statement;
            if (debit > 0) {
                balance += debit;
            }
            if (credit > 0) {
                balance -= credit;
            }

            balance_ledger_statement.push({
                date,
                voucher,
                invoice_number,
                credit,
                debit,
                tds_by_self,
                tds_by_party,
                balance
            })
        }
        
        providerCustomers[i].ledgerStatement = balance_ledger_statement;
        providerCustomers[i].customer_balance = balance_ledger_statement.length > 0 ? balance_ledger_statement[balance_ledger_statement.length - 1].balance : 0;
      }


    return returnResponse(
      res,
      StatusCodes.OK,
      `Provider customers fetched successfully`,
      providerCustomers
    );
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
  }
};

const downloadProviderCustomers = async (req, res) => {
  try {
    logger.info(`downloadProviderCustomers`);

    const user_id = req.user_id;

    // --- Verify provider ---
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    // --- Fetch all provider customers ---
    const providerCustomers = await getProviderCustomersByProviderId(
      provider.id
    );
    if (!providerCustomers || providerCustomers.length === 0) {
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        "Provider customers not found"
      );
    }

    const plainProviderCustomers = JSON.parse(
      JSON.stringify(providerCustomers)
    );

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
    const worksheet = workbook.addWorksheet("Provider Customers");

    // Add header row first
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    // Add data rows
    plainProviderCustomers.forEach((cust) => {
      worksheet.addRow([
        formatDate(cust.created_at),
        cust.customer_name ?? "",
        cust.customer_email ?? "",
        cust.customer_phone ?? "",
        cust.customer_address ?? "",
        cust.customer_city ?? "",
        cust.customer_state ?? "",
        cust.customer_country ?? "",
        cust.customer_pincode ?? "",
      ]);
    });

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
      `attachment; filename="provider_customers_${provider.id}.xlsx"`
    );

    // Stream file directly to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error(`Error in downloadProviderCustomers:`, error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { getProviderCustomers, downloadProviderCustomers };
