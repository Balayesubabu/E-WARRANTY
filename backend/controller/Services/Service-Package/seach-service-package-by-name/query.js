import { Provider, FranchiseServicePackage } from "../../../../prisma/db-models.js";

 const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const getServicePackageByName = async (search_term, provider_id,franchise_id) => {
    const servicePackage = await FranchiseServicePackage.findMany({
        where: {
            provider_id: provider_id,
            package_is_deleted: false,
            package_is_active: true,
            franchise_id: franchise_id,
            OR: [
                {
                    package_name: {
                        contains: search_term,
                        mode: 'insensitive'
                    }
                },
                {
                    package_description: {
                        contains: search_term,
                        mode: 'insensitive'
                    }
                }
                
            ]
        },
        orderBy: {
            package_name: "asc" 
        }
    });
    return servicePackage;
}

export { getProviderByUserId, getServicePackageByName };