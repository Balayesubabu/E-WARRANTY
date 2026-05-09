import { Provider,BookingServices,BookingQualityChecks, Franchise, FranchiseService } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: { user_id: user_id },
  });
  return provider;
}
const createBookingService = async (data, provider_id, franchise_id, staff_id, booking_id) => {
    const serviceList = [];
    const deletedServices = await BookingServices.deleteMany({
      where: {
        booking_id: booking_id,
        provider_id: provider_id,
        franchise_id: franchise_id,
        }
    });
    for (const serviceData of data) {
        const service = await BookingServices.create({
            data: {
                booking_id: booking_id,
                franchise_id: franchise_id,
                provider_id: provider_id,
                franchise_service_id: serviceData.franchise_service_id,
                franchise_service_name: serviceData.franchise_service_name,
                unit: serviceData.unit,
                price: serviceData.price,
                gst: serviceData.gst,
                total_price: serviceData.total_price,
                created_at: new Date(),
                created_by: staff_id || provider_id
            },
        });
        serviceList.push(service);
    }
    return serviceList;
}

const getAllServicesWithChecksListForBooking = async (booking_id) => {
    const services = await BookingServices.findMany({
        where: { booking_id: booking_id }
    });
    if (services.length === 0) {
        return null;
    }
    const servicesWithChecks = [];
        for (const service of services) {
          const franchiseService = await FranchiseService.findFirst({
            where: { id: service.franchise_service_id }
          });
            if(franchiseService && franchiseService.check_list && franchiseService.check_list.length > 0){
                for(const check of franchiseService.check_list){
                    servicesWithChecks.push(check.checklist_name);
                }
            }
        }
    return servicesWithChecks;
}

const createBookingQualityChecks = async (booking_id,checklist,provider_id,franchise_id,staff_id) => {
    const deletedChecks = await BookingQualityChecks.deleteMany({
        where: {
            booking_id: booking_id,
            provider_id: provider_id,
            franchise_id: franchise_id,
        }
    });
    const checkList = [];
    for (const check of checklist) {
        const bookingCheck = await BookingQualityChecks.create({
            data: {
                booking_id: booking_id,
                provider_id: provider_id,
                franchise_id: franchise_id,
                quality_check_name: check,
                created_at: new Date(),
                created_by: staff_id || provider_id
            }
        });
        checkList.push(bookingCheck);
    }
    return checkList;
}
export { getProviderByUserId, createBookingService, getAllServicesWithChecksListForBooking, createBookingQualityChecks };