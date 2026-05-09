import express from "express";
import { getAllVehicleModelsEndpoint } from "./get-all-vehicle-models/index.js";
import { getAllVehicleTypesEndpoint } from "./get-all-vehicle-type/index.js";

const vehicleDetailsRouter = express.Router();

vehicleDetailsRouter.get("/vehicle-models", getAllVehicleModelsEndpoint);
vehicleDetailsRouter.get("/vehicle-types", getAllVehicleTypesEndpoint);

export default vehicleDetailsRouter;
