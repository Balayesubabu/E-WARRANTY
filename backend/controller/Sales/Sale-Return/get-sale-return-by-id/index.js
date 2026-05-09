import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getSaleReturnById,getInvoiceIdLinkedSalesInvoice } from "./query.js";
import templateOne from "../../../../services/pdf/templates/templateOne.js";

const getSaleReturnByIdEndpoint = async (req, res) => {
  try {
    logger.info(`getSaleReturnByIdEndpoint`);

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

    logger.info(`--- Fetching sales return details for id: ${id} ---`);
    const sales_return = await getSaleReturnById(id);
    if (!sales_return) {
      logger.error(`--- Sales return not found for id: ${id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Sales return not found`);
    }
    if(sales_return.link_to){
      const linkedInvoice = await getInvoiceIdLinkedSalesInvoice(sales_return.link_to);
      if(linkedInvoice){
        sales_return.linked_invoice_number = linkedInvoice.invoice_number;
      }
      else{
        sales_return.linked_invoice_number = null;
      }
    }
    logger.info(`--- Sales return found for id: ${id} ---`);

    return returnResponse(
      res,
      StatusCodes.OK,
      `Sales return found`,
      sales_return
    );
  } catch (error) {
    logger.error(`Error in getSaleReturnByIdEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getSaleReturnByIdEndpoint: ${error.message}`
    );
  }
};

const downloadSalesReturnByIdEndpoint = async (req, res) => {
  try {
    logger.info(`downloadSalesReturnByIdEndpoint`);

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
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const id = req.params.id;
    const salesReturn = await getSaleReturnById(id);
    if (!salesReturn) {
      return returnError(res, StatusCodes.NOT_FOUND, "Sales return not found");
    }

    // Convert to plain JS object
    const plainSalesReturn = JSON.parse(JSON.stringify(salesReturn));

    // Call PDF template (returns base64 string)
    const base64PDF = await templateOne({
      ...plainSalesReturn,
      provider, // attach provider for company details
    });

    // Convert base64 → Buffer
    const pdfBuffer = Buffer.from(base64PDF, "base64");

    // Set headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="sales_return_${id}.pdf"`
    );

    // Send PDF
    res.end(pdfBuffer);
  } catch (error) {
    logger.error(`Error in downloadSalesReturnByIdEndpoint:`, error);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export { getSaleReturnByIdEndpoint, downloadSalesReturnByIdEndpoint };
