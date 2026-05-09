import api from "../utils/api";

/**
 * Send OTP to a warranty customer by email or phone
 * Backend: POST /e-warranty/warranty-customer/generate-customer-warranty-otp
 * 
 * @param {string} contact - Email or phone number
 * @param {boolean} isActivation - If true, skips existing warranty check (for new customer QR activation)
 */
export const sendWarrantyOTP = async (contact, isActivation = false) => {
    try {
        const response = await api.post("/e-warranty/warranty-customer/generate-customer-warranty-otp", {
            contact,
            is_activation: isActivation,
        });
        return response.data;
    } catch (error) {
        console.error("Error sending warranty OTP:", error);
        throw error;
    }
};

/**
 * Verify OTP for a warranty customer
 * Backend: POST /e-warranty/warranty-customer/verify-customer-warranty-otp
 * 
 * @param {string} contact - Email or phone number
 * @param {string} otp - The OTP to verify
 * @param {boolean} isActivation - If true, verifying for new warranty activation (QR code flow)
 */
export const verifyWarrantyOTP = async (contact, otp, isActivation = false) => {
    try {
        const response = await api.post("/e-warranty/warranty-customer/verify-customer-warranty-otp", {
            contact,
            otp,
            is_activation: isActivation,
        });
        return response.data;
    } catch (error) {
        console.error("Error verifying warranty OTP:", error);
        throw error;
    }
};

/**
 * Validate a warranty roll code against a provider
 * Backend: POST /e-warranty/warranty-customer/validate-roll-code
 */
export const validateWarrantyCode = async (warrantyCode, providerId) => {
    try {
        const response = await api.post("/e-warranty/warranty-customer/validate-roll-code", {
            roll_code: warrantyCode,
            provider_id: providerId,
        });
        return response.data;
    } catch (error) {
        console.error("Error validating warranty code:", error);
        throw error;
    }
};

/**
 * Get all provider names (for customer dropdown on verify page)
 * Backend: GET /e-warranty/warranty-customer/get-all-provider-names
 */
export const getAllProviderNames = async () => {
    try {
        const response = await api.get("/e-warranty/warranty-customer/get-all-provider-names");
        return response.data;
    } catch (error) {
        console.error("Error fetching provider names:", error);
        throw error;
    }
};

/**
 * Get warranty settings by provider ID (public endpoint, no auth needed)
 * Backend: GET /e-warranty/settings/get-provider-warranty-settings/:provider_id
 */
export const getWarrantySettingsByProviderId = async (providerId) => {
    try {
        const response = await api.get(`/e-warranty/settings/get-provider-warranty-settings/${providerId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching warranty settings by provider ID:", error);
        throw error;
    }
};

/**
 * Get available (Inactive) warranty codes for a provider (public, no auth needed)
 * Backend: GET /e-warranty/product-warranty-code/available-warranty-codes/:provider_id
 */
export const getAvailableWarrantyCodes = async (providerId) => {
    try {
        const response = await api.get(`/e-warranty/product-warranty-code/available-warranty-codes/${providerId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching available warranty codes:", error);
        throw error;
    }
};

/**
 * Get available (Inactive) warranty codes for a provider and selected dealer.
 * Backend: GET /e-warranty/product-warranty-code/available-warranty-codes/:provider_id?dealer_id=...
 */
export const getAvailableWarrantyCodesByDealer = async (providerId, dealerId) => {
    try {
        const response = await api.get(`/e-warranty/product-warranty-code/available-warranty-codes/${providerId}`, {
            params: { dealer_id: dealerId }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching dealer-assigned available warranty codes:", error);
        throw error;
    }
};

/**
 * Dealer-auth endpoint to fetch only the logged-in dealer's assigned available codes.
 * Backend: GET /e-warranty/product-warranty-code/available-warranty-codes-for-dealer
 */
export const getDealerAssignedAvailableWarrantyCodes = async () => {
    try {
        const response = await api.get("/e-warranty/product-warranty-code/available-warranty-codes-for-dealer");
        return response.data;
    } catch (error) {
        console.error("Error fetching dealer assigned available warranty codes:", error);
        throw error;
    }
};

/**
 * Get dealers for a provider (public, no auth needed)
 * Backend: GET /e-warranty/dealer/:provider_id
 */
export const getDealersByProviderId = async (providerId) => {
    try {
        const response = await api.get(`/e-warranty/dealer/${providerId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching dealers by provider:", error);
        throw error;
    }
};

/**
 * Register customer warranty (public, no auth needed)
 * Backend: POST /e-warranty/warranty-customer/register-customer-warranty
 */
export const registerCustomerWarranty = async (data) => {
    try {
        const response = await api.post("/e-warranty/warranty-customer/register-customer-warranty", data);
        return response.data;
    } catch (error) {
        console.error("Error registering customer warranty:", error);
        throw error;
    }
};

/**
 * Verify warranty by code (public, no auth needed)
 * Real-world flow: Enter warranty code → get validity, status, product, expiry
 * Backend: GET/POST /e-warranty/product-warranty-code/verify-by-code
 */
export const verifyByWarrantyCode = async (code) => {
    try {
        const response = await api.get("/e-warranty/product-warranty-code/verify-by-code", {
            params: { code: (code || "").trim() },
        });
        return response.data;
    } catch (error) {
        console.error("Error verifying warranty by code:", error);
        throw error;
    }
};

/**
 * Look up warranty code for registration (public, no auth needed)
 * Used when QR doesn't work - customer enters code manually.
 * Backend: GET /e-warranty/product-warranty-code/lookup-by-code-for-registration?code=...
 */
export const lookupWarrantyCodeForRegistration = async (code) => {
    try {
        const response = await api.get("/e-warranty/product-warranty-code/lookup-by-code-for-registration", {
            params: { code: (code || "").trim() },
        });
        return response.data;
    } catch (error) {
        console.error("Error looking up warranty code:", error);
        throw error;
    }
};

/**
 * Look up warranty code by product name and/or serial number (public, no auth).
 * Used when customer can't scan QR or read warranty code.
 * Backend: GET /e-warranty/product-warranty-code/lookup-by-product-serial
 */
export const lookupByProductSerial = async (productName, serialNo) => {
    try {
        const params = {};
        if (productName?.trim()) params.product_name = productName.trim();
        if (serialNo?.trim()) params.serial_no = serialNo.trim();
        if (Object.keys(params).length === 0) {
            throw new Error("Product name or serial number is required");
        }
        const response = await api.get("/e-warranty/product-warranty-code/lookup-by-product-serial", { params });
        return response.data;
    } catch (error) {
        console.error("Error looking up by product/serial:", error);
        throw error;
    }
};

/**
 * Check if contact is an existing customer for this activation.
 * If yes, skip OTP and pre-fill form with their saved data.
 * Backend: POST /e-warranty/warranty-customer/check-existing-for-activation
 */
export const checkExistingForActivation = async (activationToken, contact) => {
    try {
        const response = await api.post("/e-warranty/warranty-customer/check-existing-for-activation", {
            activation_token: activationToken,
            contact: (contact || "").trim(),
        });
        return response.data;
    } catch (error) {
        console.error("Error checking existing customer:", error);
        throw error;
    }
};

/**
 * Resolve an activation token from a QR code scan (public, no auth needed)
 * Backend: GET /e-warranty/product-warranty-code/resolve/:token
 */
export const resolveActivationToken = async (token) => {
    try {
        const response = await api.get(`/e-warranty/product-warranty-code/resolve/${token}`);
        return response.data;
    } catch (error) {
        console.error("Error resolving activation token:", error);
        throw error;
    }
};
