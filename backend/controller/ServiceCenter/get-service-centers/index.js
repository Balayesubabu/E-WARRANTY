import { StatusCodes } from "http-status-codes";
import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { ServiceCenter } from "../../../prisma/db-models.js";

const getServiceCentersEndpoint = async (req, res) => {
  try {
    logger.info("getServiceCentersEndpoint");

    if (req.type !== "provider" && req.type !== "staff") {
      return returnError(res, StatusCodes.FORBIDDEN, "Only owner or staff can list service centers");
    }

    const provider_id = req.provider_id;
    if (!provider_id) {
      return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    }

    const list = await ServiceCenter.findMany({
      where: { provider_id, is_deleted: false },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        is_active: true,
        created_at: true,
      },
      orderBy: { name: "asc" },
    });

    return returnResponse(res, StatusCodes.OK, "Service centers fetched successfully", list);
  } catch (error) {
    logger.error(`getServiceCentersEndpoint error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch service centers");
  }
};

export { getServiceCentersEndpoint };
