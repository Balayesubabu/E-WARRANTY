import express from "express";
import createWarrantyProductsEndpoint from "./create-warranty-products/index.js";
import getWarrantyProductsEndpoint from "./get-warranty-products/index.js";
import updateWarrantyProductsEndpoint from "./update-warranty-products/index.js";
import deleteWarrantyProductsEndpoint from "./delete-warranty-products/index.js";
import searchWarrantyProductByNameEndpoint from "./search-warranty-product-by-name/index.js";
import { verifyToken, verifyLoginToken } from "../../../middleware/verify-token.js";

const eWarrantyProductsRouter = express.Router();

eWarrantyProductsRouter.post("/create-warranty-products", verifyLoginToken, createWarrantyProductsEndpoint);
eWarrantyProductsRouter.get("/get-warranty-products", verifyLoginToken, getWarrantyProductsEndpoint);
eWarrantyProductsRouter.get("/search-warranty-product-by-name", verifyLoginToken, searchWarrantyProductByNameEndpoint);
eWarrantyProductsRouter.put("/update-warranty-products/terms", verifyLoginToken, updateWarrantyProductsEndpoint);
eWarrantyProductsRouter.delete("/delete-warranty-products/:warranty_product_id",verifyLoginToken, deleteWarrantyProductsEndpoint);

export default eWarrantyProductsRouter;