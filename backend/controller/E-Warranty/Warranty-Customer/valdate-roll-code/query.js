import { ProviderProductWarrantyCode, ProviderWarrantyCustomer } from "../../../../prisma/db-models.js";

import { logger } from "../../../../services/logger.js";

// Check if warranty code exists for the given provider
const findWarrantyCode = async (warranty_code, provider_id) => {
    logger.info(`--- Checking existence of warranty code: ${warranty_code} for provider_id: ${provider_id} ---`);
    const existingRecord = await ProviderProductWarrantyCode.findFirst({
        where: {
            warranty_code: warranty_code,
            provider_id: provider_id
        }
    });
    return existingRecord;
}

// Check if warranty code is already registered to a customer
const checkIfRegistered = async (warranty_code) => {
    logger.info(`--- Checking if warranty code is already registered: ${warranty_code} ---`);
    const registeredRecord = await ProviderWarrantyCustomer.findFirst({
        where: {
            warranty_code: warranty_code
        }
    });
    return registeredRecord;
}

export { findWarrantyCode, checkIfRegistered };