import { Router } from "express";
import { getProviderSubscribedModules } from "./get-provider-subscribed-modules/index.js";
import { verifyToken, verifyLoginToken } from "../../middleware/verify-token.js";
import { getAllSubscriptionsEndpoint } from "./get-all-subscriptions/index.js";
import { createProviderSubscriptionEndpoint } from "./create-provider-subscription/index.js";
import { getAllModulesEndpoint } from "./get-all-modules/index.js";
import { createOrderSubscriptionEndpoint } from "./create-order-subscription/index.js";
import { getStaffSubscribedModules } from "./get-staff-subscribed-modules/index.js";
import { getRazorpayKeyEndpoint } from "./get-razorpay-key/index.js";
import { razorpayWebhookEndpoint } from "./razorpay-webhook/index.js";

const subscriptionRouter = Router();

subscriptionRouter.get("/", getAllSubscriptionsEndpoint);
subscriptionRouter.get("/razorpay-key", verifyLoginToken, getRazorpayKeyEndpoint);
subscriptionRouter.get("/provider-subscribed-modules", verifyLoginToken, getProviderSubscribedModules);
subscriptionRouter.post("/create-provider-subscription", verifyToken, createProviderSubscriptionEndpoint);
subscriptionRouter.get("/get-all-modules", verifyToken, getAllModulesEndpoint);
subscriptionRouter.post("/create-order-subscription", verifyToken, createOrderSubscriptionEndpoint);
subscriptionRouter.get("/staff-subscribed-modules", verifyToken, getStaffSubscribedModules);
subscriptionRouter.post("/razorpay-webhook", razorpayWebhookEndpoint);

export { subscriptionRouter };
