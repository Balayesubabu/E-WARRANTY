import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, uploadFile } from "./query.js";
import { uploadSingleImage } from "../../../services/upload.js";
const uploadAdhaarPanEndpoint = async (req, res) => {
    try {
        logger.info(`UploadProviderDocumentEndpoint`);
        const user_id = req.user_id;

        logger.info(`--- Checking if user id: ${user_id} is provider ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found for user id: ${user_id}`);
        }

        logger.info(`--- Provider found for user id: ${user_id} ---`);

        const file_type = req.query.file_type;
        if (!file_type) {
            logger.error(`--- File type not found ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `File type not found`);
        }

        const file = req.file;
        if (!file) {
            logger.error(`--- File not found ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `File not found`);
        }
        logger.info(`--- File found ---`);

        logger.info(`--- Uploading file for user id: ${user_id} ---`);

        const file_url = await uploadSingleImage(file);
        if (!file_url) {
            logger.error(`--- File not uploaded ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `File not uploaded`);
        }
        logger.info(`--- File uploaded ---`);

        const fileuploadedProvider = await uploadFile(provider.id, file_type, file_url);
        if (!fileuploadedProvider) {
            logger.error(`--- File not found for user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `File not found for user id: ${user_id}`);
        }

        logger.info(`--- File uploaded for user id: ${user_id} ---`);
        return returnResponse(res, StatusCodes.OK, `File uploaded for user id: ${user_id}`, fileuploadedProvider);

    } catch (error) {
        logger.error(`Error in uploadAdhaarPan: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in uploadAdhaarPan: ${error}`);
    }
}

export { uploadAdhaarPanEndpoint };
