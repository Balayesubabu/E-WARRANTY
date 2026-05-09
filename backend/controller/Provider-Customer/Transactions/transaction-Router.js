import express from "express";
import getProviderCustomerTransactionsEndpoint from "./get-provider-customer-transactions/index.js";
import getProviderCustomerTransactionsByDateEndpoint from "./get-provider-customer-transactions-by-date/index.js";
import getInvoiceDataByTransactionIdEndpoint from "./get-invoice-data-by-transaction-id/index.js";
import getTransactionByIdEndpoint from "./get-transaction-by-id/index.js";
import { verifyToken } from "../../../middleware/verify-token.js";

const transactionRouter = express.Router();

transactionRouter.get(
  "/get-provider-customer-transactions",verifyToken,
  getProviderCustomerTransactionsEndpoint
);
transactionRouter.get(
  "/get-provider-customer-transactions-by-date",verifyToken,
  getProviderCustomerTransactionsByDateEndpoint
);
transactionRouter.get(
  "/get-invoice-data-by-transaction-id",verifyToken,
  getInvoiceDataByTransactionIdEndpoint
);
transactionRouter.get("/get-transaction-by-id", verifyToken,
  getTransactionByIdEndpoint
);

export default transactionRouter;
