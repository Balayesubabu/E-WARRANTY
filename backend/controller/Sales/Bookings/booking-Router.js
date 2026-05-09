import express from "express";
import multer from "multer";
const upload = multer();

import { verifyToken } from "../../../middleware/verify-token.js";
import { createBookingEndpoint } from "./create-booking/index.js";
import { updateBookingEndpoint } from "./update-booking/index.js";
import {
  getBookingByIdEndpoint
} from "./get-booking-by-id/index.js";
import { getProviderBookingEndpoint } from "./get-provider-booking/index.js";
import { bookingToSalesInvoiceEndpoint } from "./booking-to-sales-invoice/index.js";
import { deleteBookingEndpoint } from "./delete-booking/index.js";
import searchBookingEndpoint from "./search-booking/index.js";
import getBookingByDateEndpoint from "./get-booking-by-date/index.js";

import customerRequirementRouter from "./customer-requirements/customer-requirement-Router.js";
import {createBookingServicesEndpoint} from "./create-booking-services/index.js";
import  {getAllBookingServicesEndpoint} from "./get-all-booking-sevices/index.js";
import {createBookingServicesPackageEndpoint} from "./create-booking-services-package/index.js";
import {getAllBookingServicesPackagesEndpoint} from "./get-all-booking-services-packages/index.js";
import { createBookingPartsEndpoint } from "./create-booking-parts/index.js";
import { getAllBookingPartsEndpoint } from "./get-all-booking-parts/index.js";
import { createBookingCustomerRequirementsEndpoint } from "./create-booking-customer-requirements/index.js";
import {getAllBookingCustomerRequirementsEndpoint} from "./get-all-booking-customer-requirements/index.js";
import { createBookingTechniciansEndpoint } from "./create-booking-technicians/index.js";
import { getAllBookingTechniciansEndpoint } from "./get-all-booking-technicians/index.js";
import {getAllBookingChecklistEndpoint} from "./get-all-booking-checklist/index.js";
import {updateBookingChecklistEndpoint} from "./update-booking-checklist/index.js";
import {searchPhoneVehicleController} from "./search-phone-vehicle/index.js";
import {getAllVehicleModelEndpoint} from "./get-all-vehicle-model/index.js";
import { createBookingWorkDetailsEndpoint } from "./create-booking-work-details/index.js";
import {getAllBookingWorkDetailsEndpoint} from "./get-all-booking-work-details/index.js";
import {updateBookingWorkDetailsEndpoint} from "./update-booking-work-details/index.js";
import {convertBookingToSalesInvoiceEndpoint} from "./convert-booking-to-sales-invoice/index.js";
import {uploadPdfToS3Endpoint} from "./upload-pdf/index.js";
import {getTotalConsumedPartsByBookingEndpoint} from "./total-consumed-parts-by-booking/index.js";
import {uploadImage} from "./upload-image/index.js";
import {getAllBookingConsumedPartsEndpoint} from "./get-all-booking-consumed-parts/index.js";
import { convertHtmlToPdfEndpoint } from "../Bookings/convert-html-to-pdf/index.js";

const bookingRouter = express.Router();

bookingRouter.get(
  "/get-booking-by-id/:booking_id",
  verifyToken,
  getBookingByIdEndpoint
);
bookingRouter.get(
  "/get-provider-booking",
  verifyToken,
  getProviderBookingEndpoint
);
bookingRouter.post(
  "/booking-to-sales-invoice/:booking_id",
  verifyToken,
  bookingToSalesInvoiceEndpoint
);
bookingRouter.post("/create-booking", verifyToken, createBookingEndpoint);
bookingRouter.put(
  "/update-booking/:booking_id",
  verifyToken,
  updateBookingEndpoint
);
bookingRouter.get("/search-booking", verifyToken, searchBookingEndpoint);
bookingRouter.get(
  "/get-booking-by-date",
  verifyToken,
  getBookingByDateEndpoint
);
bookingRouter.delete(
  "/delete-a-booking/:booking_id",
  verifyToken,
  deleteBookingEndpoint
);
bookingRouter.use(
  "/customer-requirements",
  customerRequirementRouter
);
bookingRouter.post(
  "/create-booking-services",
  verifyToken,
  createBookingServicesEndpoint
);
bookingRouter.get("/get-all-booking-services/:booking_id",verifyToken, getAllBookingServicesEndpoint);
bookingRouter.post("/create-booking-services-package",verifyToken, createBookingServicesPackageEndpoint);
bookingRouter.get("/get-all-booking-services-packages/:booking_id",verifyToken, getAllBookingServicesPackagesEndpoint);
bookingRouter.post("/create-booking-parts",verifyToken, createBookingPartsEndpoint);
bookingRouter.get("/get-all-booking-parts/:booking_id",verifyToken, getAllBookingPartsEndpoint);
bookingRouter.post("/create-booking-customer-requirements",verifyToken, createBookingCustomerRequirementsEndpoint);
bookingRouter.get("/get-all-booking-customer-requirements/:booking_id",verifyToken, getAllBookingCustomerRequirementsEndpoint);
bookingRouter.post("/create-booking-technicians",verifyToken, createBookingTechniciansEndpoint);
bookingRouter.get("/get-all-booking-technicians/:booking_id",verifyToken, getAllBookingTechniciansEndpoint);
bookingRouter.get("/get-all-booking-checklist/:booking_id",verifyToken, getAllBookingChecklistEndpoint);
bookingRouter.put("/update-booking-checklist",verifyToken, updateBookingChecklistEndpoint);
bookingRouter.post("/search-phone-vehicle",verifyToken, searchPhoneVehicleController);
bookingRouter.get("/get-all-vehicle-model",verifyToken, getAllVehicleModelEndpoint);
bookingRouter.post("/create-booking-work-details",verifyToken, createBookingWorkDetailsEndpoint);
bookingRouter.get("/get-all-booking-work-details/:booking_id",verifyToken, getAllBookingWorkDetailsEndpoint);
bookingRouter.put("/update-booking-work-details",verifyToken, updateBookingWorkDetailsEndpoint);
bookingRouter.post("/convert-booking-to-sales-invoice/:booking_id", verifyToken, convertBookingToSalesInvoiceEndpoint);
bookingRouter.get("/get-total-consumed-parts-by-booking/:booking_id", verifyToken, getTotalConsumedPartsByBookingEndpoint);
bookingRouter.post(
  "/upload-pdf",
  verifyToken,
  upload.single("file"),
  uploadPdfToS3Endpoint
);
bookingRouter.post(
  "/upload-image",
  verifyToken,
  upload.single("file"),
  uploadImage
);
bookingRouter.get("/get-all-booking-consumed-parts", verifyToken, getAllBookingConsumedPartsEndpoint);

bookingRouter.post(
  "/convert-html-to-pdf",
  verifyToken,
  convertHtmlToPdfEndpoint
);
export default bookingRouter;
