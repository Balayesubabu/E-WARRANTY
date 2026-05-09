import express from "express";
import { verifyToken } from "../../../../middleware/verify-token.js";
import { createRequirementEndpoint } from "./requirement-create/index.js";
import {getAllRequirementsEndpoint} from "./requirement-get/index.js"

const customerRequirementRouter = express.Router();

customerRequirementRouter.post("/create", verifyToken, createRequirementEndpoint);
customerRequirementRouter.get("/all", verifyToken, getAllRequirementsEndpoint);
export default customerRequirementRouter;