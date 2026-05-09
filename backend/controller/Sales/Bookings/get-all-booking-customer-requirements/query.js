import {Provider,BookingCustomerRequirements} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const getAllBookingCustomerRequirements = async (booking_id, provider_id, franchise_id) => {
    const bookingCustomerRequirements = await BookingCustomerRequirements.findMany({
        where: { booking_id: booking_id, provider_id: provider_id, franchise_id: franchise_id }
    });
    return bookingCustomerRequirements;
}

export { getProviderByUserId, getAllBookingCustomerRequirements };