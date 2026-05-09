import { Router } from "express";
import { verifyToken, verifyLoginToken, verifyCustomerToken } from "../../middleware/verify-token.js";
import { checkSubscribedModule } from "../../middleware/check-subscribed-module.js";
import {
  createClaimEndpoint,
  customerCreateClaimEndpoint,
  getClaimsEndpoint,
  getClaimByIdEndpoint,
  updateClaimStatusEndpoint,
  getClaimStatsEndpoint,
  getReportDataEndpoint,
} from "./index.js";

const warrantyClaimRouter = Router();

// Provider/Staff routes - subscription enforcement applied
// GET routes allowed in read-only mode, POST/PUT blocked when subscription expired
warrantyClaimRouter.post("/create", verifyToken, checkSubscribedModule, createClaimEndpoint);
warrantyClaimRouter.get("/", verifyToken, checkSubscribedModule, getClaimsEndpoint);
warrantyClaimRouter.get("/stats", verifyToken, checkSubscribedModule, getClaimStatsEndpoint);
warrantyClaimRouter.get("/report", verifyToken, checkSubscribedModule, getReportDataEndpoint);
warrantyClaimRouter.get("/:id", verifyToken, checkSubscribedModule, getClaimByIdEndpoint);
warrantyClaimRouter.put("/:id/status", verifyToken, checkSubscribedModule, updateClaimStatusEndpoint);

// Customer-facing endpoint - no subscription check (customers don't have subscriptions)
warrantyClaimRouter.post("/customer-create", verifyCustomerToken, customerCreateClaimEndpoint);

export { warrantyClaimRouter };
