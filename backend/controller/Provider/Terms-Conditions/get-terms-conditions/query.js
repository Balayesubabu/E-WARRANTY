import { Provider, TermsAndConditions } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const getTermsConditions = async (provider_id) => {
    const terms_conditions = await TermsAndConditions.findMany({
        where: { provider_id: provider_id },
    });
    return terms_conditions;
}

export { getProviderByUserId, getTermsConditions };
