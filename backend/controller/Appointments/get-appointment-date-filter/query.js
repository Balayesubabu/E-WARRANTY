import { Provider, Appointment } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getProviderAppointments = async (provider_id, start_date, end_date) => {
    const appointments = await Appointment.findMany({
        where: {
            provider_id: provider_id,
            created_at: { gte: start_date, lte: end_date }
        },
        include: {
            lead: true,
            franchise: true,
            franchise_service: true,
            franchise_service_package: true,
            AppointmentOccurrence: true
        }
    });
    return appointments;
}
export { getProviderByUserId, getProviderAppointments };