import express from "express";
import { dealerRouter } from "./Dealer/dealer-Router.js";
import productWarrantyCodeRouter from "./Product-Warranty-Code/product-warranty-code-Router.js";
import warrantyCustomerRouter from "./Warranty-Customer/warranty-customer-Router.js";
import eWarrantyProductsRouter from "./E-Warranty-Products/e-warranty-products-Router.js";
import settingsRouter from "./Settings/settings-Router.js";

const eWarrantyRouter = express.Router();

eWarrantyRouter.use("/dealer", dealerRouter);
eWarrantyRouter.use("/product-warranty-code", productWarrantyCodeRouter);
eWarrantyRouter.use("/warranty-customer", warrantyCustomerRouter);
eWarrantyRouter.use("/e-warranty-products", eWarrantyProductsRouter);
eWarrantyRouter.use("/settings", settingsRouter);

export { eWarrantyRouter };