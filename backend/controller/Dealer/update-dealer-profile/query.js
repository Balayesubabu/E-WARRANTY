import { ProviderDealer } from "../../../prisma/db-models.js";

const getDealerById = async (dealer_id) => {
    const dealer = await ProviderDealer.findUnique({
        where: {
            id: dealer_id,
        },
    });
    return dealer;
};

const updateDealerProfile = async (dealer_id, data) => {
    const dealer = await ProviderDealer.update({
        where: {
            id: dealer_id,
        },
        data: {
            name: data.name,
            phone_number: data.phone_number,
            country_code: data.country_code,
            address: data.address,
            pin_code: data.pin_code,
            city: data.city,
            state: data.state,
            country: data.country,
            updated_at: new Date(),
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone_number: true,
            country_code: true,
            address: true,
            pin_code: true,
            city: true,
            state: true,
            country: true,
            dealer_key: true,
            is_active: true,
            provider_id: true,
            updated_at: true,
        },
    });
    return dealer;
};

export { getDealerById, updateDealerProfile };
