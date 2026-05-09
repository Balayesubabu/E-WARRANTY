import express from "express";
import generateInvoiceEndpoint from "./generate-invoice/index.js";

const invoiceRouter = express.Router();

invoiceRouter.get("/generate-invoice/:invoice_id", generateInvoiceEndpoint);

export default invoiceRouter;