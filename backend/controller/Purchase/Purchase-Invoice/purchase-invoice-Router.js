import express from "express";
import { createPurchaseInvoiceEndpoint } from "./create-purchase-invoice/index.js";
import {
  getAllPurchaseInvoiceEndpoint,
  downloadAllPurchaseInvoiceEndpoint,
} from "./get-all-purchase-invoices/index.js";
import {
  getPurchaseInvoiceByIdEndpoint,
  downloadPurchaseInvoiceEndpoint,
} from "./get-purchase-invoice-by-id/index.js";
import { getPurchaseInvoiceByCustomerIdEndpoint } from "./get-invoice-by-customer/index.js";
import { getPurchaseInvoiceByDateEndpoint } from "./get-purchase-invoice-by-date/index.js";
import { updatePurchaseEndpoint } from "./update-purchase-invoice/index.js";
import { deletePurchaseInvoiceEndpoint } from "./delete-purchase-invoice/index.js";
import { verifyToken } from "../../../middleware/verify-token.js";
import searchPurchaseInvoiceEndpoint from "./search-purchase-invoice/index.js";
import {getPurchaseInvoiceByCustomerIdEndPoint} from "./get-purchase-invoice-by-customer/index.js";
import {getPurchaseInvoiceByCustomerForPaymentOutEndPoint} from "./get-purchase-invoice-by-customer-for-paymentOut/index.js";

import { createPurchaseEndpoint } from "../create/index.js";

const purchaseInvoiceRouter = express.Router();

purchaseInvoiceRouter.post(
  "/create-purchase-invoice",
  verifyToken,
  createPurchaseInvoiceEndpoint
);

purchaseInvoiceRouter.post(
  "/create-purchase-invoice",
  verifyToken,
  createPurchaseEndpoint
);


purchaseInvoiceRouter.get(
  "/get-all-purchase-invoices",
  verifyToken,
  getAllPurchaseInvoiceEndpoint
);
purchaseInvoiceRouter.get(
  "/get-purchase-invoice-by-id/:purchase_invoice_id",
  verifyToken,
  getPurchaseInvoiceByIdEndpoint
);
purchaseInvoiceRouter.get(
  "/get-purchase-invoice-by-customerId",
  verifyToken,
  getPurchaseInvoiceByCustomerIdEndpoint
);
purchaseInvoiceRouter.get(
  "/get-purchase-invoice-by-date",
  verifyToken,
  getPurchaseInvoiceByDateEndpoint
);
purchaseInvoiceRouter.put(
  "/update-purchase-invoice/:purchase_invoice_id",
  verifyToken,
  updatePurchaseEndpoint
);
purchaseInvoiceRouter.delete(
  "/delete-purchase-invoice/:purchase_invoice_id",
  verifyToken,
  deletePurchaseInvoiceEndpoint
);
purchaseInvoiceRouter.get(
  "/search-purchase-invoice",
  verifyToken,
  searchPurchaseInvoiceEndpoint
);
purchaseInvoiceRouter.get(
  "/download-purchase-invoice/:purchase_invoice_id",
  verifyToken,
  downloadPurchaseInvoiceEndpoint
);
purchaseInvoiceRouter.get(
  "/download-all-purchase-invoices",
  verifyToken,
  downloadAllPurchaseInvoiceEndpoint
);

purchaseInvoiceRouter.get(
  "/get-purchase-invoice-by-customerId/:provider_customer_id",
  verifyToken,
  getPurchaseInvoiceByCustomerIdEndPoint
);

purchaseInvoiceRouter.get(
  "/get-purchase-invoice-by-customerId-for-payment-out/:provider_customer_id",
  verifyToken,
  getPurchaseInvoiceByCustomerForPaymentOutEndPoint
);

export default purchaseInvoiceRouter;
