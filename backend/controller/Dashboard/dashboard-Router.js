import { Router } from "express";
import { getAllTransactionsEndPoint } from "./get-all-transactions/index.js";
import { verifyToken } from "../../middleware/verify-token.js";
import { checkSubscribedModule } from "../../middleware/check-subscribed-module.js";
import getTransactionsByTypeEndpoint from "./get-transactions-by-type/index.js";
import getTransactionsTotalByTypeEndpoint from "./get-transactions-total-by-type/index.js";
import { getTotalTransactionsEndPoint } from "./get-total-transcations/index.js";
import { transactionsByInvoiceTypeEndPoint } from "./transactions-by-invoice-type/index.js";

const dashboardRouter = Router();

// ─── Dashboard Routes (subscription enforced) ───
// All GET routes allowed in read-only mode when subscription expired
dashboardRouter.get(
  "/get-all-transactions/:startDate/:endDate",
  verifyToken,
  checkSubscribedModule,
  getAllTransactionsEndPoint
);
dashboardRouter.get(
  "/get-transactions-by-type",
  verifyToken,
  checkSubscribedModule,
  getTransactionsByTypeEndpoint
);
dashboardRouter.get(
  "/get-transactions-total-by-type",
  verifyToken,
  checkSubscribedModule,
  getTransactionsTotalByTypeEndpoint
);
dashboardRouter.get(
  "/getTotalTranscations",
  verifyToken,
  checkSubscribedModule,
  getTotalTransactionsEndPoint
);
dashboardRouter.post(
  "/transactionsByInvoiceType",
  verifyToken,
  checkSubscribedModule,
  transactionsByInvoiceTypeEndPoint
);

export default dashboardRouter;
