import express from "express";
import getProviderWarrantySettingsEndpoint from "./get-provider-warranty-settings/index.js";
import updateProviderWarrantySettingsEndpoint from "./update-provider-warranty-settings/index.js";
import createProviderWarrantySettingsEndpoint from "./create-provider-warranty-settings/index.js";
import previewCertificateTemplateEndpoint from "./preview-certificate-template/index.js";
import { verifyToken, verifyLoginToken } from "../../../middleware/verify-token.js";

const settingsRouter = express.Router();

settingsRouter.post("/create-provider-warranty-settings",verifyLoginToken, createProviderWarrantySettingsEndpoint);
settingsRouter.get("/get-provider-warranty-settings",verifyLoginToken, getProviderWarrantySettingsEndpoint);
settingsRouter.get("/get-provider-warranty-settings/:provider_id",getProviderWarrantySettingsEndpoint);
settingsRouter.put("/update-provider-warranty-settings",verifyLoginToken, updateProviderWarrantySettingsEndpoint);
settingsRouter.post("/preview-certificate-template", verifyLoginToken, previewCertificateTemplateEndpoint);

export default settingsRouter;

