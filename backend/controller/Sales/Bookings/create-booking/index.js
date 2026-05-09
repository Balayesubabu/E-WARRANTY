import { logger, returnError,returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {getProviderByUserId, createBooking, createProviderCustomer, createProviderCustomerVehicle, createVehicleBookingOthers, createBookingTransactional, createBookingCustomerRequirements, createBookingParts, createBookingService, createBookingServicesPackage, createBookingTechnicians, getAllServicesWithChecksListForBooking, createBookingQualityChecks,createCosumedParts} from "./query.js";

const createBookingEndpoint = async (req, res) => {
    try {
        logger.info(`createBookingEndpoint`); 
        let user_id;
        let staff_id;
        if(req.type == 'staff'){
           user_id = req.user_id;
            staff_id = req.staff_id;
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
            staff_id = null;
        }
        const franchise_id = req.franchise_id;
        logger.info(`--- Fetching provider id from the user id ${req.user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${req.user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${req.user_id} ---`);
        logger.info(`--- Creating booking ---`);
        const data = req.body;
        const {
            booking_id,
            customer_name,
            customer_email,
            customer_country_code_phone,
            customer_phone,
            customer_address,
            customer_type,
            customer_gstin_number,
            alternative_country_code_phone,
            alternative_phone,
            is_technician,
            is_workdetails,
            is_quality_check,
            estimated_cost,
            estimated_date,
            status,
            remarks,
            booking_number,
            vehicle_number,
            vehicle_model,
            vehicle_type,
            vehicle_color,
            dents_images,
            personal_belongings,
            additional_information,
            total_amount,
            amount,
            payment_type,
            transaction_id,
            due_amount,
            requirements_list,
            parts_list,
            services_list,
            service_package_list,
            technicians_list,
            consumed_parts
        } = data;
        let customer = await createProviderCustomer(data, provider.id, franchise_id);
        if (!customer) {
            logger.error(`--- Customer not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Customer not created`);
        }
        logger.info(`--- Customer created ---`);
        let vehicle = await createProviderCustomerVehicle(data, provider.id, franchise_id, customer.id);
        if (!vehicle) {
            logger.error(`--- Vehicle not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Vehicle not created`);
        }
        logger.info(`--- Vehicle created ---`);
        let booking = await createBooking(data, provider.id, franchise_id, staff_id, customer.id, vehicle.id);
        console.log(booking);
        if (!booking && !booking_id) {
            logger.error(`--- Booking not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Booking not created and check booking number`);
        }
        if(booking_id && !booking){
            logger.info(`---Booking not updated ---`);
            return returnResponse(res, StatusCodes.OK, `Booking not updated`, {booking_id});
        }
        logger.info(`--- Booking created ---`);
        let vehicleBooking = await createVehicleBookingOthers(data, provider.id, franchise_id, staff_id, booking.id);
        if (!vehicleBooking) {
            logger.error(`--- Vehicle booking others not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Vehicle booking others not created`);
        }
        logger.info(`--- Vehicle booking others created ---`);
        let bookingTransactional = await createBookingTransactional(data, provider.id, franchise_id, staff_id, booking.id);
        if (!bookingTransactional) {
            logger.error(`--- Booking transactional not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Booking transactional not created`);
        } 
        logger.info(`--- Booking transactional created ---`);

        logger.info(`--- Creating booking related entities ---`);
        logger.info(`--- Requirements List: ${requirements_list} ---`);
        if(requirements_list && requirements_list.length > 0){
            let bookingCustomerRequirements = await createBookingCustomerRequirements(requirements_list, booking.id, provider.id, franchise_id, staff_id);
            if (!bookingCustomerRequirements) {
                logger.error(`--- Booking customer requirements not created ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Booking customer requirements not created`);
            }
            logger.info(`--- Booking customer requirements created ---`);
        }
        logger.info(`--- Parts List: ${parts_list} ---`);
        if(parts_list && parts_list.length > 0){
            let bookingParts = await createBookingParts(parts_list, booking.id, provider.id, franchise_id, staff_id); 
            if (!bookingParts) {
                logger.error(`--- Booking parts not created ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Booking parts not created`);
            }
            logger.info(`--- Booking parts created ---`);
        }
        logger.info(`--- Services List: ${services_list} ---`);
        if(services_list && services_list.length > 0){
            let bookingServices = await createBookingService(services_list, booking.id, provider.id, franchise_id, staff_id);
            if (!bookingServices) {
                logger.error(`--- Booking services not created ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Booking services not created`);
            }

            logger.info(`--- Booking services created ---`);
        }

        logger.info(`--- Service Package List: ${service_package_list} ---`);
        if(service_package_list && service_package_list.length > 0){
            let bookingServicesPackage = await createBookingServicesPackage(service_package_list, booking.id, provider.id, franchise_id, staff_id);
            if (!bookingServicesPackage) {
                logger.error(`--- Booking services package not created ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Booking services package not created`);
            }
            logger.info(`--- Booking services package created ---`);
        } 
        logger.info(`--- Technicians List: ${technicians_list} ---`);
        if(technicians_list && technicians_list.length > 0 && is_technician){
            let bookingTechnicians = await createBookingTechnicians(technicians_list, booking.id, provider.id, franchise_id, staff_id);
            console.log(bookingTechnicians);
            if (!bookingTechnicians) {
                logger.error(`--- Booking technicians not created ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Booking technicians not created`);
            }
            logger.info(`--- Booking technicians created ---`);
        }
        logger.info(`--- Created booking related entities ---`);

        logger.info(`--- Get all services for the booking id : ${booking.id} ---`);
        const allServiceswithQualityChecks = await getAllServicesWithChecksListForBooking(services_list);
        if (!allServiceswithQualityChecks) {
            logger.error(`--- No services found for the booking id : ${booking.id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `No services found for the booking id : ${booking.id}`);
        }
        console.log(allServiceswithQualityChecks);
        let convertSet = new Set(allServiceswithQualityChecks);
        let convertList = Array.from(convertSet);

        logger.info(`--- Creating booking quality checks for the booking id : ${booking.id} ---`);

        const bookingChecks = await createBookingQualityChecks(booking.id,convertList,provider.id,franchise_id,staff_id);
        if (!bookingChecks) {
            logger.error(`--- Booking quality checks not created ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Booking quality checks not created`);
        }

        logger.info(`--- Booking quality checks created ---`);

        logger.info(`--- Stock updation for consumed parts ---`);
        if(consumed_parts && consumed_parts.length > 0){
            const consumedParts = await createCosumedParts(consumed_parts,booking.id, provider.id, franchise_id);
            if (!consumedParts) {
                logger.error(`--- Consumed parts not created ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Consumed parts not created`);
            }
            logger.info(`--- Consumed parts created ---`);
        }
        logger.info(`--- Stock updation for consumed parts done ---`);

        logger.info(`--- Booking created/updated successfully ---`);

        return returnResponse(res, StatusCodes.CREATED, `Booking created/updated successfully`, {booking, bookingTransactional, customer, vehicle, vehicleBooking, requirements_list, parts_list, services_list, service_package_list, technicians_list, consumed_parts});
    } catch (error) {
        logger.error(`--- Error in createBookingEndpoint: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in createBookingEndpoint`);
    }
};

export { createBookingEndpoint };