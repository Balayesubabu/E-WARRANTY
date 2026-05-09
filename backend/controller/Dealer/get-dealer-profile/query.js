import { ProviderDealer } from "../../../prisma/db-models.js";

const getDealerById = async (dealer_id) => {
    const dealer = await ProviderDealer.findUnique({
        where: {
            id: dealer_id,
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
            pan_number: true,
            gst_number: true,
            dealer_key: true,
            is_active: true,
            provider_id: true,
            created_at: true,
            updated_at: true,
        },
    });
    return dealer;
};

export { getDealerById };
