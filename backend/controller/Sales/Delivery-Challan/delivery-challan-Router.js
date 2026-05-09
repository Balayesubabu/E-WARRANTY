import express from "express";
import { verifyToken } from "../../../middleware/verify-token.js";
import { createDeliveryChallanEndpoint } from "./create-delivery-challan/index.js";
import { updateDeliveryChallanEndpoint } from "./update-delivery-challan/index.js";
import { deliveryToSalesInvoiceEndpoint } from "./delivery-to-sales-invoice/index.js";
import { getProviderDeliveryChallanEndpoint } from "./get-provider-delivery-challan/index.js";
import {
  getDeliveryChallanByIdEndpoint,
  downloadDeliveryChallanByIdEndpoint,
} from "./get-delivery-challan-by-id/index.js";
import { deleteDeliveryChallanEndpoint } from "./delete-delivery-challan/index.js";
import searchDeliveryChallanEndpoint from "./search-delivery-challan/index.js";
import getDeliveryChallanByDateEndpoint from "./get-delilvery-challan-by-date/index.js";

const deliveryChallanRouter = express.Router();

deliveryChallanRouter.get(
  "/get-provider-delivery-challan",
  verifyToken,
  getProviderDeliveryChallanEndpoint
);
deliveryChallanRouter.get(
  "/get-delivery-challan-by-id/:id",
  verifyToken,
  getDeliveryChallanByIdEndpoint
);
deliveryChallanRouter.post(
  "/create-delivery-challan",
  verifyToken,
  createDeliveryChallanEndpoint
);
deliveryChallanRouter.post(
  "/delivery-to-sales-invoice/:sales_invoice_id",
  verifyToken,
  deliveryToSalesInvoiceEndpoint
);
deliveryChallanRouter.put(
  "/update-delivery-challan/:id",
  verifyToken,
  updateDeliveryChallanEndpoint
);
deliveryChallanRouter.get(
  "/search-delivery-challan",
  verifyToken,
  searchDeliveryChallanEndpoint
);
deliveryChallanRouter.get(
  "/get-delivery-challan-by-date",
  verifyToken,
  getDeliveryChallanByDateEndpoint
);
deliveryChallanRouter.delete(
  "/delete-delivery-challan/:delivery_challan_id",
  verifyToken,
  deleteDeliveryChallanEndpoint
);
deliveryChallanRouter.get(
  "/download-delivery-challan/:delivery_challan_id",
  verifyToken,
  downloadDeliveryChallanByIdEndpoint
);

export default deliveryChallanRouter;
