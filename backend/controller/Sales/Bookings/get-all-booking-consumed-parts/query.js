import {Provider,Booking, FranchiseOpenInventoryTransaction} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const getAllBooking = async (provider_id,franchise_id) => {
    const bookings = await Booking.findMany({
        where: { provider_id: provider_id, franchise_id: franchise_id },
    });
    return bookings;
}

const getConsumedParts = async (booking_id, provider_id, franchise_id) => {
    const parts = await FranchiseOpenInventoryTransaction.findMany({
        where: { booking_id: booking_id, provider_id: provider_id, franchise_id: franchise_id },
        include:{franchise_open_inventory:true}
    });
    return parts;
}

export {getProviderByUserId,getAllBooking,getConsumedParts};