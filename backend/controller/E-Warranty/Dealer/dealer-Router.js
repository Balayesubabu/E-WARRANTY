import express from "express";
import { createDealerEndpoint } from "./create-dealer/index.js";
import { getProviderDealerEndpoint } from "./get-provider-dealer/index.js";
import { updateDealerEndpoint } from "./update-dealer/index.js";
import { verifyToken, verifyLoginToken } from "../../../middleware/verify-token.js";
import { checkSubscribedModule } from "../../../middleware/check-subscribed-module.js";
import { getDealersByAddressEndpoint } from "./get-dealers-by-address/index.js";
import { contactDealerEndpoint } from "./contact-dealer/index.js";
import { getDealersByProviderIdEndpoint } from "./get-dealers-by-provider/index.js";

const dealerRouter = express.Router();

// Public routes - no subscription check (used during customer warranty registration)
dealerRouter.post("/get-dealers-by-address", getDealersByAddressEndpoint);
dealerRouter.post("/contact-dealer", contactDealerEndpoint);
dealerRouter.get("/:provider_id", getDealersByProviderIdEndpoint);

// Provider/Staff routes - subscription enforcement applied
dealerRouter.post("/", verifyLoginToken, checkSubscribedModule, createDealerEndpoint);
dealerRouter.get("/", verifyLoginToken, checkSubscribedModule, getProviderDealerEndpoint);
dealerRouter.put("/:dealer_id", verifyLoginToken, checkSubscribedModule, updateDealerEndpoint);

export { dealerRouter };