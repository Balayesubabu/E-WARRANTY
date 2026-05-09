import api from "../utils/api";

// ==============================
// WARRANTY CODE ENDPOINTS
// ==============================

/**
 * Get franchise inventory products for warranty code generation (Item Code from system).
 * Backend: GET /product-inventory/get-provider-product-by-franchise/:franchise_id
 * @param {string} franchiseId - franchise_id from localStorage franchise
 * @returns {Promise<Array>} List of { id, product_name, product_item_code, ... }
 */
export const getFranchiseInventoryForWarranty = async (franchiseId) => {
    try {
        const response = await api.get(`/product-inventory/get-provider-product-by-franchise/${franchiseId}`);
        const payload = response?.data;
        if (Array.isArray(payload)) return payload;
        if (payload?.data && Array.isArray(payload.data)) return payload.data;
        return [];
    } catch (error) {
        console.error("Error fetching franchise inventory for warranty:", error);
        throw error;
    }
};

/**
 * Generate warranty codes for products
 * Backend: POST /e-warranty/product-warranty-code/generate-product-warranty-code
 */
export const generateWarrantyCodes = async (data) => {
    try {
        const response = await api.post("/e-warranty/product-warranty-code/generate-product-warranty-code", data);
        return response.data;
    } catch (error) {
        console.error("Error generating warranty codes:", error);
        throw error;
    }
};

/**
 * Get warranty code summary (total, active, pending, available, assigned)
 * Backend: GET /e-warranty/product-warranty-code/warranty-summary
 */
export const getWarrantyCodeSummary = async () => {
    try {
        const response = await api.get("/e-warranty/product-warranty-code/warranty-summary");
        const summary = response.data?.data?.summary ?? response.data?.summary ?? {};
        return summary;
    } catch (error) {
        console.error("Error fetching warranty code summary:", error);
        throw error;
    }
};

/**
 * Get all warranty codes for the provider
 * Backend: GET /e-warranty/product-warranty-code/get-provider-warranty-codes
 */
export const getProviderWarrantyCodes = async () => {
    try {
        const response = await api.get("/e-warranty/product-warranty-code/get-provider-warranty-codes");
        return response.data;
    } catch (error) {
        console.error("Error fetching warranty codes:", error);
        throw error;
    }
};

/**
 * Assign a warranty code to a dealer
 * Backend: POST /e-warranty/product-warranty-code/assign-warranty-code-dealer
 */
export const assignWarrantyCodeDealer = async (warrantyCodeId, dealerId) => {
    try {
        const response = await api.post("/e-warranty/product-warranty-code/assign-warranty-code-dealer", {
            warranty_code_id: warrantyCodeId,
            dealer_id: dealerId
        });
        return response.data;
    } catch (error) {
        console.error("Error assigning warranty code to dealer:", error);
        throw error;
    }
};

/**
 * Assign all warranty codes in a batch (by group_id) to a dealer
 * Backend: POST /e-warranty/product-warranty-code/assign-warranty-code-dealer
 */
export const assignBatchToDealer = async (groupId, dealerId) => {
    try {
        const response = await api.post("/e-warranty/product-warranty-code/assign-warranty-code-dealer", {
            group_id: groupId,
            dealer_id: dealerId
        });
        return response.data;
    } catch (error) {
        console.error("Error assigning batch to dealer:", error);
        throw error;
    }
};

/**
 * Unassign a warranty code from a dealer (makes it available again)
 * Backend: POST /e-warranty/product-warranty-code/unassign-warranty-code-dealer
 */
export const unassignWarrantyCodeDealer = async (warrantyCodeId) => {
    try {
        const response = await api.post("/e-warranty/product-warranty-code/unassign-warranty-code-dealer", {
            warranty_code_id: warrantyCodeId
        });
        return response.data;
    } catch (error) {
        console.error("Error unassigning warranty code from dealer:", error);
        throw error;
    }
};

/**
 * Unassign all warranty codes in a batch (by group_id) from dealer
 * Backend: POST /e-warranty/product-warranty-code/unassign-warranty-code-dealer
 */
export const unassignBatchFromDealer = async (groupId) => {
    try {
        const response = await api.post("/e-warranty/product-warranty-code/unassign-warranty-code-dealer", {
            group_id: groupId
        });
        return response.data;
    } catch (error) {
        console.error("Error unassigning batch from dealer:", error);
        throw error;
    }
};

/**
 * Assign a specific count of warranty codes from a batch to a dealer
 * Backend: POST /e-warranty/product-warranty-code/assign-partial-batch-dealer
 */
export const assignPartialBatchToDealer = async (groupId, dealerId, count) => {
    try {
        const response = await api.post("/e-warranty/product-warranty-code/assign-partial-batch-dealer", {
            group_id: groupId,
            dealer_id: dealerId,
            count: count
        });
        return response.data;
    } catch (error) {
        console.error("Error assigning partial batch to dealer:", error);
        throw error;
    }
};

/**
 * Unassign a specific count of warranty codes from a dealer in a batch
 * Backend: POST /e-warranty/product-warranty-code/unassign-partial-batch-dealer
 */
