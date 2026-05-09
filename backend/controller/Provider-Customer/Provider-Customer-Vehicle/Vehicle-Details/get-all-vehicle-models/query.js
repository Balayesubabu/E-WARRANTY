import { VehicleModel } from "../../../../../prisma/db-models.js";

const getAllVehicleModels = async () => {
    const vehicleModels = await VehicleModel.findMany();
    return vehicleModels;
}

export { getAllVehicleModels };