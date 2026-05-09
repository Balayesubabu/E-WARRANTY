import {Provider, BookingTechnicians} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const createBookingTechnicians = async (data,booking_id,provider_id,franchise_id,staff_id) => {
    const deletedTechnicians = await BookingTechnicians.deleteMany({
        where: {
            booking_id: booking_id,
            provider_id: provider_id,
            franchise_id: franchise_id,
        }
    });
    const techniciansList = [];
    for (const technicianData of data) {
        const technician = await BookingTechnicians.create({
            data: {
                booking_id: booking_id,
                franchise_id: franchise_id,
                provider_id: provider_id,
                staff_id: technicianData.staff_id,
                staff_name: technicianData.staff_name,
                staff_department: technicianData.staff_department,
                created_at: new Date(),
                created_by: staff_id || provider_id
            },
        });
        techniciansList.push(technician);
    }

    return techniciansList;
}

export { getProviderByUserId, createBookingTechnicians };