import express from "express";
import { createPurchaseOrderEndpoint } from "./create-purchase-order/index.js";
import { updatePurchaseOrderEndpoint } from "./update-purchase-order/index.js";
import { getAllPurchaseOrderEndpoint } from "./get-all-purchase-order/index.js";
import {
  getPurchaseOrderByIdEndpoint,
  downloadPurchaseOrderEndpoint,
} from "./get-purchase-order-by-id/index.js";
import { getPurchaseOrderByDateEndpoint } from "./get-purchase-order-by-date/index.js";
import { deletePurchaseOrderEndpoint } from "./delete-purchase-order/index.js";
import { purchaseOrderToPurchaseInvoiceEndpoint } from "./purchase-order-to-invoice/index.js";
import { verifyToken } from "../../../middleware/verify-token.js";
import searchPurchaseOrderEndpoint from "./search-purchase-order/index.js";
import { createPurchaseEndpoint } from "../create/index.js";

const purchaseOrderRouter = express.Router();

purchaseOrderRouter.post(
  "/create-purchase-order",
  verifyToken,
  createPurchaseOrderEndpoint
);
purchaseOrderRouter.put(
  "/update-purchase-order/:purchase_invoice_id",
  verifyToken,
  updatePurchaseOrderEndpoint
);
purchaseOrderRouter.get(
  "/get-all-purchase-orders",
  verifyToken,
  getAllPurchaseOrderEndpoint
);
purchaseOrderRouter.get(
  "/get-purchase-order-by-id/:purchase_invoice_id",
  verifyToken,
  getPurchaseOrderByIdEndpoint
);
purchaseOrderRouter.get(
  "/get-purchase-order-by-date",
  verifyToken,
  getPurchaseOrderByDateEndpoint
);
purchaseOrderRouter.delete(
  "/delete-purchase-order/:purchase_invoice_id",
  verifyToken,
  deletePurchaseOrderEndpoint
);
purchaseOrderRouter.put(
  "/convert-purchase-order-to-invoice/:purchase_invoice_id",
  verifyToken,
  purchaseOrderToPurchaseInvoiceEndpoint
);
purchaseOrderRouter.get(
  "/search-purchase-order",
  verifyToken,
  searchPurchaseOrderEndpoint
);
purchaseOrderRouter.get(
  "/download-purchase-order/:purchase_invoice_id",
  verifyToken,
  downloadPurchaseOrderEndpoint
);

export default purchaseOrderRouter;
