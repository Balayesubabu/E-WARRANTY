import { Router } from "express";
import { createTermsConditionsEndpoint } from "./create-terms-conditions/index.js";
import { getTermsConditionsEndpoint } from "./get-terms-conditions/index.js";
import { updateTermsConditionsEndpoint } from "./update-terms-conditions/index.js";
const termsConditionsRouter = Router();

termsConditionsRouter.post("/", createTermsConditionsEndpoint);
termsConditionsRouter.get("/", getTermsConditionsEndpoint);
termsConditionsRouter.put("/", updateTermsConditionsEndpoint);

export { termsConditionsRouter };