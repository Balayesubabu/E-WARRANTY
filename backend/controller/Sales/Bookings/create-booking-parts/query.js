import {Provider, BookingParts} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}
const createBookingParts = async (data,booking_id,provider_id,franchise_id,staff_id) => {
    const deletedParts = await BookingParts.deleteMany({
        where: {
            booking_id: booking_id,
            provider_id: provider_id,
            franchise_id: franchise_id,
        }
    });
    const partsList = [];   
    for (const partData of data) {
        const part = await BookingParts.create({
            data: {
                booking_id: booking_id,
                franchise_id: franchise_id,
                provider_id: provider_id,
                franchise_open_inventory_id: partData.franchise_open_inventory_id,
                franchise_open_inventory_name: partData.franchise_open_inventory_name,
                unit: partData.unit,
                price: partData.price,
                gst: partData.gst,
                total_price: partData.total_price,
                created_at: new Date(),
                created_by: staff_id || provider_id
            },
        });
        partsList.push(part);
    }
   return partsList;    
}
export { getProviderByUserId, createBookingParts };