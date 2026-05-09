import {logger,returnError,returnResponse} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {getProviderByUserId, getAllBookingWorkDetails } from "./query.js";

function getTotalMinutes(startDateTime, endDateTime) {
  const millisecondsDifference = endDateTime.getTime() - startDateTime.getTime();
  const minutesDifference = millisecondsDifference / (1000 * 60);
  return minutesDifference;
}

const getAllBookingWorkDetailsEndpoint = async (req, res) => {
    try {
        logger.info(`getAllBookingWorkDetailsEndpoint`);
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

        const {booking_id} = req.params;
        const bookingWorkDetails = await getAllBookingWorkDetails(booking_id, provider.id, franchise_id);
        if (!bookingWorkDetails || bookingWorkDetails.length === 0) {
            logger.error(`--- No booking work details found for booking id ${booking_id} ---`);
            return returnResponse(res, StatusCodes.OK, `No booking work details found for booking id ${booking_id}`, bookingWorkDetails);
        }
        for (let i = 0; i < bookingWorkDetails.length; i++) {
            if(bookingWorkDetails[i].BookingWorkDetailsTransactions.length > 0){
                let totalMinutes = 0;
                for (let j = 0; j < bookingWorkDetails[i].BookingWorkDetailsTransactions.length; j++) {
                    let date1 = new Date(bookingWorkDetails[i].BookingWorkDetailsTransactions[j].startDateTime);
                    let date2 = new Date(bookingWorkDetails[i].BookingWorkDetailsTransactions[j].endDateTime);
                    let totalTime = getTotalMinutes(date1, date2);
                    totalMinutes += totalTime;
                }
                if(bookingWorkDetails[i].BookingWorkDetailsTransactions.length === 1){
                    bookingWorkDetails[i].startDateTime = bookingWorkDetails[i].BookingWorkDetailsTransactions[0].startDateTime;
                    bookingWorkDetails[i].endDateTime = bookingWorkDetails[i].BookingWorkDetailsTransactions[0].endDateTime;
                }
                else{
                    const sortedTransactions = bookingWorkDetails[i].BookingWorkDetailsTransactions.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
                    bookingWorkDetails[i].startDateTime = sortedTransactions[0].startDateTime;
                    bookingWorkDetails[i].endDateTime = sortedTransactions[sortedTransactions.length - 1].endDateTime;
                }
                bookingWorkDetails[i].total_minutes = Math.round(totalMinutes);
            }
        }


        return returnResponse(res, StatusCodes.OK, bookingWorkDetails);
    } catch (error) {
        logger.error(`--- Error in getAllBookingWorkDetailsEndpoint: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in getAllBookingWorkDetailsEndpoint: ${error.message}`);
    }
}

export { getAllBookingWorkDetailsEndpoint };