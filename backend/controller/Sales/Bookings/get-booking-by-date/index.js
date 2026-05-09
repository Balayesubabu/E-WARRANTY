import { StatusCodes } from "http-status-codes";
import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { getBookingByDateQuery, getProviderByUserId, getBookings, getProviderCustomer, getProviderCustomerVehicle, getVehicleBookingOthers, getBookingTransactional, getBookingCustomerRequirements, getBookingParts, getBookingService, getBookingServicesPackage, getBookingTechnicians, getConsumedParts,getSalesInvoiceFromBooking} from "./query.js";

const getBookingByDateEndpoint = async (req, res) => {
  try {
    logger.info(`getBookingByDateEndpoint`);

    let user_id;
    let staff_id;
    if (req.type == "staff") {
      user_id = req.user_id;
      staff_id = req.staff_id;
    }
    if (req.type == "provider") {
      user_id = req.user_id;
      staff_id = null;
    }
    const franchise_id = req.franchise_id;

    logger.info(`--- Getting provider details with user_id : ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found with user_id : ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found with id : ${provider.id} ---`);

    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      logger.error(`--- start_date and end_date are required ---`);
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `start_date and end_date are required`
      );
    }
    logger.info(`--- Fetching bookings from ${start_date} to ${end_date} ---`);
    const bookings = await getBookingByDateQuery(provider.id, franchise_id, start_date, end_date);

    if (bookings.length === 0) {
      logger.info(`--- No bookings found from ${start_date} to ${end_date} ---`);
      return returnResponse(res, StatusCodes.OK, `No bookings found`, []);
    }
    logger.info(`--- ${bookings.length} bookings found from ${start_date} to ${end_date} ---`);
    let detailedBookings = [];
    for (let booking of bookings) {
      let booking_id = booking.id;
      logger.info(`--- Fetching booking by id ${booking_id} ---`);

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

        const consumedParts = await getConsumedParts(booking.id, provider.id, franchise_id);
        logger.info(`--- Consumed parts found with booking id ${booking.id} ---`);

        logger.info(`--- Fetching booking technicians details ---`);
        const bookingTechnicians = await getBookingTechnicians(booking.id, provider.id, franchise_id);

        logger.info(`--- Booking InvoiceNumber From SalesInvoice ----`);
        const salesInvoice = await getSalesInvoiceFromBooking(booking.id, provider.id, franchise_id);
        
        detailedBookings.push({
          ...booking,
          customer, 
          vehicle,
          vehicleBooking,
          bookingTransactional,
          bookingCustomerRequirements,
          bookingParts,
          bookingServices,
          bookingServicesPackage,
          bookingTechnicians,
          consumedParts,
          salesInvoice
        });
      }
    logger.info(`--- Returning all bookings ---`);
    return returnResponse(res, StatusCodes.OK, `Bookings fetched successfully`, detailedBookings);

  } catch (error) {
    logger.error(`Error in getBookingByDateEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getBookingByDateEndpoint`
    );
  }
};

export default getBookingByDateEndpoint;
