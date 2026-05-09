import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getQuotationById } from "./query.js";
// import templateOne from "../../../../services/pdf/templates/templateOne.js";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";


const getQuotationByIdEndpoint = async (req, res) => {
  try {
    logger.info(`getQuotationByIdEndpoint`);

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

    logger.info(`--- Fetching quotation details for id: ${id} ---`);
    const quotation = await getQuotationById(id);
    if (!quotation) {
      logger.error(`--- Quotation not found for id: ${id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Quotation not found`);
    }
    logger.info(`--- Quotation found for id: ${id} ---`);

    return returnResponse(res, StatusCodes.OK, `Quotation found`, quotation);
  } catch (error) {
    logger.error(`Error in getQuotationByIdEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getQuotationByIdEndpoint: ${error.message}`
    );
  }
};

// const downloadQuotationByIdEndpoint = async (req, res) => {
//   try {
//     logger.info(`downloadQuotationByIdEndpoint`);

//      let user_id;
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
//     const provider = await getProviderByUserId(user_id);
//     if (!provider) {
//       return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
//     }

//     const quotation_id = req.params.quotation_id;
//     const quotation = await getQuotationById(quotation_id);
//     if (!quotation) {
//       return returnError(res, StatusCodes.NOT_FOUND, "Quotation not found");
//     }

//     const plainQuotation = JSON.parse(JSON.stringify(quotation));

//     // Call PDF template (returns base64 string)
//     const base64PDF = await templateOne({
//       ...plainQuotation,
//       provider, // attach provider for company details
//     });

//     // Convert base64 → Buffer
//     const pdfBuffer = Buffer.from(base64PDF, "base64");

//     // Set headers
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="quotation_${quotation_id}.pdf"`
//     );

//     // Send PDF
//     res.end(pdfBuffer);
//   } catch (error) {
//     logger.error(`Error in downloadQuotationByIdEndpoint:`, error);
//     return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
//   }
// };

const downloadQuotationByIdEndpoint = async (req, res) => {
    try {
        logger.info(`downloadQuotationByIdEndpoint`);

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
        const quotation_id = req.params.quotation_id;
        const quotation = await getQuotationById(quotation_id);
        if (!quotation) {
            return returnError(res, StatusCodes.NOT_FOUND, "Quotation not found");
        }
        console.log("quotation: ", quotation);

        const plainInvoice = JSON.parse(JSON.stringify(quotation));
        console.log("plainInvoice: ", plainInvoice);

        // 3️⃣ Generate PDF buffer using pdfGenerator
        const pdfBuffer = await pdfGenerator(provider.id, plainInvoice);

        // 4️⃣ Upload to S3
        const fileName = `quotation_${quotation_id}_type_${quotation.invoice_type}_provider_${franchise_id}`;
        const s3Url = await uploadPdfToS3(pdfBuffer, fileName, 'invoices');
        
        logger.info(`Invoice uploaded to S3: ${s3Url}`);

        // 5️⃣ Return S3 URL
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Invoice generated and uploaded successfully",
            url: s3Url,
            invoice_id: quotation_id
        });

    } catch (error) {
        logger.error(`Error in downloadSalesInvoiceByIdEndpoint:`, error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

export { getQuotationByIdEndpoint, downloadQuotationByIdEndpoint };