export const unassignPartialBatchFromDealer = async (groupId, dealerId, count) => {
    try {
        const response = await api.post("/e-warranty/product-warranty-code/unassign-partial-batch-dealer", {
            group_id: groupId,
            dealer_id: dealerId,
            count: count
        });
        return response.data;
    } catch (error) {
        console.error("Error unassigning partial batch from dealer:", error);
        throw error;
    }
};

/**
 * Get dealer assignment breakdown for a batch
 * Backend: GET /e-warranty/product-warranty-code/batch-dealer-assignments
 */
export const getBatchDealerAssignments = async (groupId) => {
    try {
        const response = await api.get("/e-warranty/product-warranty-code/batch-dealer-assignments", {
            params: { group_id: groupId }
        });
        return response.data?.data ?? response.data;
    } catch (error) {
        console.error("Error fetching batch dealer assignments:", error);
        throw error;
    }
};

/**
 * Generate a unique product ID
 * Backend: GET /e-warranty/product-warranty-code/generate-product-id
 */
export const generateProductId = async () => {
    try {
        const response = await api.get("/e-warranty/product-warranty-code/generate-product-id");
        return response.data;
    } catch (error) {
        console.error("Error generating product ID:", error);
        throw error;
    }
};

/**
 * Generate QR code for warranty
 * Backend: POST /e-warranty/product-warranty-code/generate-qr-code
 */
export const generateQRCode = async (data) => {
    try {
        const response = await api.post("/e-warranty/product-warranty-code/generate-qr-code", data);
        return response.data;
    } catch (error) {
        console.error("Error generating QR code:", error);
        throw error;
    }
};

/**
 * Update warranty codes by group
 * Backend: POST /e-warranty/product-warranty-code/update-product-warranty-code-by-group/:group_id
 */
export const updateWarrantyCodeByGroup = async (groupId, data) => {
    try {
        const response = await api.post(`/e-warranty/product-warranty-code/update-product-warranty-code-by-group/${groupId}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating warranty codes:", error);
        throw error;
    }
};

/**
 * Get warranty codes by group ID
 * Backend: GET /e-warranty/product-warranty-code/get-provider-warranty-code-by-group-id
 */
export const getWarrantyCodesByGroupId = async (groupId) => {
    try {
        const response = await api.get("/e-warranty/product-warranty-code/get-provider-warranty-code-by-group-id", {
            params: { group_id: groupId }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching warranty codes by group:", error);
        throw error;
    }
};

// ==============================
// WARRANTY SETTINGS ENDPOINTS
// ==============================

/**
 * Get provider warranty settings (authenticated - uses token, no ID needed)
 * Backend: GET /e-warranty/settings/get-provider-warranty-settings
 * Returns the settings object directly (id, certificate_template, registration_url, etc.)
 */
export const getWarrantySettings = async () => {
    try {
        const response = await api.get("/e-warranty/settings/get-provider-warranty-settings");
        const body = response?.data ?? {};
        const settings = body?.data ?? body;
        return settings && typeof settings === "object" && !Array.isArray(settings) ? settings : null;
    } catch (error) {
        console.error("Error fetching warranty settings:", error);
        throw error;
    }
};

/**
 * Create provider warranty settings
 * Backend: POST /e-warranty/settings/create-provider-warranty-settings
 */
export const createWarrantySettings = async (data) => {
    try {
        const response = await api.post("/e-warranty/settings/create-provider-warranty-settings", data);
        return response.data;
    } catch (error) {
        console.error("Error creating warranty settings:", error);
        throw error;
    }
};

/**
 * Update provider warranty settings
 * Backend: PUT /e-warranty/settings/update-provider-warranty-settings
 */
export const updateWarrantySettings = async (data) => {
    try {
        const response = await api.put("/e-warranty/settings/update-provider-warranty-settings", data);
        return response.data;
    } catch (error) {
        console.error("Error updating warranty settings:", error);
        throw error;
    }
};

/**
 * Preview warranty certificate template with sample data
 * Backend: POST /e-warranty/settings/preview-certificate-template
 * @param {string} templateId - "classic" | "modern" | "minimal" | "premium"
 * @returns {Promise<{data: string, templateId: string}>}
 */
export const previewCertificateTemplate = async (templateId = "classic") => {
    try {
        const response = await api.post("/e-warranty/settings/preview-certificate-template", {
            templateId: templateId || "classic",
        });
        const payload = response?.data?.data ?? response?.data;
        return { data: payload?.data, templateId: payload?.templateId || templateId };
    } catch (error) {
        console.error("Error previewing certificate template:", error);
        throw error;
    }
};

/**
 * Generate warranty report PDF (table format with Product Name, Warranty Code, Serial No, Dealer Name, Status)
 * Backend: POST /e-warranty/product-warranty-code/generate-report-pdf
 */
export const generateWarrantyReportPDF = async (data) => {
    try {
        const response = await api.post("/e-warranty/product-warranty-code/generate-report-pdf", data);
        return response.data;
    } catch (error) {
        console.error("Error generating warranty report PDF:", error);
        throw error;
    }
};
