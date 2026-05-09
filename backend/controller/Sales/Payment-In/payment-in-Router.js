import express from "express";
import { verifyToken } from "../../../middleware/verify-token.js";
import { createPaymentInEndpoint } from "./create-payment-in/index.js";
import { getProviderPaymentInEndpoint } from "./get-provider-payment-in/index.js";
import searchPaymentInEndpoint from "./search-payment-in/index.js";
import getPaymentInByDateEndpoint from "./get-payment-in-by-date/index.js";
import { getProviderPaymentInByIdEndpoint } from "./get-payment-in-by-id/index.js";
import { deleteProviderPaymentInByIdEndpoint } from "./delete-payment-in-by-id/index.js";
import{getPaymentInByPaymentIdEndpoint} from './get-payment-by-payment-id/index.js'
const paymentInRouter = express.Router();

paymentInRouter.post(
  "/create-payment-in",
  verifyToken,
  createPaymentInEndpoint
);
paymentInRouter.get(
  "/get-provider-payment-in",
  verifyToken,
  getProviderPaymentInEndpoint
);
paymentInRouter.get(
  "/get-provider-payment-in-by-id/:id",
  verifyToken,
  getProviderPaymentInByIdEndpoint
);
paymentInRouter.get("/search-payment-in", verifyToken, searchPaymentInEndpoint);
paymentInRouter.get(
  "/get-payment-in-by-date",
  verifyToken,
  getPaymentInByDateEndpoint
);

paymentInRouter.delete(
  "/delete-provider-payment-in/:id",
  verifyToken,
  deleteProviderPaymentInByIdEndpoint
);

paymentInRouter.get(
  "/get-payment-in-by-payment-id/:id",
  verifyToken,
  getPaymentInByPaymentIdEndpoint
);

export default paymentInRouter;
