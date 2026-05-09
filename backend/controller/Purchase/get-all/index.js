import ExcelJS from "exceljs";
import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getProviderByUserId, getProviderPurchaseInvoice, getInvoiceIdLinkedPurchaseInvoice} from "./query.js";

const getAllPurchaseInvoiceEndpoint = async (req, res) => {
  try {
    logger.info(`getAllPurchaseInvoiceEndpoint`);
   
    
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

    const invoice_type = req.params.invoice_type;

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    const providerPurchaseInvoice = await getProviderPurchaseInvoice(
      provider.id,
      franchise_id,
      invoice_type
    );
    if (!providerPurchaseInvoice) {
      logger.info(
        `--- Purchase Invoice for Provider with id: ${provider.id} not found ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Purchase Invoice not found`
      );
    }
    logger.info(
      `--- Purchase Invoice found for Provider with id: ${provider.id} ---`
    );

    for (let i = 0; i < providerPurchaseInvoice.length; i++) {
      const purchase_invoice = providerPurchaseInvoice[i].id;
      const result = await getInvoiceIdLinkedPurchaseInvoice(purchase_invoice);
      if(!result){
        providerPurchaseInvoice[i].is_linked = false;
        providerPurchaseInvoice[i].linked_invoice_total_amount = providerPurchaseInvoice[i].invoice_total_amount;
        providerPurchaseInvoice[i].linked_invoice_paid_amount = providerPurchaseInvoice[i].invoice_paid_amount;
        providerPurchaseInvoice[i].linked_invoice_pending_amount = providerPurchaseInvoice[i].invoice_pending_amount;
        
      }
        else{   
        providerPurchaseInvoice[i].is_linked = true;
        providerPurchaseInvoice[i].linked_invoice_total_amount = providerPurchaseInvoice[i].invoice_total_amount;
        providerPurchaseInvoice[i].linked_invoice_paid_amount = providerPurchaseInvoice[i].invoice_paid_amount + result.invoice_total_amount;
        providerPurchaseInvoice[i].linked_invoice_pending_amount = providerPurchaseInvoice[i].invoice_total_amount - (result.invoice_total_amount + providerPurchaseInvoice[i].invoice_paid_amount);
      }
    }

    const total_purchase_amount = providerPurchaseInvoice.reduce(
      (acc, invoice) => acc + invoice.linked_invoice_total_amount,
      0
    );
    const total_pending_amount = providerPurchaseInvoice.reduce(
      (acc, invoice) => acc + invoice.linked_invoice_pending_amount,
      0
    );
    const total_paid_amount = providerPurchaseInvoice.reduce(
      (acc, invoice) => acc + invoice.linked_invoice_paid_amount,
      0
    );

    const response = {
      total_purchase_amount,
      total_pending_amount,
      total_paid_amount,
      providerPurchaseInvoice,
    };
    return returnResponse(
      res,
      StatusCodes.OK,
      `Purchase Invoice found`,
      response
    );
  } catch (error) {
    logger.error(`--- Error in getAllPurchaseInvoiceEndpoint: ${error} ---`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Internal server error`
    );
  }
};

const downloadAllPurchaseInvoiceEndpoint = async (req, res) => {
  try {
    logger.info(`downloadAllPurchaseInvoiceEndpoint`);

    const user_id = req.user_id;

    // --- Verify provider ---
    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    // --- Fetch all purchase invoices ---
    logger.info(
      `--- Fetching purchase invoices for provider_id: ${provider.id} ---`
    );
    const providerPurchaseInvoice = await getProviderPurchaseInvoice(
      provider.id
    );
    if (!providerPurchaseInvoice || providerPurchaseInvoice.length === 0) {
      logger.info(
        `--- No purchase invoices found for provider_id: ${provider.id} ---`
      );
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        "Purchase Invoice not found"
      );
    }
    logger.info(
      `--- Purchase invoices found for provider_id: ${provider.id} ---`
    );

    const plainProviderPurchaseInvoice = JSON.parse(
      JSON.stringify(providerPurchaseInvoice)
    );

    // Helpers
    const formatDate = (d) => {
      if (!d) return "";
      const dt = new Date(d);
      return Number.isNaN(dt.getTime())
        ? String(d)
        : dt.toLocaleDateString("en-GB"); // DD/MM/YYYY
    };
    const formatNumber = (n) =>
      n === null || n === undefined || n === ""
        ? ""
        : new Intl.NumberFormat("en-IN").format(n);

    // Headers for Purchase Invoice
    const headers = [
      "Invoice Date",
      "Invoice Number",
      "Party Name",
      "Pending Amount",
      "Total Amount",
      "Status",
    ];

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Purchase Invoices");

    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };

    // Add data rows
    plainProviderPurchaseInvoice.forEach((invoice) => {
      worksheet.addRow([
        formatDate(invoice.invoice_date),
        invoice.invoice_number ?? "",
        invoice.provider_customer?.customer_name ?? "",
        formatNumber(invoice.invoice_pending_amount),
        formatNumber(invoice.invoice_total_amount),
        invoice.invoice_payment_status ?? "",
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
      `attachment; filename="purchase_invoices_${provider.id}.xlsx"`
    );

    // Stream file to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error(`Error in downloadAllPurchaseInvoiceEndpoint:`, error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { getAllPurchaseInvoiceEndpoint, downloadAllPurchaseInvoiceEndpoint };
