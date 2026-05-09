import express from "express";
import { createCustomerCategoryEndpoint } from "./create-customer-category/index.js";
import { deleteCustomerCategoryEndpoint } from "./delete-customer-category/index.js";
import { verifyToken } from "../../../middleware/verify-token.js";
import { getCustomerCategoryEndpoint } from "./get-customer-category/index.js";
import { updateCustomerCategoryEndpoint } from "./update-customer-category/index.js";

const providerCustomerCategoryRouter = express.Router();

providerCustomerCategoryRouter.get(
  "/get-customer-category",
  verifyToken,
  getCustomerCategoryEndpoint
);
providerCustomerCategoryRouter.post(
  "/create-customer-category",
  verifyToken,
  createCustomerCategoryEndpoint
);
providerCustomerCategoryRouter.delete(
  "/delete-customer-category/:customer_category_id",
  verifyToken,
  deleteCustomerCategoryEndpoint
);
providerCustomerCategoryRouter.put(
  "/update-customer-category/:customer_category_id",
  verifyToken,
  updateCustomerCategoryEndpoint
);

export { providerCustomerCategoryRouter };
