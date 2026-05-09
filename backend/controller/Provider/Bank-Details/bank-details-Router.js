import { Router } from "express";
import { createBankDetailsEndpoint } from "./create-bank-details/index.js";
import { getProviderBankDetailsEndpoint } from "./get-provider-bank-details/index.js";
import { updateBankDetailsEndpoint } from "./update-bank-details/index.js";
import { deleteBankDetailsEndpoint } from "./delete-bank-details/index.js";

const bankDetailsRouter = Router();

bankDetailsRouter.post("/", createBankDetailsEndpoint);
bankDetailsRouter.get("/", getProviderBankDetailsEndpoint);
bankDetailsRouter.put("/:bank_detail_id", updateBankDetailsEndpoint);
bankDetailsRouter.delete("/:bank_detail_id", deleteBankDetailsEndpoint);

export { bankDetailsRouter };
