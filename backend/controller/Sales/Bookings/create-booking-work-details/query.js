import {Provider, BookingWorkDetails} from '../../../../prisma/db-models.js';

const getProviderByUserId = async (userId) => {
    return await Provider.findFirst({
        where: {
            user_id: userId
        }
    });
}

const createBookingWorkDetails = async (bookingId, booking_part_id, booking_service_id, booking_service_package_id, technicianId, workName, providerId, franchiseId, staff_id) => {
    return await BookingWorkDetails.create({
        data: {
            booking_id: bookingId,
            booking_part_id: booking_part_id,
            booking_service_id: booking_service_id,
            booking_service_package_id: booking_service_package_id,
            booking_technician_id: technicianId,
            work_name: workName,
            provider_id: providerId,
            franchise_id: franchiseId,
            created_at: new Date(),
            created_by: staff_id || providerId
        }
    });
}

export { getProviderByUserId, createBookingWorkDetails };
