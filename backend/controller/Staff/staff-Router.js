import express from "express";
import staffRoleRouter from "./Staff-Role-Permission/staff-role-Router.js";
import { createStaffEndpoint } from "./create-staff/index.js";
import { staffLoginEndpoint } from "./staff-login/index.js";
import { updateStaffEndpoint } from "./update-staff/index.js";
import { updateStaffRoleEndpoint } from "./update-staff-role/index.js";
import { getStaffDetailsEndpoint } from "./get-staff-details/index.js";
import { getAllStaffDetailsEndpoint } from "./get-all-staff-details/index.js";
import {
  verifyToken,
  verifyStaffToken,
  verifyLoginToken
} from "../../middleware/verify-token.js";
import { checkSubscribedModule } from "../../middleware/check-subscribed-module.js";
import { forgotPasswordSendOTPEndpoint } from "./forgot-password-send-otp/index.js";
import { forgotPasswordVerifyOTPEndpoint } from "./forgot-password-verify-otp/index.js";
import { forgotResetPasswordEndpoint } from "./forgot-reset-password/index.js";
import { changePasswordEndpoint } from "./change-password/index.js";
import { getStaffProfileDetailsEndpoint } from "./get-staff-profile/index.js";
import { generateStaffOTPEndpoint } from "./generate-otp/index.js";
import { staffOTPLogInEndPoint } from "./staff-login-otp/index.js";

import { getAllStaffEndpoint } from "./get-all-staff/index.js";
import {
  getStaffDetailEndpoint as getStaffDetailErpEndpoint,
  assignDealersEndpoint, getDealersForAssignmentEndpoint,
  getAllStaffEnhancedEndpoint, staffRoleDashboardEndpoint,
} from "./staff-erp/index.js";

const staffRouter = express.Router();

// ─── Staff Role sub-router ───
staffRouter.use("/staff-role", staffRoleRouter);

// ─── Public Routes (no auth required) ───
staffRouter.post("/staff-login", staffLoginEndpoint);
staffRouter.post("/staff-login-otp", staffOTPLogInEndPoint);
staffRouter.post("/generate-otp", generateStaffOTPEndpoint);
staffRouter.post("/forgot-password-send-otp", forgotPasswordSendOTPEndpoint);
staffRouter.post("/forgot-password-verify-otp", forgotPasswordVerifyOTPEndpoint);
staffRouter.get("/get-all-staff", getAllStaffEndpoint);

// ─── Auth-only Routes (no subscription check - always allowed) ───
// Password management and profile viewing should always be accessible
staffRouter.post("/change-password", verifyToken, changePasswordEndpoint);
staffRouter.post("/forgot-reset-password", verifyLoginToken, forgotResetPasswordEndpoint);
staffRouter.get("/get-staff-profile", verifyToken, getStaffProfileDetailsEndpoint);

// ─── Subscription-Enforced Routes ───
// GET routes allowed in read-only mode, POST/PUT blocked when subscription expired

// Staff management (provider routes)
staffRouter.get("/get-staff-details/:staff_id", verifyToken, checkSubscribedModule, getStaffDetailsEndpoint);
staffRouter.post("/create-staff", verifyToken, checkSubscribedModule, createStaffEndpoint);
staffRouter.put("/update-staff/:staff_id", verifyToken, checkSubscribedModule, updateStaffEndpoint);
staffRouter.put("/update-staff-role/:staff_id", verifyToken, checkSubscribedModule, updateStaffRoleEndpoint);
staffRouter.get("/get-all-staff-details", verifyToken, checkSubscribedModule, getAllStaffDetailsEndpoint);

// Staff ERP enhanced routes
staffRouter.get("/erp/detail/:staff_id", verifyToken, checkSubscribedModule, getStaffDetailErpEndpoint);
staffRouter.get("/erp/all", verifyToken, checkSubscribedModule, getAllStaffEnhancedEndpoint);
staffRouter.post("/erp/assign-dealers/:staff_id", verifyToken, checkSubscribedModule, assignDealersEndpoint);
staffRouter.get("/erp/dealers-for-assignment", verifyToken, checkSubscribedModule, getDealersForAssignmentEndpoint);
staffRouter.get("/erp/role-dashboard", verifyToken, checkSubscribedModule, staffRoleDashboardEndpoint);

export default staffRouter;
