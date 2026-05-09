import express from "express";
import purchaseInvoiceRouter from "./Purchase-Invoice/purchase-invoice-Router.js";
import purchaseOrderRouter from "./Purchase-Order/purchase-order-Router.js";
import purchaseReturnRouter from "./Purchase-Return/purchase-return-Router.js";
import debitNoteRouter from "./Debit-Note/debit-note-Router.js";
import paymentOutRouter from "./Payment-Out/payment-out-Router.js";
import { verifyToken } from "../../middleware/verify-token.js";
import { createPurchaseEndpoint } from "./create/index.js";
import { updatePurchaseEndpoint } from "./update/index.js";
import { getAllPurchaseInvoiceEndpoint } from "./get-all/index.js";
import { getPurchaseInvoiceByIdEndpoint } from "./get-by-id/index.js";
import { getPurchaseInvoiceByDateEndpoint } from "./get-by-date/index.js";
import searchPurchaseInvoiceEndpoint from "./search/index.js";
import { downloadPurchaseInvoiceByIdEndpoint } from "./get-by-id/index.js";

const purchaseRouter = express.Router();

purchaseRouter.use("/purchase-invoice", purchaseInvoiceRouter);
purchaseRouter.use("/purchase-order", purchaseOrderRouter);
purchaseRouter.use("/purchase-return", purchaseReturnRouter);
purchaseRouter.use("/debit-note", debitNoteRouter);
purchaseRouter.use("/payment-out", paymentOutRouter);

//new routes for all purchase sub modules
purchaseRouter.post("/create-purchase-order", verifyToken, createPurchaseEndpoint);
purchaseRouter.post("/create-purchase-invoice", verifyToken, createPurchaseEndpoint);
purchaseRouter.post("/create-purchase-return", verifyToken, createPurchaseEndpoint);
purchaseRouter.post("/create-debit-note", verifyToken, createPurchaseEndpoint);
purchaseRouter.put("/update-purchase-order/:id", verifyToken, updatePurchaseEndpoint);
purchaseRouter.put("/update-purchase-invoice/:id", verifyToken, updatePurchaseEndpoint);
purchaseRouter.put("/update-purchase-return/:id", verifyToken, updatePurchaseEndpoint);
purchaseRouter.put("/update-debit-note/:id", verifyToken, updatePurchaseEndpoint);
purchaseRouter.get("/get-all-purchaseInvoice/:invoice_type", verifyToken, getAllPurchaseInvoiceEndpoint );
purchaseRouter.get("/get-purchaseInvoice-by-id/:invoice_type/:id", verifyToken, getPurchaseInvoiceByIdEndpoint);
purchaseRouter.get("/get-purchaseInvoice-by-date/:invoice_type", verifyToken, getPurchaseInvoiceByDateEndpoint);
purchaseRouter.get("/search-purchase-invoice/:invoice_type", verifyToken, searchPurchaseInvoiceEndpoint);
purchaseRouter.get("/download-purchase-invoice-by-id/:invoice_type/:id", verifyToken, downloadPurchaseInvoiceByIdEndpoint);


export default purchaseRouter;
