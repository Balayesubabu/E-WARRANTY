import express from "express";
import {
  getCustomerLedgerStatementEndpoint,
  downloadCustomerLedgerStatementEndpoint,
} from "./get-customer-ledger-statement/index.js";
import getCustomerLedgerByDateEndpoint from "./get-customer-ledger-by-date/index.js";
import { verifyToken } from "../../../middleware/verify-token.js";

const ledgerRouter = express.Router();

ledgerRouter.get(
  "/get-customer-ledger-statement",
  verifyToken,
  getCustomerLedgerStatementEndpoint
);
ledgerRouter.get(
  "/download-customer-ledger-statement",
  verifyToken,
  downloadCustomerLedgerStatementEndpoint
);
ledgerRouter.get(
  "/get-customer-ledger-by-date",
  verifyToken,
  getCustomerLedgerByDateEndpoint
);

export default ledgerRouter;
