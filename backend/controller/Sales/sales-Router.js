import express from "express";
import salesInvoiceRouter from "./Sales-Invoice/sales-invoice-Router.js";
import bookingRouter from "./Bookings/booking-Router.js";
import creditNoteRouter from "./Credit-Note/credit-note-Router.js";
import deliveryChallanRouter from "./Delivery-Challan/delivery-challan-Router.js";
import paymentInRouter from "./Payment-In/payment-in-Router.js";
import proformaInvoiceRouter from "./Proforma-Invoice/proforma-invoice-Router.js";
import quotationRouter from "./Quotation/quotation-Router.js";
import saleReturnRouter from "./Sale-Return/sale-return-Router.js";
import bookingSettingsRouter from "./BookingSettings/booking-settings-Router.js";

const salesRouter = express.Router();

salesRouter.use("/sales-invoice", salesInvoiceRouter);
salesRouter.use("/booking", bookingRouter);
salesRouter.use("/credit-note", creditNoteRouter);
salesRouter.use("/delivery-challan", deliveryChallanRouter);
salesRouter.use("/payment-in", paymentInRouter);
salesRouter.use("/proforma-invoice", proformaInvoiceRouter);
salesRouter.use("/quotation", quotationRouter);
salesRouter.use("/sale-return", saleReturnRouter);
salesRouter.use("/booking-settings", bookingSettingsRouter);
export default salesRouter;
