import { logger, returnResponse, returnError } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
    getProviderByUserId,
    getProviderWarrantyCodes,
    getAvailableWarrantyCodes,
    getDealerByIdAndProviderId,
    getWarrantyCodeByIdAndProviderId,
    assignWarrantyCodeToDealer,
    getWarrantyBatchAssignmentStats,
    assignWarrantyCodeBatchToDealer,
    getDealerAssignedAvailableWarrantyCodes,
    getWarrantyCodeSummaryByProviderId,
    getWarrantyBatchUnassignStats,
    unassignWarrantyCodeFromDealer,
    unassignWarrantyCodeBatchFromDealer,
    assignPartialBatchToDealer,
    unassignPartialBatchFromDealer,
    getBatchDealerAssignments
} from "./query.js";

const getProviderWarrantyCodesEndpoint = async (req, res) => {
    try {
        logger.info(`getProviderWarrantyCodesEndpoint`);
        const provider = req.type === "staff"
            ? { id: req.provider_id }
            : await getProviderByUserId(req.user_id);
        if (!provider || !provider.id) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found ---`);

        const warranty_codes = await getProviderWarrantyCodes(provider.id);
        if (!warranty_codes || (Array.isArray(warranty_codes) && warranty_codes.length === 0)) {
            logger.info(`--- No warranty codes found ---`);
            return returnResponse(res, StatusCodes.OK, `No warranty codes found`, { warranty_codes: [] });
        }
        logger.info(`--- Warranty codes found ---`);

        return returnResponse(res, StatusCodes.OK, `Warranty codes fetched successfully`, { warranty_codes });
    } catch (error) {
        logger.error(`getProviderWarrantyCodesEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to get provider warranty codes`);
    }
}

/**
 * Public endpoint: GET /available-warranty-codes/:provider_id
 * Returns only Inactive (available) warranty codes for a provider.
 * Used by dealers and customers to pick a product to register.
 */
const getAvailableWarrantyCodesEndpoint = async (req, res) => {
    try {
        logger.info(`getAvailableWarrantyCodesEndpoint`);
        const provider_id = req.params.provider_id;
        const dealer_id = req.query?.dealer_id;

        if (!provider_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, `Provider ID is required`);
        }

        // For customer flow, when dealer is selected, only show that dealer's assigned codes.
        const warranty_codes = await getAvailableWarrantyCodes(provider_id, dealer_id || null);
        logger.info(`--- Found ${warranty_codes.length} available warranty codes ---`);

        return returnResponse(res, StatusCodes.OK, `Available warranty codes fetched successfully`, { warranty_codes });
    } catch (error) {
        logger.error(`getAvailableWarrantyCodesEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to get available warranty codes`);
    }
}

/**
 * Dealer endpoint (authenticated): GET /available-warranty-codes-for-dealer
 * Returns only Inactive codes assigned to the logged-in dealer.
 */
const getDealerAssignedAvailableWarrantyCodesEndpoint = async (req, res) => {
    try {
        logger.info(`getDealerAssignedAvailableWarrantyCodesEndpoint`);

        if (req.type !== "dealer") {
            return returnError(res, StatusCodes.FORBIDDEN, `Only dealers can access this endpoint`);
        }

        const provider_id = req.provider_id;
        const dealer_id = req.dealer_id;
        const warranty_codes = await getDealerAssignedAvailableWarrantyCodes(provider_id, dealer_id);
        return returnResponse(res, StatusCodes.OK, `Dealer assigned available warranty codes fetched successfully`, { warranty_codes });
    } catch (error) {
        logger.error(`getDealerAssignedAvailableWarrantyCodesEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to get dealer assigned available warranty codes`);
    }
};

/**
 * Owner endpoint (authenticated): POST /assign-warranty-code-dealer
 * Assigns an Inactive code to a dealer under the same provider.
 * Supports both individual code assignment (warranty_code_id) and batch assignment (group_id).
 */
const assignWarrantyCodeDealerEndpoint = async (req, res) => {
    try {
        logger.info(`assignWarrantyCodeDealerEndpoint`);

        if (req.type !== "provider" && req.type !== "staff") {
            return returnError(res, StatusCodes.FORBIDDEN, `Only the owner or staff can assign warranty codes to dealers`);
        }

        const user_id = req.user_id;
        const { warranty_code_id, group_id, dealer_id } = req.body;

        if (!dealer_id || (!warranty_code_id && !group_id)) {
            return returnError(res, StatusCodes.BAD_REQUEST, `dealer_id and either warranty_code_id or group_id are required`);
        }

        const provider = req.type === "staff"
            ? { id: req.provider_id }
            : await getProviderByUserId(user_id);
        if (!provider || !provider.id) {
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }

        const dealer = await getDealerByIdAndProviderId(dealer_id, provider.id);
        if (!dealer) {
            return returnError(res, StatusCodes.NOT_FOUND, `Dealer not found or inactive for this owner`);
        }

        // Batch assignment - assign all codes in a group to dealer
        if (group_id) {
            const batch_stats = await getWarrantyBatchAssignmentStats(provider.id, group_id);
            if (!batch_stats || batch_stats.total_codes === 0) {
                return returnError(res, StatusCodes.NOT_FOUND, `Warranty batch not found`);
            }

            if (batch_stats.available_codes === 0) {
                return returnError(res, StatusCodes.BAD_REQUEST, `All warranty codes are already registered. No codes available for assignment.`);
            }

            const batch_result = await assignWarrantyCodeBatchToDealer(provider.id, group_id, dealer.id);
            if (!batch_result || batch_result.count === 0) {
                return returnError(res, StatusCodes.BAD_REQUEST, `Failed to assign warranty codes`);
            }

            return returnResponse(res, StatusCodes.OK, `Warranty batch assigned to dealer successfully`, {
                assigned: true,
                assigned_count: batch_result.count
            });
        }

        // Individual code assignment
        const warranty_code = await getWarrantyCodeByIdAndProviderId(warranty_code_id, provider.id);
        if (!warranty_code) {
            return returnError(res, StatusCodes.NOT_FOUND, `Warranty code not found`);
        }

        if (warranty_code.warranty_code_status !== "Inactive") {
            return returnError(res, StatusCodes.BAD_REQUEST, `Warranty code is already activated or registered`);
        }

        const result = await assignWarrantyCodeToDealer(provider.id, warranty_code_id, dealer.id);
        if (!result || result.count === 0) {
            return returnError(res, StatusCodes.BAD_REQUEST, `Failed to assign warranty code`);
        }

        return returnResponse(res, StatusCodes.OK, `Warranty code assigned to dealer successfully`, { assigned: true });
    } catch (error) {
        logger.error(`assignWarrantyCodeDealerEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to assign warranty code to dealer`);
    }
};

const getWarrantyCodeSummaryEndpoint = async (req, res) => {
    try {
        logger.info(`getWarrantyCodeSummaryEndpoint`);

        if (req.type !== "provider" && req.type !== "staff") {
            return returnError(res, StatusCodes.FORBIDDEN, `Only owner or staff can view warranty summary`);
        }

        const provider = req.type === "staff"
            ? { id: req.provider_id }
            : await getProviderByUserId(req.user_id);
        if (!provider || !provider.id) {
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }

        const summary = await getWarrantyCodeSummaryByProviderId(provider.id);
        return returnResponse(res, StatusCodes.OK, `Warranty summary fetched successfully`, { summary });
    } catch (error) {
        logger.error(`getWarrantyCodeSummaryEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to fetch warranty summary`);
    }
};

/**
 * Owner endpoint (authenticated): POST /unassign-warranty-code-dealer
 * Removes dealer assignment from Inactive codes (makes them available again).
 * Only codes that are not yet registered (status = Inactive) can be unassigned.
 */
const unassignWarrantyCodeDealerEndpoint = async (req, res) => {
    try {
        logger.info(`unassignWarrantyCodeDealerEndpoint`);

        if (req.type !== "provider" && req.type !== "staff") {
            return returnError(res, StatusCodes.FORBIDDEN, `Only the owner or staff can unassign warranty codes from dealers`);
        }

        const user_id = req.user_id;
        const { warranty_code_id, group_id } = req.body;

        if (!warranty_code_id && !group_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, `Either warranty_code_id or group_id is required`);
        }

        const provider = req.type === "staff"
            ? { id: req.provider_id }
            : await getProviderByUserId(user_id);
        if (!provider || !provider.id) {
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }

        if (group_id) {
            const batch_stats = await getWarrantyBatchUnassignStats(provider.id, group_id);
            if (!batch_stats || batch_stats.total_codes === 0) {
                return returnError(res, StatusCodes.NOT_FOUND, `Warranty batch not found`);
            }

            if (batch_stats.unassignable_codes === 0) {
                return returnError(res, StatusCodes.BAD_REQUEST, `No assigned codes to unassign in this batch`);
            }

            const batch_result = await unassignWarrantyCodeBatchFromDealer(provider.id, group_id);
            if (!batch_result || batch_result.count === 0) {
                return returnError(res, StatusCodes.BAD_REQUEST, `Failed to unassign codes`);
            }

            return returnResponse(res, StatusCodes.OK, `Dealer unassigned from warranty codes successfully`, {
                unassigned: true,
                unassigned_count: batch_result.count,
                registered_codes: batch_stats.registered_codes
            });
        }

        const warranty_code = await getWarrantyCodeByIdAndProviderId(warranty_code_id, provider.id);
        if (!warranty_code) {
            return returnError(res, StatusCodes.NOT_FOUND, `Warranty code not found`);
        }

        if (warranty_code.warranty_code_status !== "Inactive") {
            return returnError(res, StatusCodes.BAD_REQUEST, `Cannot unassign a registered or pending warranty code`);
        }

        if (!warranty_code.assigned_dealer_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, `Warranty code is not assigned to any dealer`);
        }

        const result = await unassignWarrantyCodeFromDealer(provider.id, warranty_code_id);
        if (!result || result.count === 0) {
            return returnError(res, StatusCodes.BAD_REQUEST, `Failed to unassign warranty code`);
        }

        return returnResponse(res, StatusCodes.OK, `Dealer unassigned from warranty code successfully`, { unassigned: true });
    } catch (error) {
        logger.error(`unassignWarrantyCodeDealerEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to unassign warranty code from dealer`);
    }
};

/**
 * Owner endpoint (authenticated): POST /assign-partial-batch-dealer
 * Assigns a specific count of codes from a batch to a dealer.
 */
const assignPartialBatchToDealerEndpoint = async (req, res) => {
    try {
        logger.info(`assignPartialBatchToDealerEndpoint`);

        if (req.type !== "provider" && req.type !== "staff") {
            return returnError(res, StatusCodes.FORBIDDEN, `Only the owner or staff can assign warranty codes to dealers`);
        }

        const user_id = req.user_id;
        const { group_id, dealer_id, count } = req.body;

        if (!group_id || !dealer_id || !count) {
            return returnError(res, StatusCodes.BAD_REQUEST, `group_id, dealer_id, and count are required`);
        }

        const countNum = parseInt(count, 10);
        if (isNaN(countNum) || countNum < 1) {
            return returnError(res, StatusCodes.BAD_REQUEST, `count must be a positive integer`);
        }

        const provider = req.type === "staff"
            ? { id: req.provider_id }
            : await getProviderByUserId(user_id);
        if (!provider || !provider.id) {
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }

        const dealer = await getDealerByIdAndProviderId(dealer_id, provider.id);
        if (!dealer) {
            return returnError(res, StatusCodes.NOT_FOUND, `Dealer not found or inactive for this owner`);
        }

        const result = await assignPartialBatchToDealer(provider.id, group_id, dealer.id, countNum);
        
        if (!result || result.count === 0) {
            return returnError(res, StatusCodes.BAD_REQUEST, `No unassigned codes available in this batch`);
        }

        return returnResponse(res, StatusCodes.OK, `${result.count} warranty code(s) assigned to dealer successfully`, {
            assigned: true,
            assigned_count: result.count
        });
    } catch (error) {
        logger.error(`assignPartialBatchToDealerEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to assign warranty codes to dealer`);
    }
};

/**
 * Owner endpoint (authenticated): POST /unassign-partial-batch-dealer
 * Unassigns a specific count of codes from a dealer in a batch.
 */
const unassignPartialBatchFromDealerEndpoint = async (req, res) => {
    try {
        logger.info(`unassignPartialBatchFromDealerEndpoint`);

        if (req.type !== "provider" && req.type !== "staff") {
            return returnError(res, StatusCodes.FORBIDDEN, `Only the owner or staff can unassign warranty codes from dealers`);
        }

        const user_id = req.user_id;
        const { group_id, dealer_id, count } = req.body;

        if (!group_id || !dealer_id || !count) {
            return returnError(res, StatusCodes.BAD_REQUEST, `group_id, dealer_id, and count are required`);
        }

        const countNum = parseInt(count, 10);
        if (isNaN(countNum) || countNum < 1) {
            return returnError(res, StatusCodes.BAD_REQUEST, `count must be a positive integer`);
        }

        const provider = req.type === "staff"
            ? { id: req.provider_id }
            : await getProviderByUserId(user_id);
        if (!provider || !provider.id) {
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }

        const result = await unassignPartialBatchFromDealer(provider.id, group_id, dealer_id, countNum);
        
        if (!result || result.count === 0) {
            return returnError(res, StatusCodes.BAD_REQUEST, `No codes assigned to this dealer in this batch`);
        }

        return returnResponse(res, StatusCodes.OK, `${result.count} warranty code(s) unassigned from dealer successfully`, {
            unassigned: true,
            unassigned_count: result.count
        });
    } catch (error) {
        logger.error(`unassignPartialBatchFromDealerEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to unassign warranty codes from dealer`);
    }
};

/**
 * Owner endpoint (authenticated): GET /batch-dealer-assignments
 * Gets the breakdown of dealer assignments for a batch.
 */
const getBatchDealerAssignmentsEndpoint = async (req, res) => {
    try {
        logger.info(`getBatchDealerAssignmentsEndpoint`);

        if (req.type !== "provider" && req.type !== "staff") {
            return returnError(res, StatusCodes.FORBIDDEN, `Only the owner or staff can view batch assignments`);
        }

        const user_id = req.user_id;
        const { group_id } = req.query;

        if (!group_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, `group_id is required`);
        }

        const provider = req.type === "staff"
            ? { id: req.provider_id }
            : await getProviderByUserId(user_id);
        if (!provider || !provider.id) {
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }

        const assignments = await getBatchDealerAssignments(provider.id, group_id);
        
        return returnResponse(res, StatusCodes.OK, `Batch dealer assignments fetched successfully`, assignments);
    } catch (error) {
        logger.error(`getBatchDealerAssignmentsEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to fetch batch dealer assignments`);
    }
};

export {
    getProviderWarrantyCodesEndpoint,
    getAvailableWarrantyCodesEndpoint,
    getDealerAssignedAvailableWarrantyCodesEndpoint,
    assignWarrantyCodeDealerEndpoint,
    getWarrantyCodeSummaryEndpoint,
    unassignWarrantyCodeDealerEndpoint,
    assignPartialBatchToDealerEndpoint,
    unassignPartialBatchFromDealerEndpoint,
    getBatchDealerAssignmentsEndpoint
};