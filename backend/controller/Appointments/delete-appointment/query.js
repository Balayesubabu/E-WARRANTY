import { Provider, Appointment } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const deleteAppointment = async (appointment_id, provider_id) => {
    const appointment = await Appointment.delete({
        where: {
            id: appointment_id,
            provider_id: provider_id
        }
    });
    return appointment;
}
export { getProviderByUserId, deleteAppointment };