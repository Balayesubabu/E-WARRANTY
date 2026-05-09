import {logger, returnError, returnResponse} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getBookings, getProviderCustomer, getProviderCustomerVehicle, getVehicleBookingOthers, getBookingTransactional, getBookingCustomerRequirements, getBookingParts, getBookingService, getBookingServicesPackage, getBookingTechnicians,getSalesInvoiceFromBooking,getConsumedParts} from "./query.js";
const getBookingByIdEndpoint = async (req, res) => {
    try {
        logger.info(`getBookingByIdEndpoint`);
        const { booking_id } = req.params;
        if (!booking_id) {
            logger.error(`--- Booking id is required ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Booking id is required`);
        }
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

        logger.info(`--- Fetching booking by id ${booking_id} ---`);
        const booking = await getBookings(booking_id, provider.id, franchise_id);

        if (!booking) {
            logger.error(`--- Booking not found with id ${booking_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Booking not found with id ${booking_id}`);
        }
        logger.info(`--- Booking found with id ${booking_id} ---`);

        logger.info(`--- Fetching customer details ---`);
        const customer = await getProviderCustomer(booking.customer_id, provider.id);
        if (!customer) {
            logger.error(`--- Customer not found with id ${booking.customer_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Customer not found with id ${booking.customer_id}`);
        }

        logger.info(`--- Customer found with id ${booking.customer_id} ---`);

        logger.info(`--- Fetching vehicle details ---`);
        const vehicle = await getProviderCustomerVehicle(booking.vehicle_id, booking.customer_id);
        if (!vehicle) {
            logger.error(`--- Vehicle not found with id ${booking.vehicle_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Vehicle not found with id ${booking.vehicle_id}`);
        }
        logger.info(`--- Vehicle found with id ${booking.vehicle_id} ---`);

        logger.info(`--- Fetching vehicle booking others details ---`);
        const vehicleBooking = await getVehicleBookingOthers(booking.id, provider.id, franchise_id);

        logger.info(`--- Vehicle booking others found with booking id ${booking.id} ---`);

        logger.info(`--- Fetching booking transactional details ---`);
        const bookingTransactional = await getBookingTransactional(booking.id, provider.id, franchise_id);

        logger.info(`--- Booking transactional found with booking id ${booking.id} ---`);

        logger.info(`--- Fetching booking customer requirements details ---`);
        const bookingCustomerRequirements = await getBookingCustomerRequirements(booking.id, provider.id, franchise_id);

        logger.info(`--- Booking customer requirements found with booking id ${booking.id} ---`);

        logger.info(`--- Fetching booking parts details ---`);
        const bookingParts = await getBookingParts(booking.id, provider.id, franchise_id);

        logger.info(`--- Booking parts found with booking id ${booking.id} ---`);

        logger.info(`--- Fetching booking services details ---`);
        const bookingServices = await getBookingService(booking.id, provider.id, franchise_id);

        logger.info(`--- Booking services found with booking id ${booking.id} ---`);

        logger.info(`--- Fetching booking services package details ---`);
        const bookingServicesPackage = await getBookingServicesPackage(booking.id, provider.id, franchise_id);

        logger.info(`--- Booking services package found with booking id ${booking.id} ---`);

        logger.info(`--- Fetching booking technicians details ---`);
        const bookingTechnicians = await getBookingTechnicians(booking.id, provider.id, franchise_id);

        logger.info(`--- Booking InvoiceNumber From SalesInvoice ----`);
        const salesInvoice = await getSalesInvoiceFromBooking(booking.id, provider.id, franchise_id);
        let salesInvoiceNumber = null;
        if(salesInvoice){
            salesInvoiceNumber = salesInvoice.invoice_number;
        }
        else{
            salesInvoiceNumber = null;
        }

        logger.info(`--- Booking technicians found with booking id ${booking.id} ---`);

        const consumedParts = await getConsumedParts(booking.id, provider.id, franchise_id);
        logger.info(`--- Consumed parts found with booking id ${booking.id} ---`);

        logger.info(`--- Booking details fetched successfully ---`);

        return returnResponse(res, StatusCodes.OK, `Booking details fetched successfully`, {booking, customer, vehicle, vehicleBooking, bookingTransactional, bookingCustomerRequirements, bookingParts, bookingServices, bookingServicesPackage, bookingTechnicians, salesInvoiceNumber, consumedParts,salesInvoice});
    }
    catch (error) {
        logger.error(`Error in getBookingByIdEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};
export { getBookingByIdEndpoint };