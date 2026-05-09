import express from "express";
import gstReportsRouter from "./Gst-Reports/gst-reports-Router.js";
import { itemReportsRouter } from "./Item-Reports/Item-Reports-Router.js";
import { transactionReportsRouter } from "./Transaction-Reports/Transaction-Reports-Router.js";
import { partyReportsRouter } from "./Party-Reports/Party-Reports-Router.js";
import {generateAndUploadReport} from "./pdf.js"
import { jobcardRouter } from "./JobCard-Reports/JobCard-Reports-Router.js";

const reportsRouter = express.Router();

reportsRouter.use("/gst", gstReportsRouter);
reportsRouter.use("/item", itemReportsRouter);
reportsRouter.use("/transaction", transactionReportsRouter);
reportsRouter.use("/party", partyReportsRouter);
reportsRouter.use("/jobcard", jobcardRouter);

export default reportsRouter;