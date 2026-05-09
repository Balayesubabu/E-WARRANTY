import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getCreditNoteById } from "./query.js";
// import templateOne from "../../../../services/pdf/templates/templateOne.js";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const getCreditNoteByIdEndpoint = async (req, res) => {
  try {
    logger.info(`getCreditNoteByIdEndpoint`);

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

    const credit_note_id = req.params.credit_note_id;
    logger.info(
      `--- Fetching credit note details for credit_note_id: ${credit_note_id} ---`
    );
    const credit_note = await getCreditNoteById(credit_note_id, provider.id);
    if (!credit_note) {
      logger.error(
        `--- Credit note not found for credit_note_id: ${credit_note_id} ---`
      );
      return returnError(res, StatusCodes.NOT_FOUND, `Credit note not found`);
    }
    logger.info(
      `--- Credit note found for credit_note_id: ${credit_note_id} ---`
    );

    logger.info(`--- Credit note fetched successfully ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      `Credit note fetched successfully`,
      credit_note
    );
  } catch (error) {
    logger.error(`Error in getCreditNoteByIdEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getCreditNoteByIdEndpoint: ${error.message}`
    );
  }
};

// const downloadCreditNoteByIdEndpoint = async (req, res) => {
//   try {
//     logger.info(`downloadCreditNoteByIdEndpoint`);

//    let user_id;
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

//     const credit_note_id = req.params.credit_note_id;
//     const creditNote = await getCreditNoteById(credit_note_id);
//     if (!creditNote) {
//       return returnError(res, StatusCodes.NOT_FOUND, "Credit Note not found");
//     }

//     const plainCreditNote = JSON.parse(JSON.stringify(creditNote));

//     // Call PDF template (returns base64 string)
//     const base64PDF = await templateOne({
//       ...plainCreditNote,
//       provider, // attach provider for company details
//     });

//     // Convert base64 → Buffer
//     const pdfBuffer = Buffer.from(base64PDF, "base64");

//     // Set headers
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="credit_note_${plainCreditNote.credit_note_number}.pdf"`
//     );

//     // Send PDF
//     res.end(pdfBuffer);
//   } catch (error) {
//     logger.error(`--- Error in downloadCreditNoteByIdEndpoint ---`, error);
//     return returnError(
//       res,
//       StatusCodes.INTERNAL_SERVER_ERROR,
//       "Something went wrong"
//     );
//   }
// };

const downloadCreditNoteByIdEndpoint = async (req, res) => {
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
        const credit_note_id = req.params.credit_note_id;
        const creditNote = await getCreditNoteById(credit_note_id);
        if (!creditNote) {
            return returnError(res, StatusCodes.NOT_FOUND, "Credit Note not found");
        }
        console.log("creditNote: ", creditNote);

        const plainInvoice = JSON.parse(JSON.stringify(creditNote));
        console.log("plainInvoice: ", plainInvoice);

        // 3️⃣ Generate PDF buffer using pdfGenerator
        const pdfBuffer = await pdfGenerator(provider.id, plainInvoice);

        // 4️⃣ Upload to S3
        const fileName = `credit_note_${credit_note_id}_type_${creditNote.invoice_type}_provider_${franchise_id}`;
        const s3Url = await uploadPdfToS3(pdfBuffer, fileName, 'invoices');
        
        logger.info(`Invoice uploaded to S3: ${s3Url}`);

        // 5️⃣ Return S3 URL
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Invoice generated and uploaded successfully",
            url: s3Url,
            invoice_id: credit_note_id
        });

    } catch (error) {
        logger.error(`Error in downloadSalesInvoiceByIdEndpoint:`, error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};


export { getCreditNoteByIdEndpoint, downloadCreditNoteByIdEndpoint };
