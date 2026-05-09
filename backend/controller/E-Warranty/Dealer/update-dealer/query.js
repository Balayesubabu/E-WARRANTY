import { Provider, ProviderDealer } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return provider;
};

const getDealerById = async (provider_id, dealer_id) => {
    return ProviderDealer.findFirst({
        where: {
            id: dealer_id,
            provider_id: provider_id,
        },
        select: { id: true, name: true, email: true, is_active: true, status: true },
    });
};

const updateDealer = async (provider_id, dealer_id, data) => {
    // Determine status based on is_active value
    const status = data.is_active === true ? 'ACTIVE' : (data.is_active === false ? 'INACTIVE' : undefined);

    const updateData = {
        name: data.name,
        country_code: data.country_code,
        phone_number: data.phone_number,
        email: data.email,
        pan_number: data.pan_number,
        gst_number: data.gst_number,
        address: data.address,
        pin_code: data.pin_code,
        city: data.city,
        state: data.state,
        country: data.country,
        is_active: data.is_active,
        is_deleted: data.is_deleted,
    };

    // Also update status field to keep it in sync with is_active
    if (status !== undefined) {
        updateData.status = status;
        // Set inactivated_at timestamp when deactivating
        if (status === 'INACTIVE') {
            updateData.inactivated_at = new Date();
        } else {
            // Clear inactivation fields when activating
            updateData.inactivated_at = null;
            updateData.inactivated_by = null;
            updateData.inactivation_reason = null;
        }
    }

    const dealer = await ProviderDealer.update({
        where: {
            id: dealer_id,
            provider_id: provider_id,
        },
        data: updateData,
    });
    return dealer;
}

export { getProviderByUserId, getDealerById, updateDealer };