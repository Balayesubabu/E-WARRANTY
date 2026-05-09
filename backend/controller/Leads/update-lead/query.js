import { Provider, Lead } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getLeadById = async (provider_id, lead_id) => {
    const lead = await Lead.findFirst({
        where: {
            id: lead_id,
            provider_id: provider_id
        }
    });
    return lead;
}

const updateLead = async (provider_id, lead_id, lead_data) => {
    const lead = await Lead.update({
        where: {
            id: lead_id,
            provider_id: provider_id
        },
        data: {
            title: lead_data.title,
            lead_details: lead_data.lead_details,
            first_name: lead_data.first_name,
            last_name: lead_data.last_name,
            email: lead_data.email,
            mobile_number: lead_data.mobile_number,
            address: lead_data.address,
            city: lead_data.city,
            state: lead_data.state,
            country: lead_data.country,
            pin_code: lead_data.pin_code,
            vehicle_number: lead_data.vehicle_number,
            franchise_id: lead_data.franchise_id,
            franchise_service_id: lead_data.franchise_service_id,
            franchise_service_package_id: lead_data.franchise_service_package_id,
            note: lead_data.note,
            gst_number: lead_data.gst_number,
            status: lead_data.status,
            booked_date: lead_data.booked_date,
            reminder_1: lead_data.reminder_1,
            reminder_2: lead_data.reminder_2,
        },
        include: {
            franchise: true,
            franchise_service: true,
            franchise_service_package: true
        }
    });
    return lead;
}
export { getProviderByUserId, getLeadById, updateLead };