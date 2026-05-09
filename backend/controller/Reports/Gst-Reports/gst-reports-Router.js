import express from "express";
import { verifyToken } from "../../../middleware/verify-token.js";
import balanceSheetRouter from "./Balance-Sheet/balance-sheet-Router.js";
import gstr1SalesEndpoint from "./Gstr-1/index.js";
import gstr2Endpoint from "./Gstr-2/index.js";
import gstPurchaseWithHSNEndpoint from "./Gst-Purchase-with-HSN/index.js";
import gstSalesWithHSNEndpoint from "./Gst-Sales-with-HSN/index.js";
import hsnWithSalesSummaryEndpoint from "./HSN-with-sales-summary/index.js";
import tdsPayableEndpoint from "./TDS-payable/index.js";
import tdsReceivableEndpoint from "./TDS-receivable/index.js";
import tcsPayableEndpoint from "./TCS-payable/index.js";
import tcsReceivableEndpoint from "./TCS-receivable/index.js";

const gstReportsRouter = express.Router();

gstReportsRouter.use("/balance-sheet", balanceSheetRouter);
gstReportsRouter.get("/gstr-1", verifyToken, gstr1SalesEndpoint);
gstReportsRouter.get("/gstr-2", verifyToken, gstr2Endpoint);
gstReportsRouter.get("/gst-purchase-with-hsn", verifyToken, gstPurchaseWithHSNEndpoint);
gstReportsRouter.get("/gst-sales-with-hsn", verifyToken, gstSalesWithHSNEndpoint);
gstReportsRouter.get("/hsn-with-sales-summary", verifyToken, hsnWithSalesSummaryEndpoint);
gstReportsRouter.get("/tds-payable", verifyToken, tdsPayableEndpoint);
gstReportsRouter.get("/tds-receivable", verifyToken, tdsReceivableEndpoint);
gstReportsRouter.get("/tcs-payable", verifyToken, tcsPayableEndpoint);
gstReportsRouter.get("/tcs-receivable", verifyToken, tcsReceivableEndpoint);
export default gstReportsRouter;