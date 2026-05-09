import express from "express";
import { verifyToken } from "../../../middleware/verify-token.js";
import { createQuotationEndpoint } from "./create-quotation/index.js";
import { updateQuotationEndpoint } from "./update-quotation/index.js";
import { quotationToSalesInvoiceEndpoint } from "./quotation-to-sales-invoice/index.js";
import { getProviderQuotationEndpoint } from "./get-provider-quotation/index.js";
import {
  getQuotationByIdEndpoint,
  downloadQuotationByIdEndpoint,
} from "./get-quotation-by-id/index.js";
import { deleteQuotationEndpoint } from "./delete-quotation/index.js";
import searchQuotationEndpoint from "./search-quotation/index.js";
import getQuotationByDateEndpoint from "./get-quotation-by-date/index.js";

const quotationRouter = express.Router();

quotationRouter.get(
  "/get-provider-quotation",
  verifyToken,
  getProviderQuotationEndpoint
);
quotationRouter.get(
  "/get-quotation-by-id/:id",
  verifyToken,
  getQuotationByIdEndpoint
);
quotationRouter.post("/create-quotation", verifyToken, createQuotationEndpoint);
quotationRouter.put(
  "/update-quotation/:id",
  verifyToken,
  updateQuotationEndpoint
);
quotationRouter.post(
  "/quotation-to-sales-invoice/:id",
  verifyToken,
  quotationToSalesInvoiceEndpoint
);
quotationRouter.get("/search-quotation", verifyToken, searchQuotationEndpoint);
quotationRouter.get(
  "/get-quotation-by-date",
  verifyToken,
  getQuotationByDateEndpoint
);
quotationRouter.delete(
  "/delete-quotation/:quotation_id",
  verifyToken,
  deleteQuotationEndpoint
);
quotationRouter.get(
  "/download-quotation/:quotation_id",
  verifyToken,
  downloadQuotationByIdEndpoint
);

export default quotationRouter;
