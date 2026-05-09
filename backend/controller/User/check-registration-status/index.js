import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getUserByEmail, getProviderByUserId } from "./query.js";

const checkRegistrationStatusEndpoint = async (req, res) => {
    try {
        logger.info("checkRegistrationStatus");
        const { email } = req.body;

        if (!email) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Email is required");
        }

        const user = await getUserByEmail(email);

        if (!user) {
            return returnResponse(res, StatusCodes.OK, "No user found", {
                status: "new",
                isDraft: false,
                isRegistered: false,
            });
        }

        if (!user.is_otp_verified) {
            return returnResponse(res, StatusCodes.OK, "User exists but not verified", {
                status: "unverified",
                isDraft: false,
                isRegistered: false,
            });
        }

        const provider = await getProviderByUserId(user.id);

        if (provider) {
            return returnResponse(res, StatusCodes.OK, "User is fully registered", {
                status: "registered",
                isDraft: false,
                isRegistered: true,
            });
        }

        return returnResponse(res, StatusCodes.OK, "Draft user found", {
            status: "draft",
            isDraft: true,
            isRegistered: false,
            phone_number: user.phone_number,
            country_code: user.country_code || "+91",
        });
    } catch (error) {
        logger.error("Error in checkRegistrationStatus:", error);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
    }
};

export { checkRegistrationStatusEndpoint };
