import express from "express";
import { createPaymentOutEndpoint } from "./create-payment-out/index.js";
import { getProviderPaymentOutEndpoint } from "./get-provider-payment-out/index.js";
import { verifyToken } from "../../../middleware/verify-token.js";
import getPaymentOutByDateEndpoint from "./get-payment-out-date/index.js";
import searchPaymentOutEndpoint from "./search-payment-out/index.js";
import deletePaymentOutEndpoint from "./delete-payment-out/index.js";

const paymentOutRouter = express.Router();

paymentOutRouter.post("/create-payment-out", verifyToken, createPaymentOutEndpoint);
paymentOutRouter.get("/get-provider-payment-out", verifyToken, getProviderPaymentOutEndpoint);
paymentOutRouter.get("/get-payment-out-by-date", verifyToken, getPaymentOutByDateEndpoint);
paymentOutRouter.get("/search-payment-out", verifyToken, searchPaymentOutEndpoint);
paymentOutRouter.delete("/delete-payment-out/:id", verifyToken, deletePaymentOutEndpoint);

export default paymentOutRouter;
