import { Provider, TermsAndConditions } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const createTermsConditions = async (provider_id, type, terms_and_conditions,link) => {
    const terms_conditions = await TermsAndConditions.create({
        data: { provider_id, type, terms_and_conditions,link},
    });
    return terms_conditions;
}

export { getProviderByUserId, createTermsConditions };