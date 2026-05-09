import {Provider, BookingQualityChecks} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const getAllChecksListForBooking = async (booking_id) => {
    const checks = await BookingQualityChecks.findMany({
        where: { booking_id: booking_id },
    });
    return checks;
}

export { getProviderByUserId, getAllChecksListForBooking };