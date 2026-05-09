import {Provider, BookingCustomerRequirements} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const createBookingCustomerRequirements = async (data,booking_id,provider_id,franchise_id,staff_id) => {
    const deletedRequirements = await BookingCustomerRequirements.deleteMany({
        where: {
            booking_id: booking_id,
            provider_id: provider_id,
            franchise_id: franchise_id,
        }
    });
    const requirementsList = [];
    for (const requirementData of data) {
        const requirement = await BookingCustomerRequirements.create({
            data: {
                booking_id: booking_id,
                franchise_id: franchise_id,
                provider_id: provider_id,
                requirement_id: requirementData.requirement_id,
                requirement_name: requirementData.requirement_name,
                created_at: new Date(),
                created_by: staff_id || provider_id
            },
        });
        requirementsList.push(requirement);
    }
    return requirementsList;
}

export { getProviderByUserId, createBookingCustomerRequirements };
