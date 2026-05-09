import express from "express";
import { generateProductIdEndpoint } from "./generate-product-id/index.js";
import { verifyToken, verifyLoginToken } from "../../../middleware/verify-token.js";
import { checkSubscribedModule } from "../../../middleware/check-subscribed-module.js";
import { generateProductWarrantyCodeEndpoint } from "./generate-product-warranty-code/index.js";
import { generateQRCodeEndpoint } from "./generate-qr-code/index.js";
import {
  getProviderWarrantyCodesEndpoint,
  getAvailableWarrantyCodesEndpoint,
  getDealerAssignedAvailableWarrantyCodesEndpoint,
  assignWarrantyCodeDealerEndpoint,
  getWarrantyCodeSummaryEndpoint,
  unassignWarrantyCodeDealerEndpoint,
  assignPartialBatchToDealerEndpoint,
  unassignPartialBatchFromDealerEndpoint,
  getBatchDealerAssignmentsEndpoint
} from "./get-provider-warranty-codes/index.js";
import { updateProductWarrantyCodeByGroupEndpoint } from "./update-product-warranty-code-by-group/index.js";
import getProviderWarrantyCodeByGroupIdEndpoint from "./get-provider-warranty-code-by-group-id/index.js";
import { resolveTokenEndpoint } from "./resolve-token/index.js";
import { verifyByCodeEndpoint } from "./verify-by-code/index.js";
import { lookupByCodeForRegistrationEndpoint } from "./lookup-by-code-for-registration/index.js";
import { lookupByProductSerialEndpoint } from "./lookup-by-product-serial/index.js";
import { generateReportPDFEndpoint } from "./generate-report-pdf/index.js";

const productWarrantyCodeRouter = express.Router();

// ─── Public Routes (no auth required) ───
// Used during warranty verification and QR code scanning
productWarrantyCodeRouter.get("/available-warranty-codes/:provider_id", getAvailableWarrantyCodesEndpoint);
productWarrantyCodeRouter.get("/resolve/:token", resolveTokenEndpoint);
productWarrantyCodeRouter.get("/verify-by-code", verifyByCodeEndpoint);
productWarrantyCodeRouter.get("/lookup-by-code-for-registration", lookupByCodeForRegistrationEndpoint);
productWarrantyCodeRouter.get("/lookup-by-product-serial", lookupByProductSerialEndpoint);
productWarrantyCodeRouter.post("/verify-by-code", verifyByCodeEndpoint);

// ─── Subscription-Enforced Routes ───
// GET routes allowed in read-only mode, POST blocked when subscription expired

// Warranty code viewing (read-only allowed when expired)
productWarrantyCodeRouter.get("/generate-product-id", verifyLoginToken, checkSubscribedModule, generateProductIdEndpoint);
productWarrantyCodeRouter.get("/get-provider-warranty-codes", verifyLoginToken, checkSubscribedModule, getProviderWarrantyCodesEndpoint);
productWarrantyCodeRouter.get("/available-warranty-codes-for-dealer", verifyLoginToken, checkSubscribedModule, getDealerAssignedAvailableWarrantyCodesEndpoint);
productWarrantyCodeRouter.get("/warranty-summary", verifyLoginToken, checkSubscribedModule, getWarrantyCodeSummaryEndpoint);
productWarrantyCodeRouter.get("/get-provider-warranty-code-by-group-id", verifyLoginToken, checkSubscribedModule, getProviderWarrantyCodeByGroupIdEndpoint);

// Warranty code creation/management (blocked when subscription expired)
productWarrantyCodeRouter.post("/assign-warranty-code-dealer", verifyLoginToken, checkSubscribedModule, assignWarrantyCodeDealerEndpoint);
productWarrantyCodeRouter.post("/unassign-warranty-code-dealer", verifyLoginToken, checkSubscribedModule, unassignWarrantyCodeDealerEndpoint);
productWarrantyCodeRouter.post("/assign-partial-batch-dealer", verifyLoginToken, checkSubscribedModule, assignPartialBatchToDealerEndpoint);
productWarrantyCodeRouter.post("/unassign-partial-batch-dealer", verifyLoginToken, checkSubscribedModule, unassignPartialBatchFromDealerEndpoint);
productWarrantyCodeRouter.get("/batch-dealer-assignments", verifyLoginToken, checkSubscribedModule, getBatchDealerAssignmentsEndpoint);
productWarrantyCodeRouter.post("/generate-product-warranty-code", verifyLoginToken, checkSubscribedModule, generateProductWarrantyCodeEndpoint);
productWarrantyCodeRouter.post("/generate-qr-code", verifyLoginToken, checkSubscribedModule, generateQRCodeEndpoint);
productWarrantyCodeRouter.post("/generate-report-pdf", verifyLoginToken, checkSubscribedModule, generateReportPDFEndpoint);
productWarrantyCodeRouter.post("/update-product-warranty-code-by-group/:group_id", verifyLoginToken, checkSubscribedModule, updateProductWarrantyCodeByGroupEndpoint);

export default productWarrantyCodeRouter;