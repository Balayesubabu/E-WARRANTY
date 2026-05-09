import api from "../utils/api";

export const createWarrantyClaim = async (claimData) => {
    const response = await api.post("/warranty-claim/create", claimData);
    return response.data;
};

export const getWarrantyClaims = async () => {
    const response = await api.get("/warranty-claim");
    return response.data;
};

export const getWarrantyClaimById = async (id) => {
    const response = await api.get(`/warranty-claim/${id}`);
    return response.data;
};

export const updateWarrantyClaimStatus = async (id, statusData) => {
    const response = await api.put(`/warranty-claim/${id}/status`, statusData);
    return response.data;
};

export const getWarrantyClaimStats = async () => {
    const response = await api.get("/warranty-claim/stats");
    return response.data;
};

/** Customer-facing claim submission - uses verifyCustomerToken */
export const createCustomerWarrantyClaim = async (claimData) => {
    const response = await api.post("/warranty-claim/customer-create", claimData);
    return response.data;
};
