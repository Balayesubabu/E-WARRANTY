import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getUserById } from "./query.js";

const getUserDetailsEndpoint = async (req, res) => {
  try {
    logger.info("getUserDetailsEndpoint");

    const user_id = req.user_id;
    if (!user_id) {
      return returnError(res, StatusCodes.BAD_REQUEST, "User id not found in token");
    }

    const user = await getUserById(user_id);
    if (!user) {
      return returnError(res, StatusCodes.NOT_FOUND, "User not found");
    }

    const fullname = [user.first_name, user.last_name].filter(Boolean).join(" ");

    return returnResponse(res, StatusCodes.OK, "User fetched successfully", {
      user: {
        id: user.id,
        fullname: fullname || null,
        companyname: null,
        email: user.email,
        role: user.user_type,
        phone: user.phone_number,
        address: user.address,
        gstin: null,
        profile_completed: user.profile_completed === true,
      },
    });
  } catch (error) {
    logger.error(`Error in getUserDetailsEndpoint: ${error}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
  }
};

export { getUserDetailsEndpoint };
