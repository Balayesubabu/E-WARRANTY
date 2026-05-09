import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getProviderByUserId, getDealerByEmailAndProviderId, softDeleteDealer } from "./query.js";

/**
 * Delete dealer (soft delete) - owner only
 * DELETE /dealer/delete/:dealerEmail
 */
const deleteDealerEndpoint = async (req, res) => {
    try {
        logger.info("deleteDealerEndpoint");

        if (req.type !== "provider" && req.type !== "staff") {
            return returnError(res, StatusCodes.FORBIDDEN, "Only owner or staff can delete dealers");
        }

        const provider = req.type === "staff"
            ? { id: req.provider_id }
            : await getProviderByUserId(req.user_id);
        let dealerEmail = req.params.dealerEmail;
        if (!dealerEmail) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Dealer email is required");
        }
        dealerEmail = decodeURIComponent(dealerEmail);

        if (!provider || !provider.id) {
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }

        const dealer = await getDealerByEmailAndProviderId(dealerEmail, provider.id);
        if (!dealer) {
            return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found or access denied");
        }

        if (dealer.is_deleted) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Dealer is already deleted");
        }

        await softDeleteDealer(dealer.id);
        logger.info(`Dealer ${dealer.id} soft-deleted successfully`);

        return returnResponse(res, StatusCodes.OK, "Dealer deleted successfully", {
            id: dealer.id,
            email: dealer.email,
            name: dealer.name,
        });
    } catch (error) {
        logger.error(`deleteDealerEndpoint error: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete dealer");
    }
};

export { deleteDealerEndpoint };
