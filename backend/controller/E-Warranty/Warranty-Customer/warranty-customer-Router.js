import express from "express";
import { generateCustomerWarrantyOTPEndpoint } from "./generate-customer-warranty-otp/index.js";
import { verifyCustomerWarrantyOTPEndpoint } from "./verify-customer-warranty-otp/index.js";
import { registerCustomerEndpoint } from "./register-customer/index.js";
import { getRegisteredCustomersEndpoint } from "./get-registered-customers/index.js";
import { activeCustomersEndpoint } from "./active-customers/index.js";
import { verifyToken, verifyLoginToken, verifyCustomerToken } from "../../../middleware/verify-token.js";
import { checkSubscribedModule } from "../../../middleware/check-subscribed-module.js";
import { updateCustomerEndpoint } from "./update-customer/index.js";
import { getAllProviderNamesEndpoint } from "./get-all-provider-names/index.js";
import { updatePendingToActiveEndpoint } from "./update-pending-to-active/index.js";
import { uploadWarrantyImageEndpoint } from "./upload-warranty-image/index.js";
import { downloadCustomerPdfEndpoint } from "./download-customer-pdf/index.js";
import { myWarrantiesEndpoint } from "./my-warranties/index.js";
import multer from "multer";
import { valdateRollCodeEndpoint } from "./valdate-roll-code/index.js";
import checkExistingForActivationEndpoint from "./check-existing-for-activation/index.js";

const warrantyCustomerRouter = express.Router();

// Public routes - no subscription check (used by customers during warranty registration)
warrantyCustomerRouter.post("/check-existing-for-activation", checkExistingForActivationEndpoint);
warrantyCustomerRouter.post("/generate-customer-warranty-otp", generateCustomerWarrantyOTPEndpoint);
warrantyCustomerRouter.post("/verify-customer-warranty-otp", verifyCustomerWarrantyOTPEndpoint);
warrantyCustomerRouter.post("/register-customer-warranty", registerCustomerEndpoint);
warrantyCustomerRouter.post("/validate-roll-code", valdateRollCodeEndpoint);
warrantyCustomerRouter.post("/upload-warranty-image", multer().array("warranty_images"), uploadWarrantyImageEndpoint);
warrantyCustomerRouter.get("/get-all-provider-names", getAllProviderNamesEndpoint);

// Provider/Staff routes - subscription enforcement applied
// GET routes allowed in read-only mode, PUT blocked when subscription expired
warrantyCustomerRouter.get("/get-registered-customers", verifyLoginToken, checkSubscribedModule, getRegisteredCustomersEndpoint);
warrantyCustomerRouter.get("/active-customers", verifyLoginToken, checkSubscribedModule, activeCustomersEndpoint);
warrantyCustomerRouter.put("/update-customer-warranty", verifyLoginToken, checkSubscribedModule, updateCustomerEndpoint);
warrantyCustomerRouter.put("/update-pending-to-active", verifyLoginToken, checkSubscribedModule, updatePendingToActiveEndpoint);
warrantyCustomerRouter.post("/download-customer-pdf", verifyLoginToken, checkSubscribedModule, downloadCustomerPdfEndpoint);

// Customer-facing endpoints (uses verifyCustomerToken - no subscription check needed)
warrantyCustomerRouter.get("/my-warranties", verifyCustomerToken, myWarrantiesEndpoint);
warrantyCustomerRouter.post("/download-my-certificate", verifyCustomerToken, downloadCustomerPdfEndpoint);

export default warrantyCustomerRouter;