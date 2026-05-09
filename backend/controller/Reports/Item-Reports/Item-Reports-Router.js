import {getRateListEndPoint} from "./Rate-List/index.js";
import { getStockSummaryEndPoint } from "./Stock-Summary/index.js";
import { getLowStockSummaryEndPoint } from "./Low-Stock-Summary/index.js";
import {getSalesPurchaseSummaryEndpoint} from "./Sales-Purchase-Summary/index.js";
import {getItemReportByPartyEndpoint} from "./Item-Report-By-Party/index.js";
import {getStockDetailedReportController} from "./Stock-Detailed-Report/index.js";
import {Router} from "express";
import {verifyToken} from "../../../middleware/verify-token.js";
const itemReportsRouter = Router();

itemReportsRouter.get("/rate-list",verifyToken, getRateListEndPoint);
itemReportsRouter.get("/stock-summary",verifyToken, getStockSummaryEndPoint);
itemReportsRouter.get("/low-stock-summary",verifyToken, getLowStockSummaryEndPoint);
itemReportsRouter.get("/sales-purchase-summary",verifyToken, getSalesPurchaseSummaryEndpoint);
itemReportsRouter.get("/item-report-by-party",verifyToken, getItemReportByPartyEndpoint);
itemReportsRouter.get("/stock-detailed-report",verifyToken, getStockDetailedReportController);


export {itemReportsRouter};