import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import { createSalesInvoice } from "./query.js";

const createNotificationController = async (req_type, title,description,type,sub_type,provider_id,franchise_id,created_by) => {
    try {
        if (type === "Sales") {
            if(sub_type === "SalesInvoice"){
                const notification = await createSalesInvoice(req_type,title,description,type,sub_type,provider_id,franchise_id,created_by);
                if (notification) {
                    returnResponse(res, StatusCodes.OK, "Notification created successfully", notification);
                }
            }
        }
    } catch (error) {
        returnError(res, error);
    }
};

export default createNotificationController;