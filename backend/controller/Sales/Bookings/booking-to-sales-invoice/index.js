import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { getProviderByUserId, getBookingById, bookingToSalesInvoice } from "./query.js";

const bookingToSalesInvoiceEndpoint = async (req, res) => {
    try {
        logger.info(`bookingToSalesInvoiceEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        const booking_id = req.params.booking_id;

        logger.info(`--- Fetching booking details for booking_id: ${booking_id} ---`);
        const booking = await getBookingById(booking_id, provider.id);
        if (!booking) {
            logger.error(`--- Booking not found for booking_id: ${booking_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Booking not found`);
        }
        logger.info(`--- Booking found for booking_id: ${booking_id} ---`);

        logger.info(`--- Converting booking to sales invoice ---`);
        const sales_invoice = await bookingToSalesInvoice(booking);
        if (!sales_invoice) {
            logger.error(`--- Sales invoice not found for booking_id: ${booking_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Sales invoice not found`);
        }
        logger.info(`--- Sales invoice found for booking_id: ${booking_id} ---`);

        logger.info(`--- Sales invoice converted successfully ---`);
        return returnResponse(res, StatusCodes.OK, `Sales invoice converted successfully`, sales_invoice);
    } catch (error) {
        logger.error(`Error in bookingToSalesInvoiceEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in bookingToSalesInvoiceEndpoint: ${error.message}`);
    }
}

export { bookingToSalesInvoiceEndpoint };