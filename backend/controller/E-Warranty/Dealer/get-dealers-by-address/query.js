import { Provider, ProviderDealer } from "../../../../prisma/db-models.js";

const getProviderById = async (provider_id) => {
    const provider = await Provider.findFirst({
        where: {
            id: provider_id
        }
    })
    return provider;
}


const getNearbyPincodes = (pincode) => {
    const pincodeNum = parseInt(pincode);
    if (isNaN(pincodeNum)) return [pincode];
    
    const nearbyPincodes = [];
    nearbyPincodes.push(pincode);
    
    // Generate nearby PIN codes within ±50 range
    for (let i = -50; i <= 50; i++) {
        if (i !== 0) {
            const nearbyPincode = (pincodeNum + i).toString().padStart(6, '0');
            nearbyPincodes.push(nearbyPincode);
        }
    }
    
    return nearbyPincodes;
};

const getDealersByAddress = async (provider_id, pin_code = null, city = null) => {
    let whereCondition = {
        provider_id: provider_id
    };

    // Only add pin_code condition if it's not null and not empty
    if (pin_code && pin_code.trim() !== "") {
        const nearbyPincodes = getNearbyPincodes(pin_code);
        whereCondition.pin_code = {
            in: nearbyPincodes,
            mode: "insensitive"
        };
    }

    // Only add city condition if it's not null and not empty
    if (city && city.trim() !== "") {
        whereCondition.city = {
            equals: city,
            mode: "insensitive"
        };
    }

    const dealers = await ProviderDealer.findMany({
        where: whereCondition
    });
    
    return dealers;
}

export { getProviderById, getDealersByAddress };