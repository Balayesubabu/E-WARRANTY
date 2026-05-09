import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { getProviderByUserId, getProviderSalesInvoice, getInvoiceIdLinkedSalesInvoice } from "./query.js";
import templateOne from "../../../../services/pdf/templates/templateOne.js";
import JSZip from "jszip";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const getProviderSalesInvoiceEndpoint = async (req, res) => {
  try {
    logger.info(`getProviderSalesInvoiceEndpoint`);
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
       const franchise_id = req.franchise_id

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }

    logger.info(`--- Provider found for user_id: ${user_id} ---`);
    const providerSalesInvoice = await getProviderSalesInvoice(provider.id, franchise_id);
    console.log("providerSalesInvoice",providerSalesInvoice);
    if (!providerSalesInvoice || providerSalesInvoice.length === 0) {
      logger.info(`--- Sales Invoice for Provider with id: ${provider.id} not found ---`);
      return returnResponse(res, StatusCodes.OK, `Sales Invoice not found`,providerSalesInvoice);
    }

    // Totals
    const total_sales_amount = providerSalesInvoice.reduce(
      (acc, invoice) => acc + invoice.invoice_total_amount,
      0
    );
    const total_pending_amount = providerSalesInvoice.reduce(
      (acc, invoice) => acc + invoice.invoice_pending_amount,
      0
    );
    const total_paid_amount = providerSalesInvoice.reduce(
      (acc, invoice) => acc + invoice.invoice_paid_amount,
      0
    );

    for (let i = 0; i < providerSalesInvoice.length; i++) {
      const sales_invoice = providerSalesInvoice[i].id;
      const result = await getInvoiceIdLinkedSalesInvoice(sales_invoice);
      if(!result){
        providerSalesInvoice[i].is_linked = false;
      }
      else{
        providerSalesInvoice[i].is_linked = true;
      }
    }

    const response = {
      total_sales_amount,
      total_pending_amount,
      total_paid_amount,
      providerSalesInvoice,
    };

    return returnResponse(res, StatusCodes.OK, `Sales Invoice found`, response);
  } catch (error) {
    logger.error(`--- Error in getProviderSalesInvoiceEndpoint: ${error} ---`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Internal server error`
    );
  }
};

const downloadAllSalesInvoiceEndpoint = async (req, res) => {
  try {
    logger.info(`downloadAllSalesInvoiceEndpoint`);

    let user_id;
    let staff_id;
    if (req.type == 'staff') {
      user_id = req.user_id;
      staff_id = req.staff_id;
    }
    if (req.type == 'provider') {
      user_id = req.user_id;
      staff_id = null;
    }
    const franchise_id = req.franchise_id;

    // 1️⃣ Verify provider
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    console.log("Provider Details: ", provider);

    // 2️⃣ Fetch all sales invoices
    let providerSalesInvoice = await getProviderSalesInvoice(provider.id);
    if (!providerSalesInvoice || providerSalesInvoice.length === 0) {
      return returnError(res, StatusCodes.NOT_FOUND, "Sales Invoice not found");
    }

    // 3️⃣ Process invoices with additional charges
    providerSalesInvoice = providerSalesInvoice.map((invoice) => {
      if (invoice.SalesAdditionalCharges?.length > 0) {
        const additionalCharges = invoice.SalesAdditionalCharges.reduce(
          (sum, charge) => sum + (charge.total_amount || 0),
          0
        );

        return {
          ...invoice,
          invoice_total_amount: invoice.invoice_total_amount + additionalCharges,
          invoice_pending_amount: invoice.invoice_pending_amount + additionalCharges,
          invoice_paid_amount: invoice.invoice_paid_amount + additionalCharges,
        };
      }
      return invoice;
    });

    const plainInvoices = JSON.parse(JSON.stringify(providerSalesInvoice));

    // 4️⃣ Create ZIP archive
    const zip = new JSZip();

    logger.info(`Generating ${plainInvoices.length} PDFs for bulk download`);

    // 5️⃣ Generate PDFs using pdfGenerator and add to ZIP
    for (const invoice of plainInvoices) {
      try {
        // Generate PDF buffer using pdfGenerator (same as single download)
        const pdfBuffer = await pdfGenerator(provider.id, invoice);
        
        // Create filename with invoice details
        const filename = `sales_invoice_${invoice.id}_type_${invoice.invoice_type}_provider_${franchise_id}.pdf`;
        
        // Add PDF buffer to ZIP
        zip.file(filename, pdfBuffer);
        
        logger.info(`Added ${filename} to ZIP`);
      } catch (pdfError) {
        logger.error(`Failed to generate PDF for invoice ${invoice.id}:`, pdfError);
        // Continue with other invoices instead of failing completely
      }
    }

    // 6️⃣ Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ 
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    logger.info(`ZIP file generated, size: ${zipBuffer.length} bytes`);

    // 7️⃣ Upload ZIP to S3 using uploadPdfToS3
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFileName = `sales_invoices_bulk_provider_${provider.id}_franchise_${franchise_id}_${timestamp}`;
    
    // Upload ZIP file (note: you may need to modify uploadPdfToS3 to handle .zip extension)
const s3Url = await uploadPdfToS3(zipBuffer, zipFileName, 'zip');

    logger.info(`Bulk invoices ZIP uploaded to S3: ${s3Url}`);

    // 8️⃣ Return S3 URL
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Bulk invoices generated and uploaded successfully",
      url: s3Url,
      total_invoices: plainInvoices.length,
      provider_id: provider.id,
      franchise_id: franchise_id
    });

  } catch (error) {
    logger.error(`Error in downloadAllSalesInvoiceEndpoint:`, error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

const getProviderSalesInvoiceOverviewEndPoint = async (req, res) => {
  try {
    logger.info(`getProviderSalesInvoiceOverviewEndPoint`);
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
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }

    logger.info(`--- Provider found for user_id: ${user_id} ---`);
    let providerSalesInvoice = await getProviderSalesInvoice(provider.id,franchise_id);
    if (!providerSalesInvoice || providerSalesInvoice.length === 0) {
      logger.info(
        `--- Sales Invoice for Provider with id: ${provider.id} not found ---`
      );
      return returnResponse(res, StatusCodes.OK, `Sales Invoice not found`, providerSalesInvoice);
    }

    logger.info(
      `--- Sales Invoice found for Provider with id: ${provider.id} ---`
    );

    for(let i=0;i<providerSalesInvoice.length;i++){
      const sales_invoice = providerSalesInvoice[i].id;
      const result = await getInvoiceIdLinkedSalesInvoice(sales_invoice);
      if(!result){
        providerSalesInvoice[i].is_linked = false;
        providerSalesInvoice[i].linked_invoice_total_amount = providerSalesInvoice[i].invoice_total_amount;
        providerSalesInvoice[i].linked_invoice_paid_amount = providerSalesInvoice[i].invoice_paid_amount;
        providerSalesInvoice[i].linked_invoice_pending_amount = providerSalesInvoice[i].invoice_pending_amount;
      }
      else{
        providerSalesInvoice[i].is_linked = true;
        providerSalesInvoice[i].linked_invoice_total_amount = providerSalesInvoice[i].invoice_total_amount;
        providerSalesInvoice[i].linked_invoice_paid_amount = result.invoice_total_amount + providerSalesInvoice[i].invoice_paid_amount;
        providerSalesInvoice[i].linked_invoice_pending_amount = providerSalesInvoice[i].invoice_total_amount - (result.invoice_total_amount + providerSalesInvoice[i].invoice_paid_amount);
      }
    }

    // Calculate Totals
    const total_sales_amount = providerSalesInvoice.reduce(
      (acc, invoice) => acc + invoice.linked_invoice_total_amount,
      0
    );
    console.log("total_sales_amount",total_sales_amount);
    const total_pending_amount = providerSalesInvoice.reduce(
      (acc, invoice) => acc + invoice.linked_invoice_pending_amount,
      0
    );
    console.log("total_pending_amount",total_pending_amount);
    const total_paid_amount = providerSalesInvoice.reduce(
      (acc, invoice) => acc + invoice.linked_invoice_paid_amount,
      0
    );
    console.log("total_paid_amount",total_paid_amount);

    const response = {
      total_sales_amount,
      total_pending_amount,
      total_paid_amount,
    };

    return returnResponse(
      res,
      StatusCodes.OK,
      `Sales Invoice overview found`,
      response
    );
  } catch (error) {
    logger.error(
      `--- Error in getProviderSalesInvoiceOverviewEndPoint: ${error} ---`
    );
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Internal server error`
    );
  }
};

export {
  getProviderSalesInvoiceEndpoint,
  downloadAllSalesInvoiceEndpoint,
  getProviderSalesInvoiceOverviewEndPoint,
};
