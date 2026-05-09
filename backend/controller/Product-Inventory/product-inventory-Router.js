import { Router } from "express";
import { createProductEndpoint } from "./create-product/index.js";
import { getProviderProductsEndpoint } from "./get-provider-products/index.js";
import { productCategoryRouter } from "./Product-Category/product-category-Router.js";
import { getProviderProductByCategory } from "./get-provider-product-by-category/index.js";
import { getProviderProductByFranchise } from "./get-provider-product-by-franchise/index.js";
import { updateProviderProductEndpoint } from "./update-provider-product/index.js";
import { getFranchiseProductByCategory } from "./get-franchise-product-by-category/index.js";
import {updateInventoryByIdEndpoint} from "./update-inventory-for-product/index.js"
import { verifyToken } from '../../middleware/verify-token.js'
import multer from "multer";
import { uploadProductImageEndpoint } from "./upload-product-image/index.js";
import { deleteProductEndpoint } from "./delete-product/index.js";
import { searchByProductNameEndpoint } from "./search-by-name/index.js";
import getProviderProductByIdEndpoint from "./get-provider-product-by-id/index.js";
import getProviderProductsByMultipleIds from "./get-provider-products-by-multiple-ids/index.js";
import itemCodeGenerateEndpoint from "./item-code-generate/index.js";
import {getFranchiseProductByItemCodeEndpoint} from "./get-franchise-product-by-itemCode/index.js";

const productInventoryRouter = Router();

productInventoryRouter.use("/product-category", productCategoryRouter);

productInventoryRouter.post("/create-product", verifyToken, createProductEndpoint);
productInventoryRouter.post("/upload-product-image", verifyToken, multer().array("product_images"), uploadProductImageEndpoint);
productInventoryRouter.post("/search-by-name", verifyToken, searchByProductNameEndpoint);
productInventoryRouter.post("/get-provider-products-by-multiple-ids", verifyToken, getProviderProductsByMultipleIds);
productInventoryRouter.get("/get-provider-products", verifyToken, getProviderProductsEndpoint);
productInventoryRouter.get("/get-provider-product-by-id/:product_id", verifyToken, getProviderProductByIdEndpoint);
productInventoryRouter.get("/get-franchise-product-by-category", verifyToken, getFranchiseProductByCategory);
productInventoryRouter.get("/get-provider-product-by-category/:category_id", verifyToken, getProviderProductByCategory);
productInventoryRouter.get("/get-provider-product-by-franchise/:franchise_id", verifyToken, getProviderProductByFranchise);
productInventoryRouter.put("/update-provider-product/:franchise_inventory_id", verifyToken, updateProviderProductEndpoint);
productInventoryRouter.delete("/delete-product/:franchise_inventory_id", verifyToken, deleteProductEndpoint);
productInventoryRouter.put("/update-inventory-for-product/:id", verifyToken, updateInventoryByIdEndpoint);
productInventoryRouter.get("/generate-item-code/:number", verifyToken, itemCodeGenerateEndpoint);
productInventoryRouter.get("/get-franchise-product-by-itemCode", verifyToken, getFranchiseProductByItemCodeEndpoint);

export { productInventoryRouter };