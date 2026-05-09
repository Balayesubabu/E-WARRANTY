import {Provider,BookingParts} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const getAllBookingParts = async (booking_id, provider_id, franchise_id) => {
    const bookingParts = await BookingParts.findMany({
        where: { booking_id: booking_id, provider_id: provider_id, franchise_id: franchise_id }
    });
    return bookingParts;
}
export { getProviderByUserId, getAllBookingParts };