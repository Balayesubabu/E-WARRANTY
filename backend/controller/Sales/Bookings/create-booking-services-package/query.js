import {Provider, BookingServicePackages, Franchise, FranchiseServicePackage,BookingQualityChecks } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: { user_id: user_id },
    });
    return provider;
}

const createBookingServicesPackage = async (data,booking_id,provider_id,franchise_id,staff_id) => {
    const deletedPackage = await BookingServicePackages.deleteMany({
        where: {
            booking_id: booking_id,
            provider_id: provider_id,
            franchise_id: franchise_id,
        }
    });
    const packageList = [];
    for (const packageData of data) {
        const servicePackage = await BookingServicePackages.create({
            data: {
                booking_id: booking_id,
                franchise_id: franchise_id,
                provider_id: provider_id,
                franchise_service_package_id: packageData.franchise_service_package_id,
                franchise_service_package_name: packageData.franchise_service_package_name,
                unit: packageData.unit, 
                price: packageData.price,
                total_price: packageData.total_price,
                created_at: new Date(),
                created_by: staff_id || provider_id
            },
        });
        packageList.push(servicePackage);
    }
    return packageList;
}

const getAllPackagesWithChecksListForBooking = async (booking_id) => {
    const packages = await BookingServicePackages.findMany({
        where: { booking_id: booking_id }
    });
    if (packages.length === 0) {
        return null;
    }
    const packagesWithChecks = [];
    for (const pkg of packages) {
        const franchisePackage = await FranchiseServicePackage.findFirst({
            where: { id: pkg.franchise_service_package_id },
            include: { services: true }
        });
        for (const service of franchisePackage.services) {
            if(service.check_list && service.check_list.length > 0){
                for(const check of service.check_list){
                    packagesWithChecks.push(check.checklist_name);
                }
            }
        }
    }
    return packagesWithChecks;
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
export { getProviderByUserId, createBookingServicesPackage, getAllPackagesWithChecksListForBooking, createBookingQualityChecks };