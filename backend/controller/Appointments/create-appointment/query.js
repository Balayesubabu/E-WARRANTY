import { Appointment, AppointmentOccurrence, Provider, prisma } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const createAppointment = async (provider_id, data) => {
    if (data.number_of_occurrences > 0 && (!data.occurrence_dates || data.occurrence_dates.length === 0)) {
        data.occurrence_dates = [];
        for (let i = 0; i < data.number_of_occurrences; i++) {
            const occurrenceDate = new Date(data.start_date);
            occurrenceDate.setDate(occurrenceDate.getDate() + (i * data.repeat_interval));
            data.occurrence_dates.push(occurrenceDate);
        }
    }

    const result = await prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.create({
            data: {
                provider_id: provider_id,
                lead_id: data.lead_id || null,
                title: data.title,
                appointment_details: data.appointment_details || null,
                first_name: data.first_name,
                last_name: data.last_name || null,
                mobile_number: data.mobile_number,
                email: data.email,
                address: data.address,
                vehicle_number: data.vehicle_number || null,
                gst_number: data.gst_number || null,
                status: data.status || 'New',
                franchise_id: data.franchise_id || null,
                franchise_service_id: data.franchise_service_id || null,
                franchise_service_package_id: data.franchise_service_package_id || null,
                note: data.note || null,
                number_of_occurrences: data.number_of_occurrences || null,
                repeat_interval: data.repeat_interval || null,
                occurrence_dates: data.occurrence_dates || [],
                start_date: data.start_date || null,
                end_date: data.end_date || null,
                reminder_1: data.reminder_1 || 0,
                reminder_2: data.reminder_2 || 0,
            },
            include: {
                lead: true,
                franchise: true,
                franchise_service: true,
                franchise_service_package: true
            }
        });

        const appointmentOccurrences = [];
        if (data.occurrence_dates && data.occurrence_dates.length > 0) {
            for (const occurrenceDate of data.occurrence_dates) {
                const occurrence = await tx.appointmentOccurrence.create({
                    data: {
                        appointment_id: appointment.id,
                        occurrence_date: occurrenceDate,
                        status: 'New',
                        note: data.note || null
                    }
                });
                appointmentOccurrences.push(occurrence);
            }
        }

        return {
            appointment,
            appointmentOccurrences
        };
    });

    return result;
}

export { getProviderByUserId, createAppointment };