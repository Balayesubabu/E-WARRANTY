import express from "express";
import { verifyToken } from "../../middleware/verify-token.js";
import {
  createInvoiceSettingsEndPoint,
  getInvoiceSettingsEndPoint,
  updateInvoiceSettingsEndPoint,
  deleteInvoiceSettingsEndPoint,
} from "./index.js";

const invoiceSettingsRouter = express.Router();

invoiceSettingsRouter.post(
  "/create-invoice-settings",
  verifyToken,
  createInvoiceSettingsEndPoint
);

invoiceSettingsRouter.get(
  "/get-invoice-settings",
  verifyToken,
  getInvoiceSettingsEndPoint
);

invoiceSettingsRouter.put(
  "/update-invoice-settings/:id",
  verifyToken,
  updateInvoiceSettingsEndPoint
);

invoiceSettingsRouter.delete(
  "/delete-invoice-settings/:id",
  verifyToken,
  deleteInvoiceSettingsEndPoint
);

export default invoiceSettingsRouter;
