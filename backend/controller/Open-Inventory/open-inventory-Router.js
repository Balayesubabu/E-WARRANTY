import { Router } from "express";
import { createOpenInventoryEndpoint } from "./create-open-inventory/index.js";
import { getAllOpenInventoryController } from "./get-all-open-inventory/index.js";
import { verifyToken } from '../../middleware/verify-token.js'
import {getAllOpenInventoryByMultipleIdsEndpoint} from "./get-all-open-inventory-by-multiple-ids/index.js";
import {getConsumedAndRemainingEndpoint} from "./get-consumed-and-remaining/index.js";

const openInventoryRouter = Router();

openInventoryRouter.post("/create-open-inventory",verifyToken, createOpenInventoryEndpoint);
openInventoryRouter.get("/get-all-open-inventory",verifyToken, getAllOpenInventoryController);
openInventoryRouter.post("/get-all-open-inventory-by-multiple-ids", verifyToken, getAllOpenInventoryByMultipleIdsEndpoint);
openInventoryRouter.get("/get-consumed-and-remaining", verifyToken, getConsumedAndRemainingEndpoint);

export { openInventoryRouter };