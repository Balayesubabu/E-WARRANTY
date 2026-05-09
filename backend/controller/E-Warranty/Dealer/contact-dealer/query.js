import { ProviderDealer, ProviderNotification } from "../../../../prisma/db-models.js"

const getDealerById = async (dealer_id) => {
    const dealer = await ProviderDealer.findFirst({
        where: {
            id: dealer_id
        },
        include: {
            provider: {
                include: {
                    user: true
                }
            }
        }
    })
    return dealer;
}

const createDealerNotification = async (provider_id, dealer_id, name, email, contact_number, message, country) => {
    const dealerNotification = await ProviderNotification.create({
        data: {
            provider_id,
            dealer_id,
            email,
            message,
            country,
            name,
            contact_number
        }
    })
    return dealerNotification;
}

export { getDealerById, createDealerNotification };