import { logger, returnError,returnResponse } from "../../../../services/logger.js";
import { updateSupportTicketFranchise, getProviderByUserId,getSupportTicketById} from "./query.js";
import { StatusCodes } from "http-status-codes";
import { uploadSingleImage } from "../../../../services/upload.js";

const updateSupportTicket = async (req, res) => {
  try {
    logger.info(`--- Updating SupportTicket ---`);

    let user_id, staff_id;
    if (req.type === 'staff') {
      user_id = req.user_id;
      staff_id = req.staff_id;
    } else if (req.type === 'provider') {
      user_id = req.user_id;
    }

    const franchise_id = req.franchise_id;
    const {supportTicket_id, title, description, status, is_active} = req.body;
    console.log(franchise_id, supportTicket_id, title, description, status, is_active);

    logger.info(`--- Fetching existing support ticket with id ${supportTicket_id} ---`);
    const existingTicket = await getSupportTicketById(supportTicket_id);
    if (!existingTicket) {
      return returnError(res, StatusCodes.NOT_FOUND, `Support ticket not found`);
    }
    console.log(existingTicket);

    let image1Url, image2Url, image3Url, image4Url;
    if (req.files['image1']) {
      image1Url = await uploadSingleImage(req.files['image1'][0]);
    }
    else{
        const { image1 } = req.body;
        image1Url = image1;
    }
    if (req.files['image2']) {
      image2Url = await uploadSingleImage(req.files['image2'][0]);
    }   
    else{
        const { image2 } = req.body;
        image2Url = image2;
    }
    if (req.files['image3']) {
      image3Url = await uploadSingleImage(req.files['image3'][0]);
    }
    else{
        const { image3 } = req.body;
        image3Url = image3;
    }
    if (req.files['image4']) {
        image4Url = await uploadSingleImage(req.files['image4'][0]);    
    }
    else{
        const { image4 } = req.body;
        image4Url = image4;
    }
    let isActiveBool;

    if (typeof is_active === 'string') {
    isActiveBool = is_active.toLowerCase() === 'true';
    } else if (typeof is_active === 'boolean') {
    isActiveBool = is_active;
    } else {
    isActiveBool = true; // or set a default if not sent
    }

    const data = {
        title,
        description,
        status,
        image1: image1Url,
        image2: image2Url,
        image3: image3Url,
        image4: image4Url,
        is_active: isActiveBool
    };
    logger.info(`--- Fetching provider by user_id ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }

    const provider_id = provider.id;

    // Now update the ticket (make sure your `createSupportTicketFranchise` supports update)
    const updatedTicket = await updateSupportTicketFranchise(
      supportTicket_id,
      data,
      staff_id,
      franchise_id,
      provider_id
    );

    return returnResponse(res, StatusCodes.OK, `Updated supportTicket successfully`, updatedTicket);
  } catch (error) {
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
  }
};


export { updateSupportTicket };