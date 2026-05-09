import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getOwnerByUserId, getDealerById, getDealerWithDetails } from "./query.js";
import { 
    deactivateDealer, 
    sendDeactivationNotification 
} from "../../../services/dealer-status-service.js";

/**
 * Deactivate a dealer endpoint
 * POST /dealer/deactivate/:dealer_id
 * Body: { reason?: string }
 */
const deactivateDealerEndpoint = async (req, res) => {
    try {
        logger.info("deactivateDealerEndpoint");

        if (req.type !== "provider" && req.type !== "staff") {
            return returnError(res, StatusCodes.FORBIDDEN, `Only owner or staff can deactivate dealers`);
        }

        const { dealer_id } = req.params;
        const { reason } = req.body;

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

        // Check if already inactive
        if (dealer.status === 'INACTIVE') {
            return returnError(res, StatusCodes.BAD_REQUEST, "Dealer is already inactive");
        }

        // Get request info for audit log
        const requestInfo = {
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent']
        };

        // Perform deactivation
        logger.info(`--- Deactivating dealer: ${dealer_id} ---`);
        const updatedDealer = await deactivateDealer(dealer_id, owner.id, reason, requestInfo);
        logger.info(`--- Dealer deactivated successfully ---`);

        // Send notification email (non-blocking)
        sendDeactivationNotification(dealer, reason).catch(err => {
            logger.error(`Failed to send deactivation email: ${err.message}`);
        });

        return returnResponse(
            res, 
            StatusCodes.OK, 
            "Dealer deactivated successfully", 
            {
                id: updatedDealer.id,
                name: updatedDealer.name,
                email: updatedDealer.email,
                status: updatedDealer.status,
                inactivated_at: updatedDealer.inactivated_at,
                inactivation_reason: updatedDealer.inactivation_reason
            }
        );
    } catch (error) {
        logger.error(`deactivateDealerEndpoint error: ${error.message}`);
        return returnError(
            res, 
            StatusCodes.INTERNAL_SERVER_ERROR, 
            error.message || "Failed to deactivate dealer"
        );
    }
};

export { deactivateDealerEndpoint };
