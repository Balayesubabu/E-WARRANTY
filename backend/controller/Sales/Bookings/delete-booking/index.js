import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  getBookingById,
  deleteBookingById,
} from "./query.js";

const deleteBookingEndpoint = async (req, res) => {
  try {
    logger.info(`deleteBookingEndpoint`);

    const user_id = req.user_id;

    // --- Verify provider ---
    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    const booking_id = req.params.booking_id;

    // --- Check if booking exists ---
    logger.info(
      `--- Fetching booking details for booking_id: ${booking_id} ---`
    );
    const booking = await getBookingById(booking_id);
    if (!booking) {
      logger.error(`--- Booking not found for booking_id: ${booking_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Booking not found`);
    }
    logger.info(`--- Booking found for booking_id: ${booking_id} ---`);

    // --- Delete booking ---
    logger.info(`--- Deleting booking for booking_id: ${booking_id} ---`);
    await deleteBookingById(booking_id);
    logger.info(`--- Booking deleted successfully ---`);

    return returnResponse(res, StatusCodes.OK, `Booking deleted successfully`);
  } catch (error) {
    logger.error(`Error in deleteBookingEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in deleteBookingEndpoint: ${error.message}`
    );
  }
};

export { deleteBookingEndpoint };
