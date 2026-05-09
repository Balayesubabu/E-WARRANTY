import express from "express";
import { createDealerEndpoint } from "../E-Warranty/Dealer/create-dealer/index.js";
import { getProviderDealerEndpoint } from "../E-Warranty/Dealer/get-provider-dealer/index.js";
import { updateDealerEndpoint } from "../E-Warranty/Dealer/update-dealer/index.js";
import { verifyToken, verifyLoginToken } from "../../middleware/verify-token.js";
import { checkSubscribedModule } from "../../middleware/check-subscribed-module.js";
import { getDealersByAddressEndpoint } from "../E-Warranty/Dealer/get-dealers-by-address/index.js";
import { contactDealerEndpoint } from "../E-Warranty/Dealer/contact-dealer/index.js";
import { getDealersByProviderIdEndpoint } from "../E-Warranty/Dealer/get-dealers-by-provider/index.js";
import { deactivateDealerEndpoint } from "./deactivate-dealer/index.js";
import { reactivateDealerEndpoint } from "./reactivate-dealer/index.js";
import { deleteDealerEndpoint } from "./delete-dealer/index.js";
import { getDealerStatusEndpoint } from "./get-dealer-status/index.js";
import { dealerLoginEndpoint } from "./dealer-login/index.js";
import { dealerForgotPasswordSendOTPEndpoint } from "./forgot-password-send-otp/index.js";
import { dealerForgotPasswordVerifyOTPEndpoint } from "./forgot-password-verify-otp/index.js";
import { dealerForgotResetPasswordEndpoint } from "./forgot-reset-password/index.js";
import { dealerChangePasswordEndpoint } from "./change-password/index.js";
import { getDealerProfileEndpoint } from "./get-dealer-profile/index.js";
import { updateDealerProfileEndpoint } from "./update-dealer-profile/index.js";
import { getDealerDetailEndpoint } from "./get-dealer-detail/index.js";
import {
  dealerDashboardStatsEndpoint, createPurchaseOrderEndpoint, getPurchaseOrdersEndpoint,
  getPurchaseOrderDetailEndpoint, createSalesEntryEndpoint, getSalesEntriesEndpoint,
  getDealerInventoryEndpoint, createLedgerEntryEndpoint, getLedgerEndpoint,
  getDealerBusinessProfileEndpoint, updateDealerBusinessProfileEndpoint,
  getDealerWarrantyCodesEndpoint, getDealerWarrantyCodeStatsEndpoint,
  generateDealerWarrantyQRPDFEndpoint,
} from "./dealer-erp/index.js";
import {
  getDealerClaimsEndpoint,
  getDealerClaimStatsEndpoint,
  getDealerClaimByIdEndpoint,
} from "../WarrantyClaim/index.js";

const dealerRouter = express.Router();

// ─── Public Routes (no auth/subscription required) ───
dealerRouter.post("/dealer-login", dealerLoginEndpoint);
dealerRouter.post("/forgot-password-send-otp", dealerForgotPasswordSendOTPEndpoint);
dealerRouter.post("/forgot-password-verify-otp", dealerForgotPasswordVerifyOTPEndpoint);
dealerRouter.post("/get-dealers-by-address", getDealersByAddressEndpoint);
dealerRouter.post("/contact-dealer", contactDealerEndpoint);

// ─── Auth-only Routes (no subscription check - always allowed) ───
// Password management should always be accessible
dealerRouter.post("/forgot-reset-password", verifyLoginToken, dealerForgotResetPasswordEndpoint);
dealerRouter.post("/change-password", verifyToken, dealerChangePasswordEndpoint);

// ─── Subscription-Enforced Routes ───
// GET routes allowed in read-only mode, POST/PUT/DELETE blocked when subscription expired

// Create/manage dealers (provider routes)
dealerRouter.post("/create-dealer", verifyLoginToken, checkSubscribedModule, createDealerEndpoint);
dealerRouter.get("/", verifyLoginToken, checkSubscribedModule, getProviderDealerEndpoint);

