import { Provider, BookingSettings } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
        },
    });
    return provider;
};

const getBookingSettings = async ( provider_id, franchise_id) => {
    const bookingSettings = await BookingSettings.findFirst({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
        }
    });
    return bookingSettings;
}

export { getProviderByUserId, getBookingSettings }; 