import { Router } from "express";
import {
  getProviderCustomers,
  downloadProviderCustomers,
} from "./get-provider-customers/index.js";
import { createProviderCustomerEndpoint } from "./create-provider-customer/index.js";
import { createBulkProviderCustomerEndpoint } from "./create-bulk-provider-customer/index.js";
import { updateProviderCustomerEndpoint } from "./update-provider-customer/index.js";
import { deleteProviderCustomerEndpoint } from "./delete-provider-customer/index.js";
import { verifyToken } from "../../middleware/verify-token.js";
import { providerCustomerCategoryRouter } from "./Provider-Customer-Category/provider-customer-category-Router.js";
import { getCustomerByPhoneEndpoint } from "./get-customer-by-phone/index.js";
import { getProviderCustomerByDateEndpoint } from "./filter-by-date/index.js";
import { searchCustomersEndpoint } from "./search-provider-customer/index.js";
import {
  getProviderCustomerById,
  downloadProviderCustomerById,
} from "./get-by-id/index.js";
import { getTotalValueProviderCustomersEndPoint } from "./get-total-value-provider-customer/index.js";
import providerCustomerVehicleRouter from "./Provider-Customer-Vehicle/provider-customer-vehicle-Router.js";
import ledgerRouter from "./Ledger/ledger-Router.js";
import transactionRouter from "./Transactions/transaction-Router.js";

const providerCustomerRouter = Router();

providerCustomerRouter.use(
  "/customer-category",
  providerCustomerCategoryRouter
);
providerCustomerRouter.use("/vehicle", providerCustomerVehicleRouter);
providerCustomerRouter.use("/ledger", ledgerRouter);
providerCustomerRouter.use("/transactions", transactionRouter);

providerCustomerRouter.get(
  "/get-all-provider-customer",
  verifyToken,
  getProviderCustomers
);
providerCustomerRouter.get(
  "/get-total-provider-customer",
  verifyToken,
  getTotalValueProviderCustomersEndPoint
);
providerCustomerRouter.get(
  "/download-provider-customer",
  verifyToken,
  downloadProviderCustomers
);
providerCustomerRouter.get(
  "/get-provider-customer-by-id/:customer_id",
  verifyToken,
  getProviderCustomerById
);
providerCustomerRouter.get(
  "/download-provider-customer-by-id/:customer_id",
  verifyToken,
  downloadProviderCustomerById
);
providerCustomerRouter.get(
  "/get-customer-by-phone",
  verifyToken,
  getCustomerByPhoneEndpoint
);
providerCustomerRouter.get(
  "/search-customers",
  verifyToken,
  searchCustomersEndpoint
);
providerCustomerRouter.post(
  "/add-provider-customer",
  verifyToken,
  createProviderCustomerEndpoint
);
providerCustomerRouter.post(
  "/add-bulk-provider-customer",
  verifyToken,
  createBulkProviderCustomerEndpoint
);
providerCustomerRouter.put(
  "/update-provider-customer/:customer_id",
  verifyToken,
  updateProviderCustomerEndpoint
);
providerCustomerRouter.delete(
  "/delete-customer-provider/:customer_id",
  verifyToken,
  deleteProviderCustomerEndpoint
);
providerCustomerRouter.get(
  "/get-provider-customer-by-date",
  verifyToken,
  getProviderCustomerByDateEndpoint
);

export { providerCustomerRouter };
