import {
  logger,
  returnError,
  returnResponse,
} from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getInvoiceById } from "./query.js";
import { generatePdf } from "../../../services/pdf/generate-pdf.js";

const generateInvoiceEndpoint = async (req, res) => {
  try {
    logger.info("---generateInvoiceEndpoint---");

    const user_id = req.user_id;

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- No provider found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }
    logger.info(
      `--- Provider details fetched successfully for user_id: ${user_id} ---`
    );

    const invoice_id = req.params.invoice_id;
    if (!invoice_id) {
      logger.error(`--- Invoice ID is required ---`);
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        "Invoice ID is required"
      );
    }

    logger.info(
      `--- Fetching invoice details for invoice_id: ${invoice_id} ---`
    );
    const invoice = await getInvoiceById(invoice_id);
    if (!invoice) {
      logger.error(`--- No invoice found for invoice_id: ${invoice_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, "Invoice not found");
    }
    logger.info(
      `--- Invoice details fetched successfully for invoice_id: ${invoice_id} ---`
    );

    logger.info(`--- Generating Invoice PDF for invoice_id: ${invoice_id} ---`);
    const invoice_pdf_base64 = await generatePdf(invoice, "classic");
    logger.info(
      `--- Invoice PDF generated successfully for invoice_id: ${invoice_id} ---`
    );

    return returnResponse(
      res,
      StatusCodes.OK,
      "Invoice PDF generated successfully",
      {
        invoice_pdf_base64,
        content_type: "application/pdf",
        encoding: "base64",
      }
    );
  } catch (error) {
    logger.error(`Error in generateInvoiceEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to generate invoice"
    );
  }
};

export default generateInvoiceEndpoint;
