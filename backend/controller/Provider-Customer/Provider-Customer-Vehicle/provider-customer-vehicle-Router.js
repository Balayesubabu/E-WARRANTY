import express from "express";
import vehicleDetailsRouter from "./Vehicle-Details/vehicle-details-Router.js";
import { verifyToken } from "../../../middleware/verify-token.js";
import { createCustomerVehicleEndpoint } from "./create-customer-vehicle/index.js";
import { getCustomerVehicleEndpoint } from "./get-customer-vehicle/index.js";
import { updateCustomerVehicleEndpoint } from "./update-customer-vehicle/index.js";
import { deleteCustomerVehicleEndpoint } from "./delete-customer-vehicle/index.js";
import { uploadVehicleImageEndpoint } from "./upload-vehicle-image/index.js";
import multer from "multer";

const providerCustomerVehicleRouter = express.Router();

providerCustomerVehicleRouter.use("/vehicle-details", vehicleDetailsRouter);

providerCustomerVehicleRouter.post(
  "/",
  verifyToken,
  createCustomerVehicleEndpoint
);
providerCustomerVehicleRouter.get(
  "/:customer_id",
  verifyToken,
  getCustomerVehicleEndpoint
);
providerCustomerVehicleRouter.put(
  "/:customer_vehicle_id",
  verifyToken,
  updateCustomerVehicleEndpoint
);
providerCustomerVehicleRouter.delete(
  "/:customer_vehicle_id",
  verifyToken,
  deleteCustomerVehicleEndpoint
);
providerCustomerVehicleRouter.post(
  "/upload-vehicle-image",
  verifyToken,
  multer().array("vehicle_images"),
  uploadVehicleImageEndpoint
);

export default providerCustomerVehicleRouter;
