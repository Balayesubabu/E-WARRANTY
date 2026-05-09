import{logger,returnError,returnResponse}from"../../../../services/logger.js";
import{StatusCodes}from"http-status-codes";
import{getAllBookingParts,getProviderByUserId}from"./query.js";

const getAllBookingPartsEndpoint=async(req,res)=>{
    try{
        logger.info(`getAllBookingPartsEndpoint`);
        let user_id;
        let staff_id;
        if(req.type=='staff'){
              user_id=req.provider_id;
                staff_id=req.staff_id;
        }
        if(req.type=='provider'){
            user_id=req.user_id;
            staff_id=null;
        }
        const franchise_id=req.franchise_id;

        logger.info(`--- Fetching provider id from the user id ${req.user_id} ---`);
        const provider=await getProviderByUserId(user_id);
        if(!provider){
            logger.error(`--- Provider not found with user id ${req.user_id} ---`);
            return returnError(res,StatusCodes.NOT_FOUND,`Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${req.user_id} ---`);

        logger.info(`--- Fetching all booking parts ---`);
        const {booking_id}=req.params;
        if(!booking_id){
            logger.error(`--- Booking id is required ---`);
            return returnError(res,StatusCodes.BAD_REQUEST,`Booking id is required`);
        }
        const allBookingParts=await getAllBookingParts(booking_id,provider.id,franchise_id);
        if(!allBookingParts){
            logger.error(`--- No booking parts found ---`);
            return returnError(res,StatusCodes.NOT_FOUND,`No booking parts found`);
        }
        logger.info(`--- Booking parts fetched ---`);
        return returnResponse(res,StatusCodes.OK,allBookingParts);
    }catch(error){
        logger.error(`Error in getAllBookingPartsEndpoint: ${error.message}`);
        return returnError(res,StatusCodes.INTERNAL_SERVER_ERROR,error.message);
    }
};
export{getAllBookingPartsEndpoint};