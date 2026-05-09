import { logger, returnResponse, returnError } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getOwnerByUserId, getDealerById, getDealerWithFullStatus, getDealerAuditLogs } from "./query.js";

/**
 * Get dealer status endpoint
 * GET /dealer/status/:dealer_id
 * Query: { include_audit_logs?: boolean }
 */
const getDealerStatusEndpoint = async (req, res) => {
    try {
        logger.info("getDealerStatusEndpoint");

        const user_id = req.user_id;
        const { dealer_id } = req.params;
        const { include_audit_logs } = req.query;

        // Validate dealer_id
        if (!dealer_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Dealer ID is required");
        }

        // Get owner from user_id
        logger.info(`--- Fetching owner by user id: ${user_id} ---`);
        const owner = await getOwnerByUserId(user_id);
        if (!owner) {
            logger.error(`--- Owner not found with user id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Owner not found");
        }

        // Verify dealer exists and belongs to this owner
        logger.info(`--- Fetching dealer by id: ${dealer_id} ---`);
        const dealerCheck = await getDealerById(dealer_id, owner.id);
        if (!dealerCheck) {
            logger.error(`--- Dealer not found or doesn't belong to owner ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "Dealer not found or access denied");
        }

        // Get full dealer status
        const dealer = await getDealerWithFullStatus(dealer_id);

        // Optionally include audit logs
        let auditLogs = [];
        if (include_audit_logs === 'true') {
            auditLogs = await getDealerAuditLogs(dealer_id);
        }

        return returnResponse(
            res, 
            StatusCodes.OK, 
            "Dealer status retrieved successfully", 
            {
                dealer,
                audit_logs: include_audit_logs === 'true' ? auditLogs : undefined
            }
        );
    } catch (error) {
        logger.error(`getDealerStatusEndpoint error: ${error.message}`);
        return returnError(
            res, 
            StatusCodes.INTERNAL_SERVER_ERROR, 
            "Failed to get dealer status"
        );
    }
};

export { getDealerStatusEndpoint };
