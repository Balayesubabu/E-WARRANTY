import { Router } from "express";
import { termsConditionsRouter } from "./Terms-Conditions/terms-conditions-Router.js";
import { bankDetailsRouter } from "./Bank-Details/bank-details-Router.js";
import { getProviderEndpoint } from "./get-provider/index.js";
import { uploadAdhaarPanEndpoint as uploadProviderDocumentEndpoint } from "./upload-provider-document/index.js";
import multer from "multer";
import { updateProviderEndpoint } from "./update-provider/index.js";
import { verifyToken, verifyLoginToken } from "../../middleware/verify-token.js";
import { providerTaxRouter } from "./Provider-Tax/provider-tax-Router.js";
import { contactMeEndpoint } from "./contact-me/index.js";
import { getContactNotificationsEndpoint, markNotificationReadEndpoint } from "./get-contact-notifications/index.js";
const providerRouter = Router();

providerRouter.use("/terms-conditions", verifyToken, termsConditionsRouter);
providerRouter.use("/provider-tax", verifyToken, providerTaxRouter);
providerRouter.use("/bank-details", verifyToken, bankDetailsRouter);
providerRouter.get("/", verifyLoginToken, getProviderEndpoint);
providerRouter.post("/upload-document", multer().single("document_image"), verifyLoginToken, uploadProviderDocumentEndpoint);
providerRouter.post("/contact-me", contactMeEndpoint);
providerRouter.get("/contact-notifications", verifyLoginToken, getContactNotificationsEndpoint);
providerRouter.put("/mark-notification-read", verifyLoginToken, markNotificationReadEndpoint);
providerRouter.put("/update-provider", verifyToken, updateProviderEndpoint);

export { providerRouter };