import { Provider } from "../../../../prisma/db-models.js";

const getAllProviderNames = async () => {
    // Query the Provider table directly to get all registered providers (owners)
    // This ensures we show the correct provider names regardless of dealer records
    const providers = await Provider.findMany({
        select: {
            id: true,
            company_name: true,
        },
        orderBy: {
            company_name: 'asc'
        }
    });

    return providers;
}

export { getAllProviderNames };