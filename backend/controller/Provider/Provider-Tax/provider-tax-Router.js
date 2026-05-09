import { Router } from "express";
import { createProviderTaxEndpoint } from "./create-provider-tax/index.js";
import { getAllProviderTaxEndpoint } from "./get-all-provider-tax/index.js";
import { getProviderTaxByTypeEndpoint } from "./get-provider-tax-by-type/index.js";

const providerTaxRouter = Router();

providerTaxRouter.post("/", createProviderTaxEndpoint);
providerTaxRouter.get("/", getAllProviderTaxEndpoint);
providerTaxRouter.post("/tax-type", getProviderTaxByTypeEndpoint);

export { providerTaxRouter };
