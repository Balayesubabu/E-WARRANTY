import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { getProviderByUserId, getSalesInvoiceById } from "./query.js";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const getSalesInvoiceByIdEndpoint = async (req, res) => {
  try {
    logger.info(`getSalesInvoiceByIdEndpoint`);

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

    const sales_invoice_id = req.params.sales_invoice_id;

    logger.info(
      `--- Fetching sales invoice details for salesInvoiceId: ${sales_invoice_id} ---`
    );
    const salesInvoice = await getSalesInvoiceById(sales_invoice_id);
    if (!salesInvoice) {
      logger.error(
        `--- Sales invoice not found for salesInvoiceId: ${sales_invoice_id} ---`
      );
      return returnError(res, StatusCodes.NOT_FOUND, `Sales invoice not found`);
    }
    logger.info(
      `--- Sales invoice found for salesInvoiceId: ${sales_invoice_id} ---`
    );
    return returnResponse(
      res,
      StatusCodes.OK,
      `Sales invoice found`,
      salesInvoice
    );
  } catch (error) {
    logger.error(`--- Error in getSalesInvoiceByIdEndpoint: ${error} ---`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Internal server error`
    );
  }
};

// const downloadSalesInvoiceByIdEndpoint = async (req, res) => {
//   try {
//     logger.info(`downloadSalesInvoiceByIdEndpoint`);

   
//     let user_id;
//         let staff_id;
//         if(req.type == 'staff'){
//            user_id = req.user_id;
//             staff_id = req.staff_id;
//         }
//         if(req.type == 'provider'){
//             user_id = req.user_id;
//             staff_id = null;
//         }
//        const franchise_id = req.franchise_id

//     // 1️⃣ Fetch provider details
//     const provider = await getProviderByUserId(user_id);
//     if (!provider) {
//       return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
//     }

//     console.log("Provider Details: ", provider);
//     // 2️⃣ Fetch the sales invoice
//     const sales_invoice_id = req.params.sales_invoice_id;
//     const salesInvoice = await getSalesInvoiceById(sales_invoice_id);
//     if (!salesInvoice) {
//       return returnError(res, StatusCodes.NOT_FOUND, "Sales invoice not found");
//     }
//     console.log("salesInvoice: ", salesInvoice)

//     const plainInvoice = JSON.parse(JSON.stringify(salesInvoice));
//     console.log("plainInvoice: ", plainInvoice)

//     // 3️⃣ Generate PDF buffer using pdfGenerator
//     const pdfBuffer = await pdfGenerator(provider.id, plainInvoice);

//     // 4️⃣ Set headers and send PDF
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="sales_invoice_${sales_invoice_id}.pdf"`
//     );

//     res.end(pdfBuffer);
//   } catch (error) {
//     logger.error(`Error in downloadSalesInvoiceByIdEndpoint:`, error);
//     return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
//   }
// };

const downloadSalesInvoiceByIdEndpoint = async (req, res) => {
    try {
        logger.info(`downloadSalesInvoiceByIdEndpoint`);
        
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

        // 1️⃣ Fetch provider details
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }

        console.log("Provider Details: ", provider);

        // 2️⃣ Fetch the sales invoice
        const sales_invoice_id = req.params.sales_invoice_id;
        const salesInvoice = await getSalesInvoiceById(sales_invoice_id);
        if (!salesInvoice) {
            return returnError(res, StatusCodes.NOT_FOUND, "Sales invoice not found");
        }
        console.log("salesInvoice: ", salesInvoice);

        const plainInvoice = JSON.parse(JSON.stringify(salesInvoice));
        console.log("plainInvoice: ", plainInvoice);

        // 3️⃣ Generate PDF buffer using pdfGenerator
        const pdfBuffer = await pdfGenerator(provider.id, plainInvoice, "Sales");

        // 4️⃣ Upload to S3
        const fileName = `invoice_${sales_invoice_id}_provider_${franchise_id}`;
        const s3Url = await uploadPdfToS3(pdfBuffer, fileName, 'invoices');
        
        logger.info(`Invoice uploaded to S3: ${s3Url}`);

        // 5️⃣ Return S3 URL
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Invoice generated and uploaded successfully",
            url: s3Url,
            invoice_id: sales_invoice_id
        });

    } catch (error) {
        logger.error(`Error in downloadSalesInvoiceByIdEndpoint:`, error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

export { getSalesInvoiceByIdEndpoint, downloadSalesInvoiceByIdEndpoint };
