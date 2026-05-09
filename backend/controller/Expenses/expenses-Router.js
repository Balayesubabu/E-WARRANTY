import {Router} from "express";
import {createExpenseEndpoint} from "./create-expense/index.js";
import {getAllExpensesEndpoint} from "./get-all-expenses/index.js";
import { getExpenseByIdEndpoint } from "./get-expense-by-id/index.js";
import {updateExpenseByIdEndpoint} from "./update-expense-by-id/index.js";
import {deleteExpenseByIdEndpoint} from "./delete-expense-by-id/index.js";
import {getHighestExpenseNumber} from "./get-highest-expense-number/index.js";
import { verifyToken } from "../../middleware/verify-token.js";


const expensesRouter = Router();

expensesRouter.post("/create-expense",verifyToken, createExpenseEndpoint);
expensesRouter.get("/get-all-expenses",verifyToken, getAllExpensesEndpoint);
expensesRouter.get("/get-expense-by-id/:id",verifyToken, getExpenseByIdEndpoint);
expensesRouter.put("/update-expense-by-id/:id",verifyToken, updateExpenseByIdEndpoint);
expensesRouter.delete("/delete-expense-by-id/:id",verifyToken, deleteExpenseByIdEndpoint);
expensesRouter.get("/get-highest-expense-number",verifyToken, getHighestExpenseNumber);

export {expensesRouter};