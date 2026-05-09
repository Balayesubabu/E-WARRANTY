import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getOwnerByUserId, getDealerById } from "./query.js";
import { 
    reactivateDealer, 
    sendReactivationNotification 
} from "../../../services/dealer-status-service.js";

/**
 * Reactivate a dealer endpoint
 * POST /dealer/reactivate/:dealer_id
 * Body: { restore_listings?: boolean }
 */
const reactivateDealerEndpoint = async (req, res) => {
    try {
        logger.info("reactivateDealerEndpoint");

        if (req.type !== "provider" && req.type !== "staff") {
            return returnError(res, StatusCodes.FORBIDDEN, `Only owner or staff can reactivate dealers`);
        }

        const { dealer_id } = req.params;
        const { restore_listings = false } = req.body;

        if (!dealer_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Dealer ID is required");
        }

        const owner = req.type === "staff"
            ? { id: req.provider_id }
            : await getOwnerByUserId(req.user_id);
        if (!owner || !owner.id) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
        }
        logger.info(`--- Provider found: ${owner.id} ---`);

        // Verify dealer exists and belongs to this provider
        logger.info(`--- Fetching dealer by id: ${dealer_id} ---`);
        const dealer = await getDealerById(dealer_id, owner.id);
        if (!dealer) {
            logger.error(`--- Dealer not found or doesn't belong to provider ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found or access denied");
        }
        logger.info(`--- Dealer found: ${dealer.name} ---`);

        // Check if already active
        if (dealer.status === 'ACTIVE' && dealer.is_active === true) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Dealer is already active");
        }

        // Get request info for audit log
        const requestInfo = {
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent']
        };

        // Perform reactivation
        logger.info(`--- Reactivating dealer: ${dealer_id}, restore_listings: ${restore_listings} ---`);
        const updatedDealer = await reactivateDealer(dealer_id, owner.id, restore_listings, requestInfo);
        logger.info(`--- Dealer reactivated successfully ---`);

        // Send notification email (non-blocking)
        sendReactivationNotification(updatedDealer).catch(err => {
            logger.error(`Failed to send reactivation email: ${err.message}`);
        });

        return returnResponse(
            res, 
            StatusCodes.OK, 
            "Dealer reactivated successfully", 
            {
                id: updatedDealer.id,
                name: updatedDealer.name,
                email: updatedDealer.email,
                status: updatedDealer.status,
                is_active: updatedDealer.is_active,
                listings_restored: restore_listings
            }
        );
    } catch (error) {
        logger.error(`reactivateDealerEndpoint error: ${error.message}`);
        return returnError(
            res, 
            StatusCodes.INTERNAL_SERVER_ERROR, 
            error.message || "Failed to reactivate dealer"
        );
    }
};

export { reactivateDealerEndpoint };
