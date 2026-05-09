import { Provider, Appointment, AppointmentOccurrence } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getAppointmentById = async (appointment_id, provider_id) => {
    const appointment = await Appointment.findFirst({
        where: {
            id: appointment_id,
            provider_id: provider_id
        },
        include: {
            lead: true,
            franchise: true,
            franchise_service: true,
            franchise_service_package: true,
            AppointmentOccurrence: true
        }
    });
    return appointment;
}

const deleteAppointmentOccurrence = async (appointment_id, occurrence_id, provider_id) => {
    // First verify the appointment belongs to the provider
    const appointment = await Appointment.findFirst({
        where: {
            id: appointment_id,
            provider_id: provider_id
        }
    });
    
    if (!appointment) {
        return null;
    }
    
    const appointmentOccurrence = await AppointmentOccurrence.delete({
        where: {
            id: occurrence_id,
            appointment_id: appointment_id
        },
        include: {
            appointment: true
        }
    });
    return appointmentOccurrence;
}

const updateAppointment = async (appointment_id, provider_id, data) => {
    const appointment = await Appointment.update({
        where: {
            id: appointment_id,
            provider_id: provider_id
        },
        data: {
            number_of_occurrences: data.number_of_occurrences,
            repeat_interval: data.repeat_interval,
            occurrence_dates: data.occurrence_dates,
        },
        include: {
            lead: true,
            franchise: true,
            franchise_service: true,
            franchise_service_package: true,
            AppointmentOccurrence: true
        }
    });
    return appointment;
}
export { getProviderByUserId, getAppointmentById, deleteAppointmentOccurrence, updateAppointment };