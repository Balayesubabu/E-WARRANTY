import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import { getUserById, updateUserDetails, updateOwnerDetails, getOwnerByUserId } from "./query.js";
import { normalizeIndianMobile, isValidIndianMobile } from "../../../utils/indianMobile.js";

const updateUserDetailsEndpoint = async (req, res) => {
    try {
        logger.info("updateUserDetailsEndpoint");
        
        const user_id = req.user_id;
        if (!user_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "User id not found in token");
        }

        const { fullname, phone, companyname, address, gstin } = req.body;

        logger.info(`--- Checking if user exists with user_id: ${user_id} ---`);

        const user = await getUserById(user_id);
        if (!user) {
            logger.error(`--- User not found with user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, "User not found");
        }

        logger.info(`--- User found with user_id: ${user_id} ---`);

        // Parse fullname into first_name and last_name
        let first_name = null;
        let last_name = null;
        
        if (fullname) {
            const nameParts = fullname.trim().split(/\s+/);
            first_name = nameParts[0] || null;
            last_name = nameParts.slice(1).join(" ") || null;
        }

        logger.info(`--- Updating user details ---`);

        // Build update data - only include fields that are changing
        const updateData = {
            first_name,
            last_name,
            address: address || null
        };

        if (phone !== undefined && phone !== null && String(phone).trim() !== "") {
            const normalizedPhone = normalizeIndianMobile(phone);
            if (!isValidIndianMobile(normalizedPhone)) {
                return returnError(
                    res,
                    StatusCodes.BAD_REQUEST,
                    "Enter a valid 10-digit Indian mobile number (starting with 6–9)."
                );
            }
            if (normalizedPhone !== user.phone_number) {
                updateData.phone_number = normalizedPhone;
            }
        }

        const updatedUser = await updateUserDetails(user_id, updateData);

        if (!updatedUser) {
            logger.error(`--- Failed to update user with user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to update user details");
        }

        logger.info(`--- User details updated successfully ---`);

        // If user is an owner, update owner-specific fields (companyname, gstin)
        let updatedOwner = null;
        if (user.user_type === 'owner') {
            const owner = await getOwnerByUserId(user_id);
            if (owner) {
                logger.info(`--- Updating owner details for user_id: ${user_id} ---`);
                updatedOwner = await updateOwnerDetails(user_id, {
                    company_name: companyname || owner.company_name,
                    gst_number: gstin || owner.gst_number
                });
                logger.info(`--- Owner details updated successfully ---`);
            }
        }

        // Construct response
        const responseFullname = [updatedUser.first_name, updatedUser.last_name].filter(Boolean).join(" ");

        return returnResponse(res, StatusCodes.OK, "User details updated successfully", {
            user: {
                fullname: responseFullname || null,
                email: updatedUser.email,
                phone: updatedUser.phone_number,
                address: updatedUser.address,
                role: updatedUser.user_type,
                companyname: updatedOwner?.company_name || null,
                gstin: updatedOwner?.gst_number || null
            }
        });

    } catch (error) {
        logger.error(`--- Error in updateUserDetailsEndpoint: ${error.message} ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

export { updateUserDetailsEndpoint };
