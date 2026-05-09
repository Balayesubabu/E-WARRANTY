import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId } from "../create-product/query.js";
import { uploadSingleImage } from "../../../services/upload.js";

const uploadProductImageEndpoint = async (req, res) => {
    try {
        logger.info(`uploadProductImageEndpoint`);

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

        logger.info(`--- Fetching provider by user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found", null);
        }
        logger.info(`--- Provider found ---`);

        const product_images = req.files;

        if (!product_images) {
            logger.error(`--- Product images not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Product images not found", null);
        }
        logger.info(`--- Uploading product images ---`);


        let product_images_url = [];
        if (product_images && product_images.length > 0) {
            logger.info(`--- Found product images to upload ---`);
            try {
                for (const image of product_images) {
                    const image_url = await uploadSingleImage(image);
                    if (!image_url) {
                        throw new Error('Product image upload failed');
                    }
                    product_images_url.push(image_url);
                    logger.info(`--- Product image uploaded ---`);
                }
                logger.info(`--- All product images uploaded successfully ---`);
            } catch (error) {
                logger.error(`--- Error uploading product images: ${error.message} ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to upload product images: ${error.message}`);
            }
        }

        return returnResponse(res, StatusCodes.OK, "Product images uploaded successfully", product_images_url);
    } catch (error) {
        logger.error(`--- Error in uploadProductImageEndpoint: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { uploadProductImageEndpoint };