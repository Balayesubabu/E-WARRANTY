import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getOwnerByUserId, getFranchiseByOwnerId, createDefaultFranchise } from "./query.js";

/**
 * Get or create franchise for an owner
 * - If franchise exists, return it
 * - If no franchise exists, create a default one using owner's company info
 */
const getOrCreateFranchiseEndpoint = async (req, res) => {
    try {
        logger.info("getOrCreateFranchiseEndpoint");

        const user_id = req.user_id;
        if (!user_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "User id not found in token");
        }

        logger.info(`--- Getting owner for user_id: ${user_id} ---`);
        const owner = await getOwnerByUserId(user_id);
        
        if (!owner) {
            logger.error(`--- No owner found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "No owner found for this user");
        }
        logger.info(`--- Owner found with id: ${owner.id} ---`);

        logger.info(`--- Checking if franchise exists for owner: ${owner.id} ---`);
        let franchise = await getFranchiseByOwnerId(owner.id);

        if (franchise) {
            logger.info(`--- Franchise found with id: ${franchise.id} ---`);
            return returnResponse(res, StatusCodes.OK, "Franchise retrieved successfully", {
                franchise,
                created: false
            });
        }

        logger.info(`--- No franchise found, creating default franchise ---`);
        franchise = await createDefaultFranchise(owner);

        if (!franchise) {
            logger.error(`--- Failed to create franchise for owner: ${owner.id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create franchise");
        }

        logger.info(`--- Default franchise created with id: ${franchise.id} ---`);
        return returnResponse(res, StatusCodes.CREATED, "Franchise created successfully", {
            franchise,
            created: true
        });

    } catch (error) {
        logger.error(`--- Error in getOrCreateFranchiseEndpoint: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

export { getOrCreateFranchiseEndpoint };
