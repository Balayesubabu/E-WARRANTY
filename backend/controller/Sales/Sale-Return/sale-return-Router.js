import express from "express";
import { verifyToken } from "../../../middleware/verify-token.js";
import { createSalesReturnEndpoint } from "./create-sales-return/index.js";
import { updateSalesReturnEndpoint } from "./update-sales-return/index.js";
import { deleteSalesReturnEndpoint } from "./delete-sales-return/index.js";
import { getProviderSalesReturnEndpoint } from "./get-provider-sales-return/index.js";
import {
  getSaleReturnByIdEndpoint,
  downloadSalesReturnByIdEndpoint,
} from "./get-sale-return-by-id/index.js";
import searchSalesReturnEndpoint from "./search-sales-return/index.js";
import getSalesReturnByDateEndpoint from "./get-sales-return-by-date/index.js";

const saleReturnRouter = express.Router();

saleReturnRouter.get(
  "/get-provider-sales-return",
  verifyToken,
  getProviderSalesReturnEndpoint
);
saleReturnRouter.get(
  "/get-sale-return-by-id/:id",
  verifyToken,
  getSaleReturnByIdEndpoint
);
saleReturnRouter.post(
  "/create-sale-return",
  verifyToken,
  createSalesReturnEndpoint
);
saleReturnRouter.put(
  "/update-sale-return/:sales_invoice_id",
  verifyToken,
  updateSalesReturnEndpoint
);
saleReturnRouter.delete(
  "/delete-sale-return/:sales_invoice_id",
  verifyToken,
  deleteSalesReturnEndpoint
);
saleReturnRouter.get(
  "/search-sales-return",
  verifyToken,
  searchSalesReturnEndpoint
);
saleReturnRouter.get(
  "/get-sales-return-by-date",
  verifyToken,
  getSalesReturnByDateEndpoint
);
saleReturnRouter.get(
  "/download-sales-return/:sales_return_id",
  verifyToken,
  downloadSalesReturnByIdEndpoint
);

export default saleReturnRouter;
