import express from "express";
import { verifyToken } from "../../../middleware/verify-token.js";
import { createProformaInvoiceEndpoint } from "./create-proforma-invoice/index.js";
import { updateProformaInvoiceEndpoint } from "./update-proforma-invoice/index.js";
import { proformaToSalesInvoiceEndpoint } from "./proforma-to-sales-invoice/index.js";
import { getProviderProformaInvoiceEndpoint } from "./get-provider-proforma-invoice/index.js";
import {
  getProformaInvoiceByIdEndpoint,
  downloadProformaInvoiceByIdEndpoint,
} from "./get-proforma-invoice-by-id/index.js";
import { deleteProformaInvoiceEndpoint } from "./delete-proforma-invoice/index.js";
import searchProformaInvoiceEndpoint from "./search-proforma-invoice/index.js";
import getProformaInvoiceByDateEndpoint from "./get-proforma-invoice-by-date/index.js";

const proformaInvoiceRouter = express.Router();

proformaInvoiceRouter.get(
  "/get-provider-proforma-invoice",
  verifyToken,
  getProviderProformaInvoiceEndpoint
);
proformaInvoiceRouter.get(
  "/get-proforma-invoice-by-id/:id",
  verifyToken,
  getProformaInvoiceByIdEndpoint
);
proformaInvoiceRouter.post(
  "/create-proforma-invoice",
  verifyToken,
  createProformaInvoiceEndpoint
);
proformaInvoiceRouter.post(
  "/proforma-to-sales-invoice/:sales_invoice_id",
  verifyToken,
  proformaToSalesInvoiceEndpoint
);
proformaInvoiceRouter.put(
  "/update-proforma-invoice/:id",
  verifyToken,
  updateProformaInvoiceEndpoint
);
proformaInvoiceRouter.get(
  "/search-proforma-invoice",
  verifyToken,
  searchProformaInvoiceEndpoint
);
proformaInvoiceRouter.get(
  "/get-proforma-invoice-by-date",
  verifyToken,
  getProformaInvoiceByDateEndpoint
);
proformaInvoiceRouter.delete(
  "/delete-proforma-invoice/:proforma_invoice_id",
  verifyToken,
  deleteProformaInvoiceEndpoint
);
proformaInvoiceRouter.get(
  "/download-proforma-invoice/:proforma_invoice_id",
  verifyToken,
  downloadProformaInvoiceByIdEndpoint
);

export default proformaInvoiceRouter;
