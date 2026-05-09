import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { ServiceCenter } from "../../../prisma/db-models.js";

/**
 * GET /service-center/profile
 * Get logged-in service center's own profile
 */
const getServiceCenterProfileEndpoint = async (req, res) => {
    try {
        const service_center_id = req.service_center_id;
        if (!service_center_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Service center authentication required");
        }

        const sc = await ServiceCenter.findUnique({
            where: { id: service_center_id, is_deleted: false },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                is_active: true,
                created_at: true,
            },
        });

        if (!sc) {
            return returnError(res, StatusCodes.NOT_FOUND, "Service center not found");
        }

        return returnResponse(res, StatusCodes.OK, "Profile fetched successfully", sc);
    } catch (error) {
        logger.error(`getServiceCenterProfileEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch profile");
    }
};

export { getServiceCenterProfileEndpoint };
