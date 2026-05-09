import express from "express";
import { createBalanceSheetEntryEndpoint } from "./create-balance-sheet-entry/index.js";
import { deleteBalanceSheetEntryEndpoint } from "./delete-balance-sheet-entry/index.js";
import { getProviderBalanceSheetEndpoint } from "./get-provider-balance-sheet/index.js";
import { updateBalanceSheetEntryEndpoint } from "./update-balance-sheet-entry/index.js";

import { getProviderTotalLiabilitiesEndPoint } from "./get-total-iabilities/index.js";

import { verifyToken } from "../../../../middleware/verify-token.js";

const balanceSheetRouter = express.Router();

balanceSheetRouter.post(
  "/create-balance-sheet-entry",
  verifyToken,
  createBalanceSheetEntryEndpoint
);
balanceSheetRouter.get(
  "/get-provider-balance-sheet",
  verifyToken,
  getProviderBalanceSheetEndpoint
);
balanceSheetRouter.put(
  "/update-balance-sheet-entry/:balance_sheet_entry_id",
  verifyToken,
  updateBalanceSheetEntryEndpoint
);
balanceSheetRouter.delete(
  "/delete-balance-sheet-entry/:balance_sheet_entry_id",
  verifyToken,
  deleteBalanceSheetEntryEndpoint
);

balanceSheetRouter.get(
  "/get-total-liabilities",
  verifyToken,
  getProviderTotalLiabilitiesEndPoint
);

export default balanceSheetRouter;
