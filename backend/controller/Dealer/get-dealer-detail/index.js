import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getProviderByUserId, getDealerById, getDealerWarrantyStats } from "./query.js";

const getDealerDetailEndpoint = async (req, res) => {
    try {
        logger.info("getDealerDetailEndpoint");
        const { dealer_id } = req.params;
        const user_id = req.user_id;

        if (!dealer_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Dealer ID is required");
        }

        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }

        const dealer = await getDealerById(dealer_id);
        if (!dealer) {
            return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found");
        }

        if (dealer.provider_id !== provider.id) {
            return returnError(res, StatusCodes.FORBIDDEN, "Access denied");
        }

        const stats = await getDealerWarrantyStats(dealer_id);

        return returnResponse(res, StatusCodes.OK, "Dealer detail fetched", {
            ...dealer,
            stats,
        });
    } catch (error) {
        logger.error("getDealerDetailEndpoint error:", error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to fetch dealer detail");
    }
};

export { getDealerDetailEndpoint };
