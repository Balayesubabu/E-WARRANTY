import { Provider } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const updateProvider = async (user_id, data) => {
    // First find the provider to get its id
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
        throw new Error('Provider not found');
    }

    // Then update using the provider's id
    const updatedProvider = await Provider.update({
        where: { id: provider.id },
        data: {
            company_name: data.company_name,
            company_address: data.company_address,
            company_website: data.company_website,
            company_description: data.company_description,
            facebook_url: data.facebook_url,
            instagram_url: data.instagram_url,
            youtube_url: data.youtube_url,
            achivements: data.achivements,
            mode_of_service_offered: data.mode_of_service_offered,
            post_code: data.post_code,
            gst_number: data.gst_number
        }
    })
    return updatedProvider;
}

export { getProviderByUserId, updateProvider };