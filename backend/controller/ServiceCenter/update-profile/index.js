import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { ServiceCenter } from "../../../prisma/db-models.js";

/**
 * PUT /service-center/profile
 * Update logged-in service center's profile (name, phone, address only)
 */
const updateServiceCenterProfileEndpoint = async (req, res) => {
    try {
        const service_center_id = req.service_center_id;
        if (!service_center_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Service center authentication required");
        }

        const sc = await ServiceCenter.findUnique({
            where: { id: service_center_id, is_deleted: false },
        });

        if (!sc) {
            return returnError(res, StatusCodes.NOT_FOUND, "Service center not found");
        }

        const { name, phone, address } = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Name is required");
        }

        const updated = await ServiceCenter.update({
            where: { id: service_center_id },
            data: {
                name: (name || sc.name).trim(),
                phone: phone !== undefined ? String(phone).trim() : sc.phone,
                address: address !== undefined ? (address || null) : sc.address,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                is_active: true,
                updated_at: true,
            },
        });

        return returnResponse(res, StatusCodes.OK, "Profile updated successfully", updated);
    } catch (error) {
        logger.error(`updateServiceCenterProfileEndpoint error: ${error?.message || error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update profile");
    }
};

export { updateServiceCenterProfileEndpoint };
