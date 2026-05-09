import { Provider, ProviderDealer } from "../../../../prisma/db-models.js"

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return provider;
}

/** For staff flows: resolve provider id + company name for emails and billing context */
const getProviderByIdMinimal = async (provider_id) => {
    if (!provider_id) return null;
    return Provider.findUnique({
        where: { id: provider_id },
        select: { id: true, company_name: true },
    });
};

const getDealerByProviderId = async (provider_id, phone_number, email) => {
    const conditions = [];
    if (phone_number) conditions.push({ phone_number: phone_number });
    if (email) conditions.push({ email: { equals: email, mode: "insensitive" } });
    if (conditions.length === 0) return null;

    const dealer = await ProviderDealer.findFirst({
        where: {
            provider_id: provider_id,
            OR: conditions,
        },
    });
    return dealer;
}

const createDealer = async (provider_id, dealer_key, data, hashed_password) => {
    const dealer = await ProviderDealer.create({
        data: {
            provider_id: provider_id,
            name: data.name,
            country_code: data.country_code,
            phone_number: data.phone_number,
            email: data.email,
            password: hashed_password,
            pan_number: data.pan_number,
            gst_number: data.gst_number,
            address: data.address,
            pin_code: data.pin_code,
            city: data.city,
            state: data.state,
            country: data.country,
            dealer_key: dealer_key,
            is_active: data.is_active,
            is_deleted: data.is_deleted,
        },
    });
    return dealer;
}
export { getProviderByUserId, getProviderByIdMinimal, getDealerByProviderId, createDealer };