import { Provider, AppointmentOccurrence } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getAppointmentOccurrenceById = async (appointment_id, occurrence_id, provider_id) => {
    const appointmentOccurrence = await AppointmentOccurrence.findFirst({
        where: {
            id: occurrence_id,
            appointment_id: appointment_id,
            appointment: {
                provider_id: provider_id
            }
        },
        include: {
            appointment: true
        }
    });
    return appointmentOccurrence;
}

const getAllAppointmentOccurrences = async (provider_id) => {
    const appointmentOccurrences = await AppointmentOccurrence.findMany({
        where: {
            appointment: {
                provider_id: provider_id
            }
        },
        include: {
            appointment: true
        }
    });
    return appointmentOccurrences;
}

export { getProviderByUserId, getAppointmentOccurrenceById, getAllAppointmentOccurrences };