import { Provider,BookingSettings } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const createOrUpdateBookingSettings = async (data, provider_id, franchise_id, staff_id) => {
    const bookingSettings = await BookingSettings.upsert({
        where: {
            // Assuming you have a UNIQUE constraint on (provider_id, franchise_id)
            provider_id_franchise_id: {
                provider_id,
                franchise_id,
            },
        },
        create: {
            provider_id,
            franchise_id,
            staff_id: staff_id || null,
            is_technician: data.is_technician,
            is_workdetails: data.is_workdetails,
            is_quality_check: data.is_quality_check,
            created_at: new Date(),
            created_by: staff_id || provider_id,
        },
        update: {
            is_technician: data.is_technician,
            is_workdetails: data.is_workdetails,
            is_quality_check: data.is_quality_check,
            updated_at: new Date(),
            updated_by: staff_id || provider_id,
        },
    });

    return bookingSettings;
};

export {getProviderByUserId,createOrUpdateBookingSettings};
            

