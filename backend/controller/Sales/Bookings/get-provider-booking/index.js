import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getProviderBooking } from "./query.js";

const getProviderBookingEndpoint = async (req, res) => {
  try {
    logger.info(`getProviderBookingEndpoint`);

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

    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    const bookings = await getProviderBooking(provider.id);
    if (!bookings || bookings.length === 0) {
      logger.error(
        `--- Bookings not found for provider_id: ${provider.id} ---`
      );
      return returnError(res, StatusCodes.NOT_FOUND, `Bookings not found`);
    }
    logger.info(`--- Bookings found for provider_id: ${provider.id} ---`);

    // 🔹 Calculate booking stats
    const totalBookings = bookings.length;
    const newBookings = bookings.filter(
      (b) => b.invoice_status === "New"
    ).length;
    const inProgress = bookings.filter(
      (b) => b.invoice_status === "InProgress"
    ).length;
    const completed = bookings.filter(
      (b) => b.invoice_status === "Completed"
    ).length;
    const paymentPending = bookings.filter(
      (b) => b.invoice_payment_status === "Pending"
    ).length;

    const responseData = {
      totalBookings,
      newBookings,
      inProgress,
      completed,
      paymentPending,
      bookings,
    };

    logger.info(`--- Bookings fetched successfully ---`);
    return returnResponse(
      res,
      StatusCodes.OK,
      `Bookings fetched successfully`,
      responseData
    );
  } catch (error) {
    logger.error(`Error in getProviderBookingEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in getProviderBookingEndpoint: ${error.message}`
    );
  }
};

export { getProviderBookingEndpoint };
