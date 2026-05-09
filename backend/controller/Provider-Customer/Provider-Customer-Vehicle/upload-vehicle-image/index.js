import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { getProviderByUserId } from "./query.js";
import { uploadSingleImage } from "../../../../services/upload.js";

const uploadVehicleImageEndpoint = async (req, res) => {
    try {
        logger.info(`uploadVehicleImageEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider details with user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.info(`--- No provider found with user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider with user id ${user_id} fetched successfully ---`);

        const vehicle_images = req.files.vehicle_images;
        logger.info(`--- Uploading vehicle images with data: ${JSON.stringify(vehicle_images)} ---`);

        const uploadedVehicleImages = [];
        for (const vehicle_image of vehicle_images) {
            const uploadedVehicleImage = await uploadSingleImage(vehicle_image);
            if (!uploadedVehicleImage) {
                logger.info(`--- Failed to upload vehicle image ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to upload vehicle image");
            }
            uploadedVehicleImages.push(uploadedVehicleImage);
        }

        return returnResponse(res, StatusCodes.OK, "Vehicle images uploaded successfully", uploadedVehicleImages);
    } catch (error) {
        logger.error(`uploadVehicleImageEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { uploadVehicleImageEndpoint };