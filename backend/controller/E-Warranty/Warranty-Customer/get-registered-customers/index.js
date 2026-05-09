import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { countUniqueCustomers } from "../../../../utils/uniqueCustomerCount.js";
import { getProviderByUserId, getRegisteredCustomers } from "./query.js";

const getRegisteredCustomersEndpoint = async (req, res) => {
    try {
        logger.info(`getRegisteredCustomersEndpoint`);
        const user_id = req.user_id;

        logger.info(`--- Getting provider details with user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found ---`);

        // If the request is from a dealer, filter by dealer_id for data isolation
        const dealer_id = req.type === 'dealer' ? req.dealer_id : null;

        logger.info(`--- Getting registered customers with provider_id : ${provider.id}${dealer_id ? `, dealer_id : ${dealer_id}` : ''} ---`);
        const [registered_customers_raw, unique_customer_count] = await Promise.all([
            getRegisteredCustomers(provider.id, dealer_id),
            countUniqueCustomers(provider.id, { dealerId: dealer_id || undefined }),
        ]);
        let registered_customers = registered_customers_raw;
        if (!registered_customers || (Array.isArray(registered_customers) && registered_customers.length === 0)) {
            logger.info(`--- No registered customers found with provider_id : ${provider.id} ---`);
            return returnResponse(res, StatusCodes.OK, `No registered customers found`, { registered_customers: [], unique_customer_count: 0 });
        }
        logger.info(`--- Registered customers found ---`);

        const currentDate = new Date();

        registered_customers = registered_customers.map(cust => {
            const warrantyTo = cust.provider_warranty_code?.warranty_to
                ? new Date(cust.provider_warranty_code.warranty_to)
                : null;

            const isExpired = warrantyTo ? warrantyTo < currentDate : true;

            let warrantyDaysLeft = null;
            if (warrantyTo) {
                const diffMs = warrantyTo - currentDate;
                warrantyDaysLeft = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
            }

            return {
                ...cust,
                provider_warranty_code: {
                    ...cust.provider_warranty_code,
                    warranty_code_expired: isExpired,
                    warrantyDaysLeft
                }
            };
        });



        return returnResponse(res, StatusCodes.OK, `Registered customers fetched successfully`, { registered_customers, unique_customer_count });
    } catch (error) {
        logger.error(`getRegisteredCustomersEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to get registered customers`);
    }
}

export { getRegisteredCustomersEndpoint };