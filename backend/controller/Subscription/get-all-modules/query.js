import { Provider, Module, SubModule} from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getAllModules = async () => {
    const provider_subscription = await Module.findMany({
        include: {
            SubModule: true
        }
    });
    return provider_subscription;
}
export { getProviderByUserId, getAllModules };