import api from "../utils/api";

/** Backend expects POST /dealer with { name, country_code, phone_number, email, password, address, ... }. */
export const createDealer = async (dealerData) => {
    try {
        const payload = {
            name: dealerData.fullname ?? dealerData.name,
            email: dealerData.email,
            phone_number: dealerData.phone,
            password: dealerData.password,  // Required for dealer login
            country_code: dealerData.country_code ?? "+91",
            address: dealerData.address ?? "",
            pan_number: dealerData.pan_number ?? null,
            gst_number: dealerData.gst_number ?? null,
            pin_code: dealerData.pin_code ?? null,
            city: dealerData.city ?? null,
            state: dealerData.state ?? null,
            country: dealerData.country ?? null,
            is_active: dealerData.is_active ?? true,
            is_deleted: dealerData.is_deleted ?? false,
        };
        const response = await api.post("/dealer/create-dealer", payload);
        return response.data;
    } catch (error) {
        console.error("Error creating dealer:", error);
        throw error;
    }
};

/** Backend GET /dealer returns { status, message, data } where data is the dealers array. */
export const getDealers = async () => {
    try {
        const response = await api.get("/dealer");
        return response.data;
    } catch (error) {
        console.error("Error getting dealers:", error);
        throw error;
    }
};

/** Toggle or set dealer active status via PUT /dealer/:dealer_id with is_active in body. */
export const statusUpdateDealer = async (dealerData) => {
    try {
        const dealerId = dealerData.id ?? dealerData.dealer_id;
        if (!dealerId) throw new Error("Dealer id required");
        const payload = {
            name: dealerData.fullname ?? dealerData.name,
            email: dealerData.email,
            phone_number: dealerData.phone ?? dealerData.phone_number,
            country_code: dealerData.country_code ?? "+91",
            address: dealerData.address ?? null,
            pan_number: dealerData.pan_number ?? null,
            gst_number: dealerData.gst_number ?? null,
            pin_code: dealerData.pin_code ?? null,
            city: dealerData.city ?? null,
            state: dealerData.state ?? null,
            country: dealerData.country ?? null,
            is_active: typeof dealerData.status === "boolean" ? dealerData.status : (dealerData.is_active ?? dealerData.active ?? true),
            is_deleted: dealerData.is_deleted ?? false,
        };
        if (dealerData.reason !== undefined && dealerData.reason !== null && String(dealerData.reason).trim() !== "") {
            payload.reason = String(dealerData.reason).trim();
        }
        const response = await api.put(`/dealer/${dealerId}`, payload);
        return response.data;
    } catch (error) {
        console.error("Error updating dealer status:", error);
        throw error;
    }
};

/** Backend PUT /dealer/:dealer_id expects { name, country_code, phone_number, email, address, is_active, ... }. */
export const updateDealer = async (dealerData) => {
    try {
        const dealerId = dealerData.id ?? dealerData.dealer_id;
        if (!dealerId) throw new Error("Dealer id required to update");
        const payload = {
            name: dealerData.fullname ?? dealerData.name,
            email: dealerData.email,
            phone_number: dealerData.phone ?? dealerData.phone_number,
            country_code: dealerData.country_code ?? "+91",
            address: dealerData.address ?? null,
            pan_number: dealerData.pan_number ?? null,
            gst_number: dealerData.gst_number ?? null,
            pin_code: dealerData.pin_code ?? null,
            city: dealerData.city ?? null,
            state: dealerData.state ?? null,
            country: dealerData.country ?? null,
            is_active: dealerData.is_active ?? dealerData.active ?? true,
            is_deleted: dealerData.is_deleted ?? false,
        };
        const response = await api.put(`/dealer/${dealerId}`, payload);
        return response.data;
    } catch (error) {
        console.error("Error updating dealer:", error);
        throw error;
    }
};

export const deleteDealer = async (dealerEmail) => {
    try {
        const response = await api.delete(`/dealer/delete/${dealerEmail}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting dealer:", error);
        throw error;
    }
};

export const getDealerDetail = async (dealerId) => {
    try {
        const response = await api.get(`/dealer/detail/${dealerId}`);
        return response.data;
    } catch (error) {
        console.error("Error getting dealer detail:", error);
        throw error;
    }
};

// ─── Owner: Dealer ERP Operations ───

export const createDealerPurchaseOrder = async (data) => {
    try {
        const response = await api.post("/dealer/erp/purchase-orders", data);
        return response.data;
    } catch (error) {
        console.error("Error creating purchase order:", error);
        throw error;
    }
};

export const recordDealerPayment = async (data) => {
    try {
        const response = await api.post("/dealer/erp/ledger", data);
        return response.data;
    } catch (error) {
        console.error("Error recording payment:", error);
        throw error;
    }
};

export const getDealerPurchaseOrders = async (dealerId) => {
    try {
        const response = await api.get(`/dealer/erp/purchase-orders?dealer_id=${dealerId}`);
        return response.data?.data || [];
    } catch (error) {
        console.error("Error fetching dealer purchase orders:", error);
        throw error;
    }
};

export const getDealerLedgerByOwner = async (dealerId) => {
    try {
        const response = await api.get(`/dealer/erp/ledger?dealer_id=${dealerId}`);
        return response.data?.data || { entries: [], summary: {} };
    } catch (error) {
        console.error("Error fetching dealer ledger:", error);
        throw error;
    }
};