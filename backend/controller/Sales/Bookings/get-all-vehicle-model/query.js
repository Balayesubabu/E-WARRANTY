import {Provider,VehicleModel} from '../../../../prisma/db-models.js';

const getProviderByUserId = async (userId) => {
    return await Provider.findFirst({
        where: {
            user_id: userId
        }
    });
}
const getAllVehicleModel = async (ProviderId) => {
    return await VehicleModel.findMany();
};
export { getProviderByUserId, getAllVehicleModel };