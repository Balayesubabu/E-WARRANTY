/**
 * Coin Service
 * 
 * Frontend service for coin-related API calls:
 * - Balance management
 * - Transaction history
 * - Package purchases
 * - Referral system
 */

import api from "../utils/api";

// ═══════════════════════════════════════════════════════════════
// Balance Operations
// ═══════════════════════════════════════════════════════════════

/**
 * Get current coin balance
 * @returns {Promise<Object>} Balance info with minimum requirement
 */
export const getCoinBalance = async () => {
    const response = await api.get("/coins/balance");
    return response.data?.data ?? response.data;
};

/**
 * Check if user can perform a specific action
 * @param {string} action - Action type (e.g., "CREATE_DEALER")
 * @param {number} quantity - Number of items (default 1)
 * @returns {Promise<Object>} Balance check result
 */
export const checkCoinBalance = async (action, quantity = 1) => {
    const response = await api.get("/coins/check-balance", {
        params: { action, quantity }
    });
    return response.data?.data ?? response.data;
};

/**
 * Check balance for warranty code generation (duration-based: 3mo=1, 6mo=2, 1yr=4 coins per code)
 * @param {number} warrantyDays - Warranty duration in days
 * @param {number} quantity - Number of codes
 * @param {string} [warrantyPeriodReadable] - e.g. "3 months", "1 year"
 * @returns {Promise<Object>} Balance check result
 */
export const checkCoinBalanceForWarranty = async (warrantyDays, quantity = 1, warrantyPeriodReadable = "") => {
    const params = { warranty_days: warrantyDays, quantity };
    if (warrantyPeriodReadable) params.warranty_period_readable = warrantyPeriodReadable;
    const response = await api.get("/coins/check-balance-for-warranty", { params });
    return response.data?.data ?? response.data;
};

// ═══════════════════════════════════════════════════════════════
// Transaction History
// ═══════════════════════════════════════════════════════════════

/**
 * Get transaction history
 * @param {Object} options - Pagination and filter options
 * @param {number} options.page - Page number (default 1)
 * @param {number} options.limit - Items per page (default 20)
 * @param {string} options.type - Filter by type: "CREDIT" or "DEBIT"
 * @param {string} options.action - Filter by action type
 * @returns {Promise<Object>} Transactions with pagination
 */
export const getTransactionHistory = async (options = {}) => {
    const { page = 1, limit = 20, type, action } = options;
    const params = { page, limit };
    if (type) params.type = type;
    if (action) params.action = action;
    
    const response = await api.get("/coins/transactions", { params });
    return response.data?.data ?? response.data;
};

// ═══════════════════════════════════════════════════════════════
// Packages & Pricing
// ═══════════════════════════════════════════════════════════════

/**
 * Get available coin packages
 * @returns {Promise<Object>} List of packages with pricing
 */
export const getCoinPackages = async () => {
    const response = await api.get("/coins/packages");
    return response.data?.data ?? response.data;
};

/**
 * Get warranty costs by duration (3mo, 6mo, 12mo) - public
 */
export const getWarrantyCosts = async () => {
    const response = await api.get("/coins/warranty-costs");
    return response.data?.data ?? response.data;
};

/**
 * Get action costs (what costs coins)
 * @returns {Promise<Object>} List of actions with their coin costs
 */
export const getActionCosts = async () => {
    const response = await api.get("/coins/action-costs");
    return response.data?.data ?? response.data;
};

// ═══════════════════════════════════════════════════════════════
// Purchase Flow (Legacy - Package Based)
// ═══════════════════════════════════════════════════════════════

/**
 * Create Razorpay order for package purchase
 * @param {string} packageId - Package ID to purchase
 * @returns {Promise<Object>} Razorpay order details
 */
export const createCoinOrder = async (packageId) => {
    const response = await api.post("/coins/create-order", {
        package_id: packageId
    });
    return response.data?.data ?? response.data;
};

/**
 * Verify payment and credit coins
 * @param {Object} paymentDetails - Razorpay payment details
 * @param {string} paymentDetails.razorpay_order_id - Order ID
 * @param {string} paymentDetails.razorpay_payment_id - Payment ID
 * @param {string} paymentDetails.razorpay_signature - Signature
 * @param {string} paymentDetails.package_id - Package ID (optional for package purchase)
 * @param {number} paymentDetails.coins - Coins purchased (for custom wallet topup)
 * @param {number} paymentDetails.amount - Legacy: amount in INR (fallback)
 * @returns {Promise<Object>} Purchase result with new balance
 */
export const verifyCoinPayment = async (paymentDetails) => {
    if (paymentDetails.coins || paymentDetails.amount) {
        const response = await api.post("/coins/verify-custom-payment", paymentDetails);
        return response.data?.data ?? response.data;
    }
    const response = await api.post("/coins/verify-payment", paymentDetails);
    return response.data?.data ?? response.data;
};

// ═══════════════════════════════════════════════════════════════
// Simplified Wallet - Coin Purchase (1 Coin = 10 cents USD)
// ═══════════════════════════════════════════════════════════════

/**
 * Create order for coin purchase
 * 1 coin = 10 cents ($0.10)
 * @param {number} coins - Number of coins to purchase (min 10)
 * @returns {Promise<Object>} Order details (razorpay_key, order_id, amount, coins)
 */
export const createCustomCoinOrder = async (coins) => {
    const response = await api.post("/coins/create-custom-order", { coins: parseInt(coins, 10) });
    return response.data?.data ?? response.data;
};

// ═══════════════════════════════════════════════════════════════
// Referral System
// ═══════════════════════════════════════════════════════════════

/**
 * Get or generate referral code
 * @returns {Promise<Object>} Referral code info with link
 */
export const getReferralCode = async () => {
    const response = await api.get("/coins/referral-code");
    return response.data?.data ?? response.data;
};

// ═══════════════════════════════════════════════════════════════
// Bonuses
// ═══════════════════════════════════════════════════════════════

/**
 * Claim profile completion bonus
 * @returns {Promise<Object>} Bonus result with new balance
 */
export const claimProfileBonus = async () => {
    const response = await api.post("/coins/profile-bonus");
    return response.data?.data ?? response.data;
};

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Format coin amount for display
 * @param {number} amount - Coin amount
 * @returns {string} Formatted amount
 */
export const formatCoins = (amount) => {
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
};

/**
 * Get action display name
 * @param {string} action - Action type
 * @returns {string} Human-readable action name
 */
export const getActionDisplayName = (action) => {
    const names = {
        PROFILE_COMPLETE: "Profile Completion Bonus",
        REFERRAL_SIGNUP: "Referral Signup Bonus",
        REFERRAL_PURCHASE: "Referral Purchase Bonus",
        PURCHASE_PACKAGE: "Coin Package Purchase",
        ADMIN_CREDIT: "Admin Credit",
        PROMOTIONAL: "Promotional Bonus",
        CREATE_DEALER: "Create Dealer",
        ADD_PRODUCT: "Add Product",
        GENERATE_WARRANTY_CODE: "Generate Warranty Code",
        GENERATE_QR_BATCH: "Generate QR Batch",
        SEND_SMS: "Send SMS",
        SEND_EMAIL: "Send Email",
        DOWNLOAD_REPORT: "Download Report",
        CREATE_STAFF: "Create Staff",
        ADMIN_DEBIT: "Admin Debit"
    };
    return names[action] || action.replace(/_/g, " ");
};
