import {Provider, BookingWorkDetails} from '../../../../prisma/db-models.js';

const getProviderByUserId = async (userId) => {
    return await Provider.findFirst({
        where: {
            user_id: userId
        }
    });
}
const getAllBookingWorkDetails = async (bookingId, ProviderId, franchiseId) => {
    return await BookingWorkDetails.findMany({
        where: {
            booking_id: bookingId,
            provider_id: ProviderId,
            franchise_id: franchiseId
        },
        include: {BookingWorkDetailsTransactions: true}
    });
}

export { getProviderByUserId, getAllBookingWorkDetails };