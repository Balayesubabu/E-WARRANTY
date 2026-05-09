import { logger } from "../../../services/logger.js";
import { returnError, returnResponse } from "../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  getStaffById,
  updateStaff,
  getModuleById,
  getSubModuleById,
  getStaffByEmailOrPhone
} from "./query.js";
import bcrypt from "bcrypt";
import {
  normalizeEmailForIdentity,
  findGlobalEmailLoginConflict,
  GLOBAL_EMAIL_IN_USE_MESSAGE,
} from "../../../utils/globalEmailIdentity.js";

const updateStaffEndpoint = async (req, res) => {
  try {
    logger.info(`UpdateStaffEndpoint`);
    const { staff_id } = req.params;
    const data = req.body;

    let user_id;
    if (req.type == "staff") {
      user_id = req.user_id;
    }
    if (req.type == "provider") {
      user_id = req.user_id;
    }
    const franchise_id = req.franchise_id;

    const {
      name,
      email,
      phone,
      address,
      designation,
      role_type,
      department_id,
      is_active,
      is_deleted,
      sub_module_ids_permissions,
    } = data;

    logger.info(`--- Fetching provider by user id ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found with user id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found with user id: ${user_id} ---`);

    logger.info(`--- Checking if provider already has staff with email: ${email} and phone: ${phone} on franchise: ${franchise_id} ---`);
    const existingStaffList = await getStaffByEmailOrPhone(provider.id, email, phone, franchise_id);
    if (existingStaffList && existingStaffList.length > 0) {
      let message = "";

      for (const staffMember of existingStaffList) {
        if (staffMember.id !== staff_id) {
          if (
            email &&
            staffMember.email &&
            staffMember.email.toLowerCase() === String(email).trim().toLowerCase()
          ) {
            message += `Email ${email} already in use. `;
          }
          if (phone && staffMember.phone === phone) {
            message += `Phone ${phone} already in use. `;
          }
        }
      }

      if (message) {
        logger.error(`--- Conflict: ${message.trim()} ---`);
        return returnError(res, StatusCodes.BAD_REQUEST, message.trim());
      }
    }

    if (email !== undefined && email !== null && String(email).trim() !== "") {
      const emailNorm = normalizeEmailForIdentity(email);
      if (!emailNorm) {
        return returnError(res, StatusCodes.BAD_REQUEST, "Invalid email address");
      }
      const reserved = await findGlobalEmailLoginConflict(emailNorm, { excludeStaffId: staff_id });
      if (reserved) {
        return returnError(res, StatusCodes.CONFLICT, GLOBAL_EMAIL_IN_USE_MESSAGE, {
          code: "GLOBAL_EMAIL_IN_USE",
          existingRole: reserved,
        });
      }
      data.email = emailNorm;
    }

    logger.info(`--- Staff does not exist with email: ${email} and phone: ${phone} ---`);

    logger.info(`--- Fetching staff by id ---`);
    const staff = await getStaffById(provider.id,franchise_id, staff_id);
    if (!staff) {
      logger.error(`--- Staff not found with id: ${staff_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Staff not found`);
    }
    logger.info(`--- Staff found with id: ${staff_id} ---`);


    // let hashed_password = null;
    // if (password) {
    //     logger.info(`--- Hashing password ---`);
    //     const hashed_password = await bcrypt.hash(password, 10);
    //     logger.info(`--- Hashed password : ${hashed_password} ---`);
    // } else {
    //     hashed_password = staff.password;
    // }

    logger.info(`--- Creating staff role and permissions ---`);
    let processed_sub_module_ids_permissions = [];
    for (const sub_module_id_permission of sub_module_ids_permissions) {
      let { sub_module_id, module_id, access_type } = sub_module_id_permission;

      console.log("sub module id ", sub_module_id);

      if (sub_module_id) {
        logger.info(`--- Fetching sub module by id : ${sub_module_id} ---`);
        const sub_module = await getSubModuleById(sub_module_id);
        if (!sub_module) {
          logger.error(`--- Sub module not found ---`);
          return returnError(
            res,
            StatusCodes.NOT_FOUND,
            `Sub module not found`
          );
        }
        logger.info(`--- Sub module found ---`);
        processed_sub_module_ids_permissions.push({
          sub_module_id: sub_module.id,
          module_id: sub_module.module_id,
          access_type: access_type,
        });
      }

      if (!sub_module_id && module_id) {
        logger.info(`--- Fetching module by id : ${module_id} ---`);
        const module = await getModuleById(module_id);
        if (!module) {
          logger.error(`--- Module not found ---`);
          return returnError(res, StatusCodes.NOT_FOUND, `Module not found`);
        }
        logger.info(`--- Module found ---`);
        processed_sub_module_ids_permissions.push({
          module_id: module.id,
          access_type: access_type,
        });
      }
    }
    logger.info(`--- Created staff role and permissions ---`);

    logger.info(`--- Updating staff ---`);
    const updated_staff = await updateStaff(
      staff_id,
      franchise_id,
      data,
      processed_sub_module_ids_permissions
    );
    if (!updated_staff) {
      logger.error(`--- Error in updating staff ---`);
      return returnError(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Error in updating staff`
      );
    }
    logger.info(`--- Staff updated successfully ---`);

    logger.info(`--- Returning updated staff ---`);
    return returnResponse(res, StatusCodes.OK, `Staff updated successfully`, {
      updated_staff,
    });
  } catch (error) {
    logger.error(`--- Error in updating staff ---`, error);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in updating staff`,
      error
    );
  }
};

export { updateStaffEndpoint };