// Dealer self-profile management
dealerRouter.get("/get-profile", verifyLoginToken, checkSubscribedModule, getDealerProfileEndpoint);
dealerRouter.put("/update-profile", verifyLoginToken, checkSubscribedModule, updateDealerProfileEndpoint);

// Dealer status management (provider routes)
dealerRouter.post("/deactivate/:dealer_id", verifyLoginToken, checkSubscribedModule, deactivateDealerEndpoint);
dealerRouter.post("/reactivate/:dealer_id", verifyLoginToken, checkSubscribedModule, reactivateDealerEndpoint);
dealerRouter.delete("/delete/:dealerEmail", verifyLoginToken, checkSubscribedModule, deleteDealerEndpoint);
dealerRouter.get("/status/:dealer_id", verifyLoginToken, checkSubscribedModule, getDealerStatusEndpoint);
dealerRouter.get("/detail/:dealer_id", verifyLoginToken, checkSubscribedModule, getDealerDetailEndpoint);

// ─── Dealer ERP Routes (subscription enforced) ───
dealerRouter.get("/erp/dashboard-stats", verifyLoginToken, checkSubscribedModule, dealerDashboardStatsEndpoint);
dealerRouter.get("/erp/purchase-orders", verifyLoginToken, checkSubscribedModule, getPurchaseOrdersEndpoint);
dealerRouter.get("/erp/purchase-orders/:order_id", verifyLoginToken, checkSubscribedModule, getPurchaseOrderDetailEndpoint);
dealerRouter.post("/erp/purchase-orders", verifyLoginToken, checkSubscribedModule, createPurchaseOrderEndpoint);
dealerRouter.get("/erp/sales", verifyLoginToken, checkSubscribedModule, getSalesEntriesEndpoint);
dealerRouter.post("/erp/sales", verifyLoginToken, checkSubscribedModule, createSalesEntryEndpoint);
dealerRouter.get("/erp/inventory", verifyLoginToken, checkSubscribedModule, getDealerInventoryEndpoint);
dealerRouter.get("/erp/ledger", verifyLoginToken, checkSubscribedModule, getLedgerEndpoint);
dealerRouter.post("/erp/ledger", verifyLoginToken, checkSubscribedModule, createLedgerEntryEndpoint);
dealerRouter.get("/erp/business-profile", verifyLoginToken, checkSubscribedModule, getDealerBusinessProfileEndpoint);
dealerRouter.put("/erp/business-profile", verifyLoginToken, checkSubscribedModule, updateDealerBusinessProfileEndpoint);

// ─── Dealer Warranty Claims Routes (read-only access) ───
dealerRouter.get("/erp/warranty-claims", verifyLoginToken, checkSubscribedModule, getDealerClaimsEndpoint);
dealerRouter.get("/erp/warranty-claims/stats", verifyLoginToken, checkSubscribedModule, getDealerClaimStatsEndpoint);
dealerRouter.get("/erp/warranty-claims/:id", verifyLoginToken, checkSubscribedModule, getDealerClaimByIdEndpoint);

// ─── Dealer Warranty Codes Routes (read-only access) ───
dealerRouter.get("/erp/warranty-codes", verifyLoginToken, checkSubscribedModule, getDealerWarrantyCodesEndpoint);
dealerRouter.get("/erp/warranty-codes/stats", verifyLoginToken, checkSubscribedModule, getDealerWarrantyCodeStatsEndpoint);
dealerRouter.post("/erp/warranty-codes/generate-qr-pdf", verifyLoginToken, checkSubscribedModule, generateDealerWarrantyQRPDFEndpoint);

// Parameter-based routes (should come last)
dealerRouter.put("/:dealer_id", verifyLoginToken, checkSubscribedModule, updateDealerEndpoint);
dealerRouter.get("/:provider_id", getDealersByProviderIdEndpoint);

export { dealerRouter };
