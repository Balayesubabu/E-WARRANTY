import { Router } from "express";
import createLeadEndpoint from "./create-lead/index.js";
import getProviderLeadsEndpoint from "./get-provider-leads/index.js";
import updateLeadEndpoint from "./update-lead/index.js";
import deleteLeadEndpoint from "./delete-lead/index.js";
import getProviderLeadDateFilterEndpoint from "./get-provider-lead-date-filter/index.js";

const leadRouter = Router();

leadRouter.post("/", createLeadEndpoint);
leadRouter.get("/", getProviderLeadsEndpoint);
leadRouter.get("/date-filter", getProviderLeadDateFilterEndpoint);
leadRouter.put("/:lead_id", updateLeadEndpoint);
leadRouter.delete("/:lead_id", deleteLeadEndpoint);

export default leadRouter;
