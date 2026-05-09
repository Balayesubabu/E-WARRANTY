import { Router } from "express";
import { createProductCategoryEndpoint } from "./create-product-category/index.js";
import { getProviderProductCategoryEndpoint } from "./get-provider-product-category/index.js";
import { verifyToken } from '../../../middleware/verify-token.js';
const productCategoryRouter = Router();

productCategoryRouter.post("/",verifyToken, createProductCategoryEndpoint);
productCategoryRouter.get("/",verifyToken, getProviderProductCategoryEndpoint);

export { productCategoryRouter };