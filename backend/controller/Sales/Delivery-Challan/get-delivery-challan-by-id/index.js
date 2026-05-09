import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getDeliveryChallanById } from "./query.js";
// import templateOne from "../../../../services/pdf/templates/templateOne.js";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";
const getDeliveryChallanByIdEndpoint = async (req, res) => {
  try {
    logger.info(`getDeliveryChallanByIdEndpoint`);
   
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

    logger.info(`--- Fetching delivery challan details for id: ${id} ---`);
    const deliveryChallan = await getDeliveryChallanById(id);
    if (!deliveryChallan) {
      logger.error(`--- Delivery challan not found for id: ${id} ---`);
      return returnError(
        res,
        StatusCodes.NOT_FOUND,
        `Delivery challan not found`
      );
    }

    logger.info(`--- Delivery challan found for id: ${id} ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      "Delivery challan found",
      deliveryChallan
    );
  } catch (error) {
    logger.error(`Error in getDeliveryChallanByIdEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getDeliveryChallanByIdEndpoint: ${error.message}`
    );
  }
};

// const downloadDeliveryChallanByIdEndpoint = async (req, res) => {
//   try {
//     logger.info(`downloadDeliveryChallanByIdEndpoint`);

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
//         const franchise_id = req.franchise_id
//     const provider = await getProviderByUserId(user_id);
//     if (!provider) {
//       return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
//     }

//     const id = req.params.id;
//     const deliveryChallan = await getDeliveryChallanById(id);
//     if (!deliveryChallan) {
//       return returnError(
//         res,
//         StatusCodes.NOT_FOUND,
//         "Delivery challan not found"
//       );
//     }

//     // Convert to plain JS object
//     const plainChallan = JSON.parse(JSON.stringify(deliveryChallan));

//     // Call PDF template (returns base64 string)
//     const base64PDF = await templateOne({
//       ...plainChallan,
//       provider, // attach provider for company details
//     });

//     // Convert base64 → Buffer
//     const pdfBuffer = Buffer.from(base64PDF, "base64");

//     // Set headers
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="delivery_challan_${id}.pdf"`
//     );

//     // Send PDF
//     res.end(pdfBuffer);
//   } catch (error) {
//     logger.error(`Error in downloadDeliveryChallanByIdEndpoint:`, error);
//     return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
//   }
// };

const downloadDeliveryChallanByIdEndpoint = async (req, res) => {
    try {
        logger.info(`downloadDeliveryChallanByIdEndpoint`);

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

        // 2️⃣ Fetch the delivery challan
        const delivery_challan_id = req.params.delivery_challan_id;
        const deliveryChallan = await getDeliveryChallanById(delivery_challan_id);
        if (!deliveryChallan) {
            return returnError(res, StatusCodes.NOT_FOUND, "Delivery Challan not found");
        }
        console.log("deliveryChallan: ", deliveryChallan);

        const plainInvoice = JSON.parse(JSON.stringify(deliveryChallan));
        console.log("plainInvoice: ", plainInvoice);

        // 3️⃣ Generate PDF buffer using pdfGenerator
        const pdfBuffer = await pdfGenerator(provider.id, plainInvoice);

        // 4️⃣ Upload to S3
        const fileName = `delivery_challan_${delivery_challan_id}_type_${deliveryChallan.invoice_type}_provider_${franchise_id}`;
        const s3Url = await uploadPdfToS3(pdfBuffer, fileName, 'invoices');
        
        logger.info(`Invoice uploaded to S3: ${s3Url}`);

        // 5️⃣ Return S3 URL
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Invoice generated and uploaded successfully",
            url: s3Url,
            invoice_id: delivery_challan_id
        });

    } catch (error) {
        logger.error(`Error in downloadSalesInvoiceByIdEndpoint:`, error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

export { getDeliveryChallanByIdEndpoint, downloadDeliveryChallanByIdEndpoint };
