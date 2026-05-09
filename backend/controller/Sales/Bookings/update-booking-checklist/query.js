import {Provider, BookingQualityChecks} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const updateBookingChecklist = async (data, providerId, franchise_id, staff_id, booking_id) => {
    const checklist = []
    for(const item of data){
        const updatedCheck = await BookingQualityChecks.findFirst({
            where: {
                booking_id: booking_id,
                id: item.id
            }
        });
        let updatedChecklist;
        if (updatedCheck) {
           updatedChecklist = await BookingQualityChecks.update({
                where: { id: updatedCheck.id },
                data: { 
                    is_checked: item.is_checked,
                    updated_at: new Date(),
                    updated_by: staff_id || providerId
                 }
            });
        } else {
            updatedChecklist = await BookingQualityChecks.create({
                data: {
                    booking_id: booking_id, 
                    quality_check_name: item.checklist_name,
                    is_checked: item.is_checked,
                    provider_id: providerId,
                    franchise_id: franchise_id,
                    created_at: new Date(),
                    created_by: staff_id || providerId
                }
            });
        } 
        checklist.push(updatedChecklist);  
    }
    return checklist;
};

export { getProviderByUserId, updateBookingChecklist };