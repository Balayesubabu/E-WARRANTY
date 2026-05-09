import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProformaInvoiceById } from "./query.js";
// import templateOne from "../../../../services/pdf/templates/templateOne.js";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const getProformaInvoiceByIdEndpoint = async (req, res) => {
  try {
    logger.info(`getProformaInvoiceByIdEndpoint`);

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
    const id = req.params.id;

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    logger.info(`--- Fetching proforma invoice details for id: ${id} ---`);
    const proformaInvoice = await getProformaInvoiceById(id);
    if (!proformaInvoice) {
      logger.error(`--- Proforma invoice not found for id: ${id} ---`);
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Proforma invoice not found`
      );
    }
    logger.info(`--- Proforma invoice found for id: ${id} ---`);

    return returnResponse(
      res,
      StatusCodes.OK,
      `Proforma invoice found`,
      proformaInvoice
    );
  } catch (error) {
    logger.error(`Error in getProformaInvoiceByIdEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getProformaInvoiceByIdEndpoint: ${error.message}`
    );
  }
};

// const downloadProformaInvoiceByIdEndpoint = async (req, res) => {
//   try {
//     logger.info(`downloadProformaInvoiceByIdEndpoint`);

   
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
//     const id = req.params.id;

//     // --- Verify provider ---
//     const provider = await getProviderByUserId(user_id);
//     if (!provider) {
//       return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
//     }

//     // --- Fetch proforma invoice ---
//     const proformaInvoice = await getProformaInvoiceById(id);
//     if (!proformaInvoice) {
//       return returnError(
//         res,
//         StatusCodes.NOT_FOUND,
//         "Proforma invoice not found"
//       );
//     }

//     const plainInvoice = JSON.parse(JSON.stringify(proformaInvoice));

//     // Call PDF template (returns base64 string)
//     const base64PDF = await templateOne({
//       ...plainInvoice,
//       provider, // attach provider for company details
//     });

//     // Convert base64 → Buffer
//     const pdfBuffer = Buffer.from(base64PDF, "base64");

//     // Set headers
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="proforma_invoice_${id}.pdf"`
//     );

//     // Send PDF
//     res.end(pdfBuffer);
//   } catch (error) {
//     logger.error(`Error in downloadProformaInvoiceByIdEndpoint:`, error);
//     return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
//   }
// };

const downloadProformaInvoiceByIdEndpoint = async (req, res) => {
    try {
        logger.info(`downloadProformaInvoiceByIdEndpoint`);

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
        const proforma_invoice_id = req.params.proforma_invoice_id;
        const proformaInvoice = await getProformaInvoiceById(proforma_invoice_id);
        if (!proformaInvoice) {
            return returnError(res, StatusCodes.NOT_FOUND, "Proforma invoice not found");
        }
        console.log("proformaInvoice: ", proformaInvoice);

        const plainInvoice = JSON.parse(JSON.stringify(proformaInvoice));
        console.log("plainInvoice: ", plainInvoice);

        // 3️⃣ Generate PDF buffer using pdfGenerator
        const pdfBuffer = await pdfGenerator(provider.id, plainInvoice);

        // 4️⃣ Upload to S3
        const fileName = `proforma_invoice_${proforma_invoice_id}_type_${proformaInvoice.invoice_type}_provider_${franchise_id}`;
        const s3Url = await uploadPdfToS3(pdfBuffer, fileName, 'invoices');
        
        logger.info(`Invoice uploaded to S3: ${s3Url}`);

        // 5️⃣ Return S3 URL
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Invoice generated and uploaded successfully",
            url: s3Url,
            invoice_id: proforma_invoice_id
        });

    } catch (error) {
        logger.error(`Error in downloadSalesInvoiceByIdEndpoint:`, error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

export { getProformaInvoiceByIdEndpoint, downloadProformaInvoiceByIdEndpoint };
