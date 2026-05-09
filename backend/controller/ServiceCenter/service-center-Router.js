import express from "express";
import { verifyToken, verifyLoginToken } from "../../middleware/verify-token.js";
import { checkSubscribedModule } from "../../middleware/check-subscribed-module.js";
import { serviceCenterLoginEndpoint } from "./service-center-login/index.js";
import { createServiceCenterEndpoint } from "./create-service-center/index.js";
import { getServiceCentersEndpoint } from "./get-service-centers/index.js";
import {
  getServiceCenterClaimsEndpoint,
  getServiceCenterClaimStatsEndpoint,
  getServiceCenterClaimByIdEndpoint,
  updateServiceCenterClaimStatusEndpoint,
} from "../WarrantyClaim/service-center-claims.js";
import { getServiceCenterProfileEndpoint } from "./get-profile/index.js";
import { updateServiceCenterProfileEndpoint } from "./update-profile/index.js";
import { changePasswordEndpoint } from "./change-password/index.js";

const serviceCenterRouter = express.Router();

// Public
serviceCenterRouter.post("/service-center-login", serviceCenterLoginEndpoint);

// Owner/Staff - create and list service centers
serviceCenterRouter.post("/create", verifyToken, checkSubscribedModule, createServiceCenterEndpoint);
serviceCenterRouter.get("/list", verifyToken, checkSubscribedModule, getServiceCentersEndpoint);

// Service center - profile & password
serviceCenterRouter.get("/profile", verifyToken, checkSubscribedModule, getServiceCenterProfileEndpoint);
serviceCenterRouter.put("/profile", verifyToken, checkSubscribedModule, updateServiceCenterProfileEndpoint);
serviceCenterRouter.put("/change-password", verifyToken, changePasswordEndpoint);

// Service center - claims assigned to them
serviceCenterRouter.get("/claims", verifyToken, checkSubscribedModule, getServiceCenterClaimsEndpoint);
serviceCenterRouter.get("/claims/stats", verifyToken, checkSubscribedModule, getServiceCenterClaimStatsEndpoint);
serviceCenterRouter.get("/claims/:id", verifyToken, checkSubscribedModule, getServiceCenterClaimByIdEndpoint);
serviceCenterRouter.put("/claims/:id/status", verifyToken, checkSubscribedModule, updateServiceCenterClaimStatusEndpoint);

export { serviceCenterRouter };
