import express from "express";
import { createPurchaseReturnEndpoint } from "./create-purchase-return/index.js";
import { updatePurchaseReturnEndpoint } from "./update-purchase-return/index.js";
import { getAllProviderPurchaseReturnEndpoint } from "./get-all-provider-purchase-return/index.js";
import {
  getPurchaseReturnByIdEndpoint,
  downloadPurchaseReturnEndpoint,
} from "./get-purchase-return-by-id/index.js";
import { getPurchaseReturnByDateEndpoint } from "./get-purchase-return-by-date/index.js";
import { deletePurchaseReturnEndpoint } from "./delete-purchase-return/index.js";
import { verifyToken } from "../../../middleware/verify-token.js";
import searchPurchaseReturnEndpoint from "./search-purchase-return/index.js";

const purchaseReturnRouter = express.Router();

purchaseReturnRouter.post(
  "/create-purchase-return",
  verifyToken,
  createPurchaseReturnEndpoint
);
purchaseReturnRouter.put(
  "/update-purchase-return/:purchase_invoice_id",
  verifyToken,
  updatePurchaseReturnEndpoint
);
purchaseReturnRouter.get(
  "/get-all-provider-purchase-returns",
  verifyToken,
  getAllProviderPurchaseReturnEndpoint
);
purchaseReturnRouter.get(
  "/get-purchase-return-by-id/:purchase_invoice_id",
  verifyToken,
  getPurchaseReturnByIdEndpoint
);
purchaseReturnRouter.get(
  "/get-purchase-return-by-date",
  verifyToken,
  getPurchaseReturnByDateEndpoint
);
purchaseReturnRouter.delete(
  "/delete-purchase-return/:purchase_invoice_id",
  verifyToken,
  deletePurchaseReturnEndpoint
);
purchaseReturnRouter.get(
  "/search-purchase-return",
  verifyToken,
  searchPurchaseReturnEndpoint
);
purchaseReturnRouter.get(
  "/download-purchase-return/:purchase_invoice_id",
  verifyToken,
  downloadPurchaseReturnEndpoint
);

export default purchaseReturnRouter;
