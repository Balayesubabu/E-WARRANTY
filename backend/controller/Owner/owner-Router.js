import { Router } from "express";
import { ownerSignUp } from "./owner-sign-up/index.js";
import { ownerLogIn } from "./owner-password-log-in/index.js";
import { ownerOTPLogIn } from "./owner-otp-log-in/index.js";
import { generateApiKeyEndpoint } from "./generate-api-key/index.js";
import { getApiKeyEndpoint } from "./get-api-key/index.js";
import { updateApiKeyEndpoint } from "./update-api-key/index.js";
import { getOrCreateFranchiseEndpoint } from "./get-or-create-franchise/index.js";
import {
  customerSummaryEndpoint,
  customerListEndpoint,
  customerDetailEndpoint,
  customerStatusEndpoint,
  customerNotesEndpoint,
  customerDealersEndpoint,
} from "./owner-customers/index.js";
import { registerWarrantyEndpoint } from "./owner-customers/register-warranty/index.js";
import {
  overviewEndpoint,
  purchaseOrdersEndpoint,
  inventoryMovementEndpoint,
  dealerLedgerEndpoint,
  paymentRecordsEndpoint,
  warrantyRegistryEndpoint,
  productMasterEndpoint,
} from "./owner-console/index.js";
import {
  createProductEndpoint, getProductsEndpoint, getProductByIdEndpoint,
  updateProductEndpoint, deleteProductEndpoint, getProductStatsEndpoint,
  createPolicyEndpoint, getPoliciesEndpoint, getPolicyByIdEndpoint,
  updatePolicyEndpoint, deletePolicyEndpoint,
  createBatchEndpoint, getBatchesEndpoint, getBatchByIdEndpoint,
} from "./product-management/index.js";
import { verifyToken, verifyLoginToken } from "../../middleware/verify-token.js";
import { checkSubscribedModule } from "../../middleware/check-subscribed-module.js";
import warrantyTemplateRouter from "../WarrantyTemplate/warranty-template-Router.js";

const ownerRouter = Router();

// Warranty Template (dynamic registration) - mounted at /owner/warranty-template
ownerRouter.use("/warranty-template", warrantyTemplateRouter);

// ─── Public Routes (no auth required) ───
ownerRouter.post("/owner-sign-up", ownerSignUp);
ownerRouter.post("/owner-log-in", ownerLogIn);
ownerRouter.post("/owner-otp-log-in", ownerOTPLogIn);

// ─── Always Allowed Routes (auth required, but no subscription check) ───
// These are essential operations that should work even with expired subscription
ownerRouter.get("/get-or-create-franchise", verifyLoginToken, getOrCreateFranchiseEndpoint);
ownerRouter.post("/generate-api-key", verifyToken, generateApiKeyEndpoint);
ownerRouter.post("/get-api-key", verifyToken, getApiKeyEndpoint);
ownerRouter.post("/update-api-key", verifyToken, updateApiKeyEndpoint);

// ─── Subscription-Enforced Routes ───
// GET routes allowed in read-only mode, POST/PUT/DELETE blocked when subscription expired

// Owner Console — ERP module endpoints (read-only in expired mode)
ownerRouter.get("/console/overview", verifyLoginToken, checkSubscribedModule, overviewEndpoint);
ownerRouter.get("/console/purchase-orders", verifyLoginToken, checkSubscribedModule, purchaseOrdersEndpoint);
ownerRouter.get("/console/inventory", verifyLoginToken, checkSubscribedModule, inventoryMovementEndpoint);
ownerRouter.get("/console/dealer-ledger", verifyLoginToken, checkSubscribedModule, dealerLedgerEndpoint);
ownerRouter.get("/console/payments", verifyLoginToken, checkSubscribedModule, paymentRecordsEndpoint);
ownerRouter.get("/console/warranty-registry", verifyLoginToken, checkSubscribedModule, warrantyRegistryEndpoint);
ownerRouter.get("/console/product-master", verifyLoginToken, checkSubscribedModule, productMasterEndpoint);

// Product Management — CRUD (POST/PUT/DELETE blocked when expired)
ownerRouter.post("/products", verifyLoginToken, checkSubscribedModule, createProductEndpoint);
ownerRouter.get("/products", verifyLoginToken, checkSubscribedModule, getProductsEndpoint);
ownerRouter.get("/products/:id", verifyLoginToken, checkSubscribedModule, getProductByIdEndpoint);
ownerRouter.get("/products/:id/stats", verifyLoginToken, checkSubscribedModule, getProductStatsEndpoint);
ownerRouter.put("/products/:id", verifyLoginToken, checkSubscribedModule, updateProductEndpoint);
ownerRouter.delete("/products/:id", verifyLoginToken, checkSubscribedModule, deleteProductEndpoint);

// Warranty Policies — CRUD (POST/PUT/DELETE blocked when expired)
ownerRouter.post("/policies", verifyLoginToken, checkSubscribedModule, createPolicyEndpoint);
ownerRouter.get("/policies", verifyLoginToken, checkSubscribedModule, getPoliciesEndpoint);
ownerRouter.get("/policies/:id", verifyLoginToken, checkSubscribedModule, getPolicyByIdEndpoint);
ownerRouter.put("/policies/:id", verifyLoginToken, checkSubscribedModule, updatePolicyEndpoint);
ownerRouter.delete("/policies/:id", verifyLoginToken, checkSubscribedModule, deletePolicyEndpoint);

// Warranty Batches (POST blocked when expired)
ownerRouter.post("/batches", verifyLoginToken, checkSubscribedModule, createBatchEndpoint);
ownerRouter.get("/batches", verifyLoginToken, checkSubscribedModule, getBatchesEndpoint);
ownerRouter.get("/batches/:id", verifyLoginToken, checkSubscribedModule, getBatchByIdEndpoint);

// Owner Customers - analytics & monitoring (PATCH/POST blocked when expired)
ownerRouter.get("/customers/summary", verifyLoginToken, checkSubscribedModule, customerSummaryEndpoint);
ownerRouter.get("/customers/dealers", verifyLoginToken, checkSubscribedModule, customerDealersEndpoint);
ownerRouter.get("/customers/list", verifyLoginToken, checkSubscribedModule, customerListEndpoint);
ownerRouter.post("/customers/register-warranty", verifyLoginToken, checkSubscribedModule, registerWarrantyEndpoint);
ownerRouter.get("/customers/:id", verifyLoginToken, checkSubscribedModule, customerDetailEndpoint);
ownerRouter.patch("/customers/:id/status", verifyLoginToken, checkSubscribedModule, customerStatusEndpoint);
ownerRouter.post("/customers/:id/notes", verifyLoginToken, checkSubscribedModule, customerNotesEndpoint);

export default ownerRouter;
