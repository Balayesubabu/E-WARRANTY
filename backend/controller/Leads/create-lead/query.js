import { Provider, Lead } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        },
    });
    return provider;
}

const createLead = async (provider_id, data) => {
    const lead = await Lead.create({
        data: {
            provider_id: provider_id,
            title: data.title,
            lead_details: data.lead_details,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            mobile_number: data.mobile_number,
            address: data.address,
            city: data.city,
            state: data.state,
            country: data.country,
            pin_code: data.pin_code,
            vehicle_number: data.vehicle_number,
            franchise_id: data.franchise_id,
            franchise_service_id: data.franchise_service_id,
            franchise_service_package_id: data.franchise_service_package_id,
            note: data.note,
            gst_number: data.gst_number,
            status: data.status,
            booked_date: data.booked_date,
            reminder_1: data.reminder_1,
            reminder_2: data.reminder_2,
        }
    });
    return lead;
}

export { getProviderByUserId, createLead };