import { Provider, Appointment } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const updateAppointment = async (appointment_id, provider_id, data) => {

    const appointment = await Appointment.update({
        where: {
            id: appointment_id,
            provider_id: provider_id
        },
        data: {
            lead_id: data.lead_id,
            title: data.title,
            appointment_details: data.appointment_details,
            first_name: data.first_name,
            last_name: data.last_name,
            mobile_number: data.mobile_number,
            email: data.email,
            address: data.address,
            vehicle_number: data.vehicle_number,
            gst_number: data.gst_number,
            status: data.status,
            franchise_id: data.franchise_id,
            franchise_service_id: data.franchise_service_id,
            franchise_service_package_id: data.franchise_service_package_id,
            note: data.note,
            start_date: data.start_date,
            end_date: data.end_date,
            reminder_1: data.reminder_1,
            reminder_2: data.reminder_2,
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
export { getProviderByUserId, updateAppointment };
