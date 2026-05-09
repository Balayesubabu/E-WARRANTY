import { Provider,Franchise } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}   
const updateFranchise = async (franchise_id, provider_id, data) => {
    const franchise = await Franchise.update({
        where:{
             id: franchise_id,
                provider_id: provider_id
            },
        data:{
            name: data.name,
            address: data.address,
            city: data.city,
            state: data.state,
            country: data.country,
            pin_code: data.pin_code,
            phone_number: data.phone_number,
            email: data.email,
            is_active: data.is_active,
            is_deleted: data.is_deleted,
            deleted_at: data.deleted_at
        }
    });
    return franchise;
}
export { getProviderByUserId, updateFranchise };