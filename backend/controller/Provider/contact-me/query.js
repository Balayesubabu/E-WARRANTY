import { Provider, ProviderNotification } from "../../../prisma/db-models.js"

const getProviderById = async (provider_id) => {
    const provider = await Provider.findFirst({
        where: {
            id: provider_id
        },
        include: {
            user: true
        }
    })
    return provider;
}

const createProviderNotification = async (provider_id, name, contact_number, email, message, country) => {
    const providerNotification = await ProviderNotification.create({
        data: {
            provider_id,
            name,
            contact_number,
            email,
            message,
            country
        }
    })
    return providerNotification;
}

export { getProviderById, createProviderNotification };