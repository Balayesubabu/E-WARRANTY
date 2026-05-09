import { uploadSingleImage } from "../../../../services/upload.js";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";

const uploadWarrantyImageEndpoint = async (req, res) => {
    try {
        logger.info(`uploadWarrantyImageEndpoint`);

        const warranty_images = req.files || [];

        logger.info(`--- Uploading warranty image ---`)
        if (!warranty_images || warranty_images.length === 0) {
            logger.info(`--- No warranty image found ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `No warranty image found`);
        }

        const warranty_image_url = [];
        for (const image of warranty_images) {
            const image_url = await uploadSingleImage(image);
            warranty_image_url.push(image_url);
        }

        if (warranty_image_url.length === 0) {
            logger.info(`--- Failed to upload warranty image ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Failed to upload warranty image`);
        }

        logger.info(`--- Warranty image uploaded successfully ---`);
        return returnResponse(res, StatusCodes.OK, `Warranty image uploaded successfully`, { warranty_image_url });
    } catch (error) {
        logger.error(`uploadWarrantyImageEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to upload warranty image`);
    }
}

export { uploadWarrantyImageEndpoint };