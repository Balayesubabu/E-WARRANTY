
import { getProviderByUserId, getServicePackageByName } from "./query.js";
import { StatusCodes } from "http-status-codes";
import { logger, returnResponse, returnError } from "../../../../services/logger.js";

const searchServicePackageByNameEndpoint = async (req, res) => {
    try {
        logger.info(`get user id from the request header`);
        let user_id;
        let staff_id;
        if(req.type == 'staff'){
           user_id = req.user_id;
            staff_id = req.staff_id;
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
            staff_id = null;
        }
        const franchise_id = req.franchise_id;
        logger.info(`user id is ${user_id}`);

        logger.info(`--- Fetching provider id from the user id ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${user_id} ---`);

        const { search_term} = req.body;
        
        // Validate that at least one search parameter is provided
        if (!search_term) {
            logger.error(`--- No search parameters provided ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, 'Please provide package_name or package_description to search');
        }

      

        logger.info(`--- Fetching services from the provider id ${provider.id} with search term: ${search_term} ---`);
        const servicePackage = await getServicePackageByName(search_term, provider.id,franchise_id);

        if (!servicePackage || servicePackage.length === 0) {
            logger.error(`--- Service package not found with provider id ${provider.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No service packages found matching the search criteria`);
        }

        logger.info(`--- ${servicePackage.length} service package(s) found with provider id ${provider.id} ---`);
        return returnResponse(res, StatusCodes.OK, "Service package found",servicePackage);
    } catch (error) {
        logger.error(`Error in searchServicePackageByNameEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while searching for service packages');
    }
};

export { searchServicePackageByNameEndpoint };