import { VehicleType } from "../../../../../prisma/db-models.js";

const getAllVehicleTypes = async () => {
    const vehicleTypes = await VehicleType.findMany();
    return vehicleTypes;
}

export { getAllVehicleTypes };