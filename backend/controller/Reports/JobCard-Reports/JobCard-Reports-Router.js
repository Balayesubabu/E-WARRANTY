import {getJobCardReportsEndpoint} from "./JobCard-summary/index.js";
import {Router} from "express";
import {verifyToken} from "../../../middleware/verify-token.js";

const jobcardRouter = Router();

jobcardRouter.get("/jobcard-summary", verifyToken, getJobCardReportsEndpoint);

export {jobcardRouter};