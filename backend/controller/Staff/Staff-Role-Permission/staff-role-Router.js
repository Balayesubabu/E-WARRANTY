import express from "express";
import { createStaffRolePermissionEndpoint } from "./create-staff-role-permission/index.js";
import { updateStaffRolePermissionEndpoint } from "./update-staff-role-permission/index.js";
import { getStaffRolePermissionEndpoint } from "./get-staff-role-permission/index.js";
import { verifyToken } from "../../../middleware/verify-token.js";

const staffRoleRouter = express.Router();

staffRoleRouter.post("/create", verifyToken, createStaffRolePermissionEndpoint);
staffRoleRouter.put(
  "/update/:staff_role_id",
  verifyToken,
  updateStaffRolePermissionEndpoint
);
staffRoleRouter.get(
  "/get/:staff_id",
  verifyToken,
  getStaffRolePermissionEndpoint
);

export default staffRoleRouter;
