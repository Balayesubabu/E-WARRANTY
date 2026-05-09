import {Provider, BookingWorkDetails, BookingWorkDetailsTransactions} from '../../../../prisma/db-models.js';

const getProviderByUserId = async (userId) => {
    return await Provider.findFirst({
        where: {
            user_id: userId
        }
    });
}

const updateBookingWorkDetails = async (id,bookingId, booking_part_id, booking_service_id, booking_service_package_id, technicianId, workName,status,is_reassign,remarks,staff_id,providerId) => {
    const updatedWorkDetails = await BookingWorkDetails.update({
       where: {
           id: id
       },
       data: {
           booking_id: bookingId,
           booking_part_id: booking_part_id,
           booking_service_id: booking_service_id,
           booking_service_package_id: booking_service_package_id,
           booking_technician_id: technicianId,
           work_name: workName,
           status: status,
           is_reassign: is_reassign,
           remarks: remarks,
           updated_at: new Date(),
           updated_by: staff_id || providerId
       }
   });
   let updatedworkDetailsHistory;
   console.log(updatedWorkDetails.id)
   if(status === 'In_Progress'){
    console.log("In_Progress");
      updatedworkDetailsHistory =   await BookingWorkDetailsTransactions.create({
              data: {
                    booking_work_details_id: updatedWorkDetails.id,
                    startDateTime: new Date(),
                    created_at: new Date(),
                    created_by: staff_id || providerId
              }
         });
         console.log("updatedworkDetailsHistory",updatedworkDetailsHistory);
   }
   if(status === 'Completed' || status === 'Paused'){
         const lastHistory = await BookingWorkDetailsTransactions.findFirst({
              where: { booking_work_details_id: updatedWorkDetails.id },
              orderBy: { created_at: 'desc' }
         });
         if(lastHistory && !lastHistory.endDateTime){
           updatedworkDetailsHistory =   await BookingWorkDetailsTransactions.update({
                   where: { id: lastHistory.id },
                   data: {
                        endDateTime: new Date(),
                        updated_at: new Date(),
                        updated_by: staff_id || providerId
                   }
              });
         }
     }
     console.log("updatedworkDetailsHistory",updatedworkDetailsHistory);
    return updatedWorkDetails;
}

const updateBookingWorkDetailsWithReasssign = async (bookingId, booking_part_id, booking_service_id, booking_service_package_id, technicianId, workName,status,is_reassign,remarks,staff_id,providerId,franchiseId) => {
    const createdWorkDetails = await BookingWorkDetails.create({
         data: {
                booking_id: bookingId,
                booking_part_id: booking_part_id,
                booking_service_id: booking_service_id,
                booking_service_package_id: booking_service_package_id,
                booking_technician_id: technicianId,
                work_name: workName,
                status: status,
                provider_id: providerId,
                franchise_id: franchiseId,
                is_reassign: is_reassign,
                remarks: remarks,
                created_at: new Date(),
                created_by: staff_id || providerId
         }
    });
    console.log("createdWorkDetails",createdWorkDetails);
    const getlatestHistory = await BookingWorkDetailsTransactions.findFirst({
              where: { booking_work_details_id: createdWorkDetails.id },
              orderBy: { created_at: 'desc' }
            });
    if((getlatestHistory && getlatestHistory.endDateTime)){
        await BookingWorkDetailsTransactions.update({
                where: { id: getlatestHistory.id },
                data: {
                     endDateTime: new Date(),
                     updated_at: new Date(),
                     updated_by: staff_id || providerId
                }
            });
        
        }
        else{
             await BookingWorkDetailsTransactions.create({
              data: {
                    booking_work_details_id: createdWorkDetails.id,
                    startDateTime: new Date(),
                    created_at: new Date(),
                    created_by: staff_id || providerId
              }
         });
        }
    return createdWorkDetails;
}

export { getProviderByUserId, updateBookingWorkDetails, updateBookingWorkDetailsWithReasssign   };