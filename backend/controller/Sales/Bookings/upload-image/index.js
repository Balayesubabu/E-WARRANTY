import {logger,returnError,returnResponse} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { uploadSingleImage } from "../../../../services/upload.js";

const uploadImage = async (req, res) => {
    try {
        logger.info(`uploadImage`);
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
        const franchise_id = req.franchise_id;
        const image = req.file;

        if (!image) {
            logger.error(`--- Image not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Image not found", null);
        }
        logger.info(`--- Uploading image ---`);

        let imageUrl;   
        if(image){
            imageUrl = await uploadSingleImage(image);
        }
        else{
            logger.error(`--- Image upload failed ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Image upload failed", null);
        }
        logger.info(`--- Image uploaded successfully ---`);

        return returnResponse(res, StatusCodes.OK, "Image uploaded successfully", imageUrl);
    } catch (error) {
        logger.error(`--- Error in uploadImage: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
}

export { uploadImage };