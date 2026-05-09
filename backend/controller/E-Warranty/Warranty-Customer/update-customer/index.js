import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getCustomerWarrantyById, getWarrantyCodeByWarrantyCode, checkIfWarrantyCodeIsRegistered, updateWarrantyCode, updateCustomerWarranty, updateWarrantyCodeCustomFields, updateWarrantyCodeStatus } from "./query.js";

const updateCustomerEndpoint = async (req, res) => {
    try {
        logger.info(`updateCustomerEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Getting provider details with user_id : ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found ---`);

        const data = req.body;

        let {
            customer_warranty_id,
            first_name,
            last_name,
            phone,
            email,
            address,
            city,
            state,
            country,
            invoice_number,
            serial_number,
            product_name,
            product_id,
            service_id,
            warranty_code,
            date_of_installation,
            dealership_installer_name,
            dealership_installer_email,
            vehicle_number,
            vehicle_chassis_number,
            custom_value1,
            custom_value2,
            is_active,
        } = data;

        logger.info(`--- Getting customer warranty details with customer_warranty_id : ${customer_warranty_id} ---`);
        const customer_warranty = await getCustomerWarrantyById(customer_warranty_id);
        if (!customer_warranty) {
            logger.error(`--- Customer warranty not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Customer warranty not found`);
        }

        logger.info(`--- Customer warranty found ---`);

        // Check if custom values need updating in the warranty code
        if ((custom_value1 || custom_value2) && warranty_code) {
            logger.info(`--- Updating custom fields for warranty code: ${warranty_code} ---`);
            const warranty_code_data = await getWarrantyCodeByWarrantyCode(warranty_code);

            if (warranty_code_data) {
                await updateWarrantyCodeCustomFields(warranty_code, custom_value1, custom_value2);
                logger.info(`--- Custom fields updated ---`);
            }
        }
        logger.info(`--- Customer warranty found ---`);

        // Skip warranty code date updates if this is a rejection (is_active === false)
        // Rejection only needs to update the customer record, not recalculate warranty dates
        const isRejection = is_active === false;
        
        if (!isRejection && warranty_code && date_of_installation) {
            logger.info(`--- Fetching warranty code with warranty code : ${warranty_code} ---`);
            const warranty_code_data = await getWarrantyCodeByWarrantyCode(warranty_code);
            if (!warranty_code_data) {
                logger.error(`--- Warranty code not found ---`);
                return returnError(res, StatusCodes.NOT_FOUND, `Warranty code not found`);
            }
            logger.info(`--- Warranty code found ---`);

            const warranty_days = warranty_code_data.warranty_days;

            const new_warranty_from = new Date(date_of_installation);
            const new_warranty_to = new Date(new_warranty_from);
            new_warranty_to.setDate(new_warranty_to.getDate() + warranty_days);

            logger.info(`--- Updating warranty code with new dates with warranty code : ${warranty_code} ---`);
            const updated_warranty_code = await updateWarrantyCode(warranty_code, new_warranty_from, new_warranty_to);
            if (!updated_warranty_code) {
                logger.error(`--- Failed to update warranty code ---`);
                return returnError(res, StatusCodes.BAD_REQUEST, `Failed to update warranty code`);
            }
            logger.info(`--- Warranty code updated ---`);
        } else if (isRejection) {
            logger.info(`--- Rejection mode: skipping warranty date updates ---`);
            // Reset warranty code status to Inactive so it can be reassigned
            const codeToReset = warranty_code || customer_warranty.warranty_code;
            if (codeToReset) {
                try {
                    await updateWarrantyCodeStatus(codeToReset, "Inactive");
                    logger.info(`--- Warranty code ${codeToReset} status reset to Inactive ---`);
                } catch (statusErr) {
                    logger.warn(`--- Failed to reset warranty code status: ${statusErr.message} ---`);
                }
            }
        }

        logger.info(`--- Updating customer details with data : ${JSON.stringify(data)} ---`);
        const updated_customer = await updateCustomerWarranty(customer_warranty_id, {
            first_name,
            last_name,
            phone,
            email,
            address,
            city,
            state,
            country,
            invoice_number,
            serial_number,
            product_name,
            product_id,
            service_id,
            warranty_code: warranty_code || customer_warranty.warranty_code,
            date_of_installation: date_of_installation || customer_warranty.date_of_installation,
            dealership_installer_name: dealership_installer_name || customer_warranty.dealership_installer_name,
            dealership_installer_email: dealership_installer_email || customer_warranty.dealership_installer_email,
            vehicle_number: vehicle_number || customer_warranty.vehicle_number,
            vehicle_chassis_number: vehicle_chassis_number || customer_warranty.vehicle_chassis_number,
            is_active,
        });
        if (!updated_customer) {
            logger.error(`--- Customer not found ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Customer not found`);
        }
        logger.info(`--- Customer updated ---`);

        return returnResponse(res, StatusCodes.OK, `Customer updated successfully`, { updated_customer });
    } catch (error) {
        logger.error(`updateCustomerEndpoint error: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Failed to update customer`);
    }
}

export { updateCustomerEndpoint };