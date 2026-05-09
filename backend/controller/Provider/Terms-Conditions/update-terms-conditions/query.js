import { Provider, TermsAndConditions } from "../../../../prisma/db-models.js";
import { logger } from "../../../../services/logger.js";

const getProviderByUserId = async (user_id) => {
    // const provider = await Provider.findUnique({
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

//mayank
// const updateProviderTermsConditions = async (provider_id, data, terms_conditions_id) => {
//     const provider = await TermsAndConditions.update({
//         where: {
//             id: terms_conditions_id,
//             provider_id: provider_id
//         },
//         data: {
//             terms_and_conditions: data.terms_conditions,
//             type: data.type
//         }
//     })
//     return provider;
// }

//akash
const updateProviderTermsConditions = async (provider_id, data) => {
    logger.info(`--- Searching for existing terms with provider_id: ${provider_id}, type: ${data.type} ---`);
    
    const existingTermsConditions = await TermsAndConditions.findFirst({
        where: {
            provider_id: provider_id,
            type: data.type
        }
    });

    logger.info(`--- Existing terms found: ${JSON.stringify(existingTermsConditions)} ---`);
    logger.info(`--- New terms_and_conditions data: ${JSON.stringify(data.terms_and_conditions)} ---`);

    if (existingTermsConditions) {
        logger.info(`--- Updating existing record with ID: ${existingTermsConditions.id} ---`);
        
        const updatedRecord = await TermsAndConditions.update({
            where: {
                id: existingTermsConditions.id
            },
            data: {
                terms_and_conditions: data.terms_and_conditions,
                type: data.type,
                link:data.link
            }
        });
        
        logger.info(`--- Updated record: ${JSON.stringify(updatedRecord)} ---`);
        return updatedRecord;
    } else {
        logger.info(`--- Creating new record ---`);
        
        const newRecord = await TermsAndConditions.create({
            data: {
                provider_id: provider_id,
                type: data.type,
                terms_and_conditions: data.terms_and_conditions
            }
        });
        
        logger.info(`--- Created record: ${JSON.stringify(newRecord)} ---`);
        return newRecord;
    }
}

export { getProviderByUserId, updateProviderTermsConditions };