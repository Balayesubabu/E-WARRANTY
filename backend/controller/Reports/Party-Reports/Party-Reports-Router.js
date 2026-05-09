import {getPartyReportByItemEndpoint} from "./Party-Report-By-Item/index.js";
import {getCustomersOutStandingEndpoint} from "./Party-Wise-Outstanding/index.js";
import {getSalesSummaryCategoryWiseEndpoint} from "./Sales-Summary-Category-Wise/index.js";
import {getRecievableAgeingReportEndpoint} from "./Recievable-Ageing-Report/index.js";
import {getPartyStatementLedger} from "./Party-Statement-Ledger/index.js";
import {verifyToken} from "../../../middleware/verify-token.js";
import {Router} from "express";

const partyReportsRouter = Router();

partyReportsRouter.get("/party-report-by-item",verifyToken, getPartyReportByItemEndpoint);
partyReportsRouter.get("/party-wise-outstanding",verifyToken, getCustomersOutStandingEndpoint);
partyReportsRouter.get("/sales-summary-category-wise",verifyToken, getSalesSummaryCategoryWiseEndpoint);
partyReportsRouter.get("/recievable-ageing-report",verifyToken, getRecievableAgeingReportEndpoint);
partyReportsRouter.get("/party-statement-ledger",verifyToken, getPartyStatementLedger);

export {partyReportsRouter};