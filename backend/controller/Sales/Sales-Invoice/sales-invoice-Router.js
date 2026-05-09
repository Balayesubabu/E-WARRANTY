import express from "express";
import { createSalesInvoiceEndpoint } from "./create-sales-invoice/index.js";
import { updateSalesInvoiceEndpoint } from "./update-sales-invoice/index.js";
import { deleteSalesInvoiceEndpoint } from "./delete-sales-invoice/index.js";
import { verifyToken } from "../../../middleware/verify-token.js";
import {
  getSalesInvoiceByIdEndpoint,
  downloadSalesInvoiceByIdEndpoint,
} from "./get-sales-invoice-by-id/index.js";
import {
  getProviderSalesInvoiceEndpoint,
  downloadAllSalesInvoiceEndpoint,
  getProviderSalesInvoiceOverviewEndPoint,
} from "./get-provider-sales-invoice/index.js";
import { searchSalesInvoiceEndpoint } from "./search-sales-invoice/index.js";
import { getSalesInvoiceByDateEndpoint } from "./get-sales-invoice-by-date/index.js";
import { getSalesInvoiceByProviderCustomerEndpoint } from "./get-sales-invoice-by-provider-customer/index.js";
import { cancelSalesInvoiceEndPoint } from "./cancel-sales-invoice/index.js";
import { getSalesInvoiceByProviderCustomerForPaymentInEndpoint } from "./get-sales-invoice_by-provider-customer-for-paymentIn/index.js";

const salesInvoiceRouter = express.Router();

salesInvoiceRouter.get(
  "/get-provider-sales-invoices",
  verifyToken,
  getProviderSalesInvoiceEndpoint
);
salesInvoiceRouter.get(
  "/download-all-sales-invoices",
  verifyToken,
  downloadAllSalesInvoiceEndpoint
);
salesInvoiceRouter.get(
  "/get-sales-invoices-overview",
  verifyToken,
  getProviderSalesInvoiceOverviewEndPoint
);
salesInvoiceRouter.get(
  "/get-sales-invoice-by-id/:sales_invoice_id",
  verifyToken,
  getSalesInvoiceByIdEndpoint
);
salesInvoiceRouter.get(
  "/search-sales-invoice",
  verifyToken,
  searchSalesInvoiceEndpoint
);
salesInvoiceRouter.get(
  "/get-sales-invoice-by-date",
  verifyToken,
  getSalesInvoiceByDateEndpoint
);
salesInvoiceRouter.post(
  "/create-sales-invoice",
  verifyToken,
  createSalesInvoiceEndpoint
);
salesInvoiceRouter.put(
  "/update-sales-invoice/:sales_invoice_id",
  verifyToken,
  updateSalesInvoiceEndpoint
);
salesInvoiceRouter.delete(
  "/delete-sales-invoice/:sales_invoice_id",
  verifyToken,
  deleteSalesInvoiceEndpoint
);
salesInvoiceRouter.get(
  "/download-sales-invoice/:sales_invoice_id",
  verifyToken,
  downloadSalesInvoiceByIdEndpoint
);
salesInvoiceRouter.get(
  "/get-sales-invoice-by-provider_customer/:provider_customer_id",
  verifyToken,
  getSalesInvoiceByProviderCustomerEndpoint
);

salesInvoiceRouter.get(
  "/get-sales-invoice-by-provider_customer-for-payment-in/:provider_customer_id",
  verifyToken,
  getSalesInvoiceByProviderCustomerForPaymentInEndpoint
);

salesInvoiceRouter.put(
  "/cancel-sales-invoice/:sales_invoice_id",
  verifyToken,
  cancelSalesInvoiceEndPoint
);

export default salesInvoiceRouter;
