import e, {Router} from "express";
import { verifyToken } from "../../middleware/verify-token.js";
import {createExpenseCategoryEndpoint} from "./create-expense-category/index.js";
import {getAllExpenseCategoryEndpoint} from "./get-all-expense-category/index.js";
import {getExpenseCategoryByIdEndpoint} from "./get-expense-category-by-id/index.js";
import { deleteExpenseCategoryByIdEndpoint } from "./delete-expense-category-by-id/index.js";
import {updateExpenseCategoryByIdEndpoint} from "./update-expense-category-by-id/index.js";


const expenseCategoryRouter = Router();

expenseCategoryRouter.post("/create-expense-category",verifyToken, createExpenseCategoryEndpoint);
expenseCategoryRouter.get("/get-all-expense-category",verifyToken, getAllExpenseCategoryEndpoint);
expenseCategoryRouter.get("/get-expense-category-by-id/:id",verifyToken, getExpenseCategoryByIdEndpoint);
expenseCategoryRouter.delete("/delete-expense-category-by-id/:id",verifyToken, deleteExpenseCategoryByIdEndpoint);
expenseCategoryRouter.put("/update-expense-category-by-id/:id",verifyToken, updateExpenseCategoryByIdEndpoint);
export {expenseCategoryRouter};