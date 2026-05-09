/**
 * Coin Service
 * 
 * Handles all coin-related operations:
 * - Balance management (get, credit, debit)
 * - Transaction logging
 * - Profile completion bonus
 * - Referral bonuses
 * - Coin pricing/costs
 * 
 * MINIMUM_BALANCE_REQUIRED: 100 coins
 * - Users cannot perform paid actions if balance < 100
 */

import { 
    prisma, 
    ProviderCoinBalance, 
    CoinTransaction, 
    CoinPackage, 
    CoinPricing,
    WarrantyCostConfig,
    ReferralCode,
    Referral,
    Provider,
} from "../prisma/db-models.js";
import { logger } from "./logger.js";

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const MINIMUM_BALANCE_REQUIRED = 0;  // No minimum balance required
const WELCOME_BONUS = 0;  // No welcome bonus (only profile completion bonus)
const PROFILE_COMPLETION_BONUS = 20;  // Given when profile is completed (20 coins = $2)
const REFERRAL_SIGNUP_BONUS = 15;  // Coins given to referrer when someone signs up with their code
const REFERRAL_PURCHASE_BONUS = 0;  // No bonus for first purchase

// 1 coin = 10 cents ($0.10) - USD based pricing; INR for Razorpay (see RUPEES_PER_COIN in .env)
const CENTS_PER_COIN = 10;
const RUPEES_PER_COIN = parseFloat(process.env.RUPEES_PER_COIN || "9.3");

// Fallback when DB has no warranty cost config (Super Admin editable in DB)
const WARRANTY_COST_FALLBACK = { 3: 1, 6: 2, 12: 4 };

// Everything except warranty codes is FREE
const DEFAULT_COIN_COSTS = {
    CREATE_DEALER: 0,           // FREE
    ADD_PRODUCT: 0,             // FREE
    GENERATE_WARRANTY_CODE: 4,  // Fallback: 1 year = 4 coins (use getWarrantyCodeCostByDuration)
    GENERATE_QR_BATCH: 4,       // Fallback
    SEND_SMS: 0,                // FREE
    SEND_EMAIL: 0,              // FREE
    DOWNLOAD_REPORT: 0,         // FREE
    CREATE_STAFF: 0,            // FREE
};

// ═══════════════════════════════════════════════════════════════
// Balance Operations
// ═══════════════════════════════════════════════════════════════

/**
 * Get or create coin balance for a provider
 * @param {string} provider_id - Provider ID
 * @returns {Object} ProviderCoinBalance record
 */
const getOrCreateBalance = async (provider_id) => {
    let balance = await ProviderCoinBalance.findUnique({
        where: { provider_id }
    });

    if (!balance) {
        balance = await ProviderCoinBalance.create({
            data: {
                provider_id,
                balance: 0,
                total_earned: 0,
                total_spent: 0,
                profile_bonus_given: false
            }
        });
        logger.info(`Created coin balance for provider: ${provider_id}`);
    }

    return balance;
};

/**
 * Get provider's current coin balance
 * @param {string} provider_id - Provider ID
 * @returns {Object} Balance info with minimum requirement
 */
const getBalance = async (provider_id) => {
    const balance = await getOrCreateBalance(provider_id);
    
    return {
        balance: balance.balance,
        total_earned: balance.total_earned,
        total_spent: balance.total_spent,
        minimum_required: MINIMUM_BALANCE_REQUIRED,
        can_perform_actions: balance.balance >= MINIMUM_BALANCE_REQUIRED,
        shortfall: balance.balance < MINIMUM_BALANCE_REQUIRED 
            ? MINIMUM_BALANCE_REQUIRED - balance.balance 
            : 0
    };
};

/**
 * Check if provider has enough coins for an action
 * @param {string} provider_id - Provider ID
 * @param {string} action - Action type (e.g., "CREATE_DEALER")
 * @param {number} quantity - Number of items (default 1)
 * @returns {Object} { allowed: boolean, required: number, current: number, shortfall: number }
 */
const checkBalance = async (provider_id, action, quantity = 1) => {
    const balance = await getOrCreateBalance(provider_id);
    const cost = await getActionCost(action);
    const totalRequired = cost * quantity;
    
    const allowed = balance.balance >= MINIMUM_BALANCE_REQUIRED && 
                    balance.balance >= totalRequired;

    return {
        allowed,
        required: totalRequired,
        current: balance.balance,
        minimum_required: MINIMUM_BALANCE_REQUIRED,
        shortfall: allowed ? 0 : Math.max(
            MINIMUM_BALANCE_REQUIRED - balance.balance,
            totalRequired - balance.balance
        ),
        cost_per_item: cost,
        quantity
    };
};

// ═══════════════════════════════════════════════════════════════
// Credit Operations (Adding Coins)
// ═══════════════════════════════════════════════════════════════

/**
 * Credit coins to provider's balance
 * @param {string} provider_id - Provider ID
 * @param {number} amount - Coins to add (positive number)
 * @param {string} action - Action type (e.g., "PROFILE_COMPLETE")
 * @param {string} description - Human readable description
 * @param {Object} options - Optional: reference_id, reference_type, package_id, razorpay_order_id, razorpay_payment_id
 * @returns {Object} Transaction record and new balance
 */
const creditCoins = async (provider_id, amount, action, description, options = {}) => {
    if (amount <= 0) {
        throw new Error("Credit amount must be positive");
    }

    return await prisma.$transaction(async (tx) => {
        // Get or create balance
        let balance = await tx.providerCoinBalance.findUnique({
            where: { provider_id }
        });

        if (!balance) {
            balance = await tx.providerCoinBalance.create({
                data: {
                    provider_id,
                    balance: 0,
                    total_earned: 0,
                    total_spent: 0
                }
            });
        }

        // Update balance
        const newBalance = balance.balance + amount;
        const updatedBalance = await tx.providerCoinBalance.update({
            where: { provider_id },
            data: {
                balance: newBalance,
                total_earned: balance.total_earned + amount
            }
        });

        // Create transaction record
        const transaction = await tx.coinTransaction.create({
            data: {
                provider_id,
                balance_id: updatedBalance.id,
                type: "CREDIT",
                amount: amount,
                action: action,
                description: description,
                balance_after: newBalance,
                reference_id: options.reference_id || null,
                reference_type: options.reference_type || null,
                package_id: options.package_id || null,
                razorpay_order_id: options.razorpay_order_id || null,
                razorpay_payment_id: options.razorpay_payment_id || null
            }
        });

        logger.info(`Credited ${amount} coins to provider ${provider_id}. New balance: ${newBalance}`);

        return {
            transaction,
            new_balance: newBalance,
            total_earned: updatedBalance.total_earned
        };
    });
};

// ═══════════════════════════════════════════════════════════════
// Debit Operations (Deducting Coins)
// ═══════════════════════════════════════════════════════════════

/**
 * Debit coins from provider's balance
 * @param {string} provider_id - Provider ID
 * @param {number} amount - Coins to deduct (positive number)
 * @param {string} action - Action type (e.g., "CREATE_DEALER")
 * @param {string} description - Human readable description
 * @param {Object} options - Optional: reference_id, reference_type
 * @returns {Object} Transaction record and new balance
 * @throws {Error} If insufficient balance
 */
const debitCoins = async (provider_id, amount, action, description, options = {}) => {
    if (amount <= 0) {
        throw new Error("Debit amount must be positive");
    }

    return await prisma.$transaction(async (tx) => {
        const balance = await tx.providerCoinBalance.findUnique({
            where: { provider_id }
        });

        if (!balance) {
            throw new Error("Coin balance not found. Please complete profile setup first.");
        }

        if (balance.balance < MINIMUM_BALANCE_REQUIRED) {
            throw new Error(`Insufficient coins. Minimum ${MINIMUM_BALANCE_REQUIRED} coins required. Current: ${balance.balance}`);
        }

        if (balance.balance < amount) {
            throw new Error(`Insufficient coins. Required: ${amount}, Available: ${balance.balance}`);
        }

        // Update balance
        const newBalance = balance.balance - amount;
        const updatedBalance = await tx.providerCoinBalance.update({
            where: { provider_id },
            data: {
                balance: newBalance,
                total_spent: balance.total_spent + amount
            }
        });

        // Create transaction record
        const transaction = await tx.coinTransaction.create({
            data: {
                provider_id,
                balance_id: updatedBalance.id,
                type: "DEBIT",
                amount: amount,
                action: action,
                description: description,
                balance_after: newBalance,
                reference_id: options.reference_id || null,
                reference_type: options.reference_type || null
            }
        });

        logger.info(`Debited ${amount} coins from provider ${provider_id}. New balance: ${newBalance}`);

        return {
            transaction,
            new_balance: newBalance,
            total_spent: updatedBalance.total_spent
        };
    });
};

/**
 * Debit coins for a specific action with automatic cost lookup
 * @param {string} provider_id - Provider ID
 * @param {string} action - Action type
 * @param {string} description - Description
 * @param {number} quantity - Number of items (default 1)
 * @param {Object} options - Optional reference info
 * @returns {Object} Transaction result
 */
const debitForAction = async (provider_id, action, description, quantity = 1, options = {}) => {
    const cost = await getActionCost(action);
    const totalCost = cost * quantity;
    
    if (totalCost === 0) {
        logger.info(`Action ${action} is free, no coins debited`);
        return { transaction: null, new_balance: null, cost: 0 };
    }

    return await debitCoins(provider_id, totalCost, action, description, options);
};

// ═══════════════════════════════════════════════════════════════
// Pricing Operations
// ═══════════════════════════════════════════════════════════════

/**
 * Get warranty cost by duration from DB (Super Admin editable)
 * @returns {Promise<Object>} { 3: cost, 6: cost, 12: cost }
 */
const getWarrantyCostByMonthsFromDB = async () => {
    const rows = await WarrantyCostConfig.findMany();
    const map = {};
    for (const r of rows) {
        map[r.duration_months] = r.cost;
    }
    return {
        3: map[3] ?? WARRANTY_COST_FALLBACK[3],
        6: map[6] ?? WARRANTY_COST_FALLBACK[6],
        12: map[12] ?? WARRANTY_COST_FALLBACK[12],
    };
};

/**
 * Get warranty code cost by duration (proportional: 1 coin per 3 months)
 * Uses DB config for 3, 6, 12 month tiers; extends proportionally for longer durations.
 * e.g. 5 years 6 months (66 months) = 22 coins
 * @param {number} warrantyMonths - Warranty duration in months
 * @returns {Promise<number>} Cost in coins per product
 */
const getWarrantyCodeCostByDuration = async (warrantyMonths) => {
    const months = Math.max(1, Math.floor(Number(warrantyMonths) || 12));
    const costs = await getWarrantyCostByMonthsFromDB();
    // Proportional: 1 coin per 3 months (3mo=1, 6mo=2, 12mo=4, 66mo=22, etc.)
    const cost = Math.max(1, Math.ceil(months / 3));
    // For standard tiers, DB overrides; otherwise use proportional
    if (months <= 3) return costs[3] ?? cost;
    if (months <= 6) return costs[6] ?? cost;
    if (months <= 12) return costs[12] ?? cost;
    return cost;
};

/**
 * Parse warranty months from days or readable string
 * @param {number} warrantyDays - Warranty duration in days
 * @param {string} warrantyPeriodReadable - e.g. "3 months", "6 months", "1 year"
 * @returns {number} Warranty months
 */
const parseWarrantyMonths = (warrantyDays, warrantyPeriodReadable) => {
    // Prefer warranty_days when available (correctly handles custom durations e.g. "1 Year 3 Months", "5 Years 6 Months")
    if (warrantyDays != null && warrantyDays > 0) {
        const months = Math.max(1, Math.round(warrantyDays / 30));
        return months;
    }
    // Fallback: parse from readable label (when days not provided)
    if (warrantyPeriodReadable) {
        const s = String(warrantyPeriodReadable).toLowerCase();
        if (s.includes("3") && s.includes("month") && !s.includes("6") && !s.includes("year")) return 3;
        if (s.includes("6") && s.includes("month") && !s.includes("year")) return 6;
        if (s.includes("1") && (s.includes("year") || s.includes("12"))) return 12;
        if (s.includes("2") && (s.includes("year") || s.includes("24"))) return 24;
    }
    return 12; // Default to 1 year (4 coins)
};

/**
 * Check balance for warranty code generation (duration-based cost)
 * @param {string} provider_id - Provider ID
 * @param {number} warrantyMonths - Warranty duration in months
 * @param {number} quantity - Number of codes
 * @returns {Object} Balance check result
 */
const checkBalanceForWarranty = async (provider_id, warrantyMonths, quantity = 1) => {
    const balance = await getOrCreateBalance(provider_id);
    const costPerCode = await getWarrantyCodeCostByDuration(warrantyMonths);
    const totalRequired = costPerCode * quantity;

    const allowed = balance.balance >= MINIMUM_BALANCE_REQUIRED && balance.balance >= totalRequired;

    return {
        allowed,
        required: totalRequired,
        current: balance.balance,
        minimum_required: MINIMUM_BALANCE_REQUIRED,
        shortfall: allowed ? 0 : Math.max(
            MINIMUM_BALANCE_REQUIRED - balance.balance,
            totalRequired - balance.balance
        ),
        cost_per_item: costPerCode,
        quantity
    };
};

/**
 * Debit coins for warranty code generation (duration-based cost)
 * @param {string} provider_id - Provider ID
 * @param {number} warrantyMonths - Warranty duration in months
 * @param {number} quantity - Number of codes
 * @param {string} description - Description
 * @param {Object} options - Optional reference info
 * @returns {Object} Transaction result
 */
const debitForWarrantyCodes = async (provider_id, warrantyMonths, quantity, description, options = {}) => {
    const costPerCode = await getWarrantyCodeCostByDuration(warrantyMonths);
    const totalCost = costPerCode * quantity;

    if (totalCost === 0) {
        logger.info(`Warranty codes are free for ${warrantyMonths} months, no coins debited`);
        return { transaction: null, new_balance: null, cost: 0 };
    }

    return await debitCoins(provider_id, totalCost, "GENERATE_WARRANTY_CODE", description, options);
};

/**
 * Get cost for a specific action
 * @param {string} action - Action type
 * @returns {number} Cost in coins
 */
const getActionCost = async (action) => {
    // Try to get from database first
    const pricing = await CoinPricing.findUnique({
        where: { action }
    });

    if (pricing && pricing.is_active) {
        return pricing.cost;
    }

    // Fall back to default costs
    return DEFAULT_COIN_COSTS[action] || 0;
};

/**
 * Get all action costs (for display in UI)
 * @returns {Array} List of actions with their costs
 */
const getAllActionCosts = async () => {
    const dbPricing = await CoinPricing.findMany({
        where: { is_active: true }
    });

    const pricingMap = {};
    for (const p of dbPricing) {
        pricingMap[p.action] = p.cost;
    }

    // Merge with defaults, DB takes priority
    const allCosts = [];
    for (const [action, defaultCost] of Object.entries(DEFAULT_COIN_COSTS)) {
        allCosts.push({
            action,
            cost: pricingMap[action] !== undefined ? pricingMap[action] : defaultCost,
            description: getActionDescription(action)
        });
    }

    return allCosts;
};

/**
 * Get human-readable description for an action
 */
const getActionDescription = (action) => {
    const descriptions = {
        CREATE_DEALER: "Create a new dealer (FREE)",
        ADD_PRODUCT: "Add a new product (FREE)",
        GENERATE_WARRANTY_CODE: "Generate warranty code (1–4 coins based on duration: 3mo=1, 6mo=2, 1yr=4)",
        GENERATE_QR_BATCH: "Generate QR batch (1–4 coins per code by duration)",
        SEND_SMS: "Send SMS notification (FREE)",
        SEND_EMAIL: "Send email notification (FREE)",
        DOWNLOAD_REPORT: "Download a report (FREE)",
        CREATE_STAFF: "Create a new staff member (FREE)"
    };
    return descriptions[action] || action;
};

/**
 * Credit coins for purchase (1 coin = 10 cents USD)
 * @param {string} provider_id - Provider ID
 * @param {number} coins - Number of coins to credit
 * @param {Object} paymentRef - { stripe_payment_intent_id } or { razorpay_payment_id, razorpay_order_id }
 * @returns {Object} Purchase result
 */
const purchaseCoins = async (provider_id, coins, paymentRef = {}) => {
    const minCoins = 10;   // $1 minimum
    const maxCoins = 10000; // $1000 max

    if (coins < minCoins) {
        throw new Error(`Minimum purchase is ${minCoins} coins ($1)`);
    }

    if (coins > maxCoins) {
        throw new Error(`Maximum purchase is ${maxCoins} coins ($1000)`);
    }

    const refType = paymentRef.stripe_payment_intent_id ? "stripe" : "razorpay";
    const description = `Added ${coins} coins to wallet ($${(coins * CENTS_PER_COIN / 100).toFixed(2)})`;

    const result = await creditCoins(
        provider_id,
        coins,
        "PURCHASE_CUSTOM",
        description,
        {
            ...(paymentRef.stripe_payment_intent_id && {
                reference_id: paymentRef.stripe_payment_intent_id,
                reference_type: "stripe_payment"
            }),
            ...(paymentRef.razorpay_payment_id && {
                razorpay_payment_id: paymentRef.razorpay_payment_id,
                razorpay_order_id: paymentRef.razorpay_order_id,
                reference_type: "custom_purchase"
            })
        }
    );

    return {
        success: true,
        coins_added: coins,
        new_balance: result.new_balance
    };
};

/**
 * @deprecated Use purchaseCoins. Legacy: amount in INR, coins = floor(amount / RUPEES_PER_COIN)
 */
const purchaseCustomAmount = async (provider_id, amountINR, razorpay_payment_id, razorpay_order_id) => {
    const coins = Math.floor(amountINR / RUPEES_PER_COIN);
    if (coins < 1) throw new Error("Amount too small for any coins");
    return purchaseCoins(provider_id, coins, { razorpay_payment_id, razorpay_order_id });
};

// ═══════════════════════════════════════════════════════════════
// Welcome Bonus (on Signup)
// ═══════════════════════════════════════════════════════════════

/**
 * Give welcome bonus to new provider (one-time on signup)
 * @param {string} provider_id - Provider ID
 * @returns {Object} Result with bonus info
 */
const giveWelcomeBonus = async (provider_id) => {
    try {
        const balance = await getOrCreateBalance(provider_id);

        // Check if already has transactions (not a new user)
        const existingTransactions = await CoinTransaction.count({
            where: { provider_id }
        });

        if (existingTransactions > 0) {
            logger.info(`Welcome bonus skipped for ${provider_id} - already has transactions`);
            return {
                success: false,
                message: "Welcome bonus already given or user is not new",
                bonus: 0
            };
        }

        const result = await creditCoins(
            provider_id,
            WELCOME_BONUS,
            "WELCOME_BONUS",
            "Welcome bonus for joining E-Warrantify!"
        );

        logger.info(`Welcome bonus of ${WELCOME_BONUS} coins given to provider: ${provider_id}`);

        return {
            success: true,
            message: `Welcome! You received ${WELCOME_BONUS} coins to get started.`,
            bonus: WELCOME_BONUS,
            new_balance: result.new_balance
        };
    } catch (error) {
        logger.error(`Error giving welcome bonus: ${error.message}`);
        return {
            success: false,
            message: "Failed to give welcome bonus",
            bonus: 0
        };
    }
};

// ═══════════════════════════════════════════════════════════════
// Profile Completion Bonus
// ═══════════════════════════════════════════════════════════════

/**
 * Give profile completion bonus (one-time)
 * @param {string} provider_id - Provider ID
 * @returns {Object} Result with bonus info
 */
const giveProfileCompletionBonus = async (provider_id) => {
    const balance = await getOrCreateBalance(provider_id);

    if (balance.profile_bonus_given) {
        return {
            success: false,
            message: "Profile completion bonus already given",
            bonus: 0
        };
    }

    // Update flag and credit coins
    await ProviderCoinBalance.update({
        where: { provider_id },
        data: { profile_bonus_given: true }
    });

    const result = await creditCoins(
        provider_id,
        PROFILE_COMPLETION_BONUS,
        "PROFILE_COMPLETE",
        "Welcome bonus for completing profile setup"
    );

    return {
        success: true,
        message: `Congratulations! You received ${PROFILE_COMPLETION_BONUS} coins for completing your profile.`,
        bonus: PROFILE_COMPLETION_BONUS,
        new_balance: result.new_balance
    };
};

/**
 * Check if profile is complete enough to give bonus
 * @param {string} provider_id - Provider ID
 * @returns {Object} Completion status
 */
const checkProfileCompletion = async (provider_id) => {
    const provider = await Provider.findUnique({
        where: { id: provider_id },
        select: {
            company_name: true,
            company_address: true,
            company_logo: true,
            gst_number: true,
            post_code: true
        }
    });

    if (!provider) {
        return { complete: false, missing: ["provider not found"] };
    }

    const requiredFields = ["company_name", "company_address"];
    const missing = [];

    for (const field of requiredFields) {
        if (!provider[field] || provider[field].trim() === "") {
            missing.push(field);
        }
    }

    return {
        complete: missing.length === 0,
        missing
    };
};

// ═══════════════════════════════════════════════════════════════
// Referral System
// ═══════════════════════════════════════════════════════════════

/**
 * Generate or get referral code for a provider
 * @param {string} provider_id - Provider ID
 * @returns {Object} Referral code info
 */
const getOrCreateReferralCode = async (provider_id) => {
    let referralCode = await ReferralCode.findUnique({
        where: { provider_id }
    });

    if (!referralCode) {
        // Generate unique code
        const provider = await Provider.findUnique({
            where: { id: provider_id },
            select: { company_name: true }
        });

        const prefix = provider?.company_name
            ? provider.company_name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "")
            : "REF";
        
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code = `${prefix}${randomPart}`;

        referralCode = await ReferralCode.create({
            data: {
                provider_id,
                code,
                uses_count: 0,
                is_active: true
            }
        });
    }

    return {
        code: referralCode.code,
        uses_count: referralCode.uses_count,
        is_active: referralCode.is_active,
        referral_link: `https://ewarrantify.com/signup?ref=${referralCode.code}`
    };
};

/**
 * Apply referral code during signup
 * @param {string} new_provider_id - New provider who is signing up
 * @param {string} referral_code - Referral code used
 * @returns {Object} Result
 */
const applyReferralCode = async (new_provider_id, referral_code) => {
    if (!referral_code) {
        return { success: false, message: "No referral code provided" };
    }

    const codeRecord = await ReferralCode.findUnique({
        where: { code: referral_code.toUpperCase() }
    });

    if (!codeRecord) {
        return { success: false, message: "Invalid referral code" };
    }

    if (!codeRecord.is_active) {
        return { success: false, message: "Referral code is no longer active" };
    }

    if (codeRecord.provider_id === new_provider_id) {
        return { success: false, message: "Cannot use your own referral code" };
    }

    // Check if already referred
    const existingReferral = await Referral.findUnique({
        where: { referred_id: new_provider_id }
    });

    if (existingReferral) {
        return { success: false, message: "You have already been referred" };
    }

    // Create referral record
    await Referral.create({
        data: {
            referrer_id: codeRecord.provider_id,
            referred_id: new_provider_id,
            referral_code_id: codeRecord.id,
            signup_bonus_given: false,
            purchase_bonus_given: false
        }
    });

    // Update uses count
    await ReferralCode.update({
        where: { id: codeRecord.id },
        data: { uses_count: codeRecord.uses_count + 1 }
    });

    // Give signup bonus to referrer
    await creditCoins(
        codeRecord.provider_id,
        REFERRAL_SIGNUP_BONUS,
        "REFERRAL_SIGNUP",
        `Referral bonus: A new user signed up using your code`,
        { reference_id: new_provider_id, reference_type: "referral" }
    );

    // Mark signup bonus as given
    await Referral.update({
        where: { referred_id: new_provider_id },
        data: { 
            signup_bonus_given: true,
            signup_bonus_amount: REFERRAL_SIGNUP_BONUS
        }
    });

    logger.info(`Referral applied: ${codeRecord.provider_id} referred ${new_provider_id}`);

    return {
        success: true,
        message: "Referral code applied successfully",
        referrer_bonus: REFERRAL_SIGNUP_BONUS
    };
};

/**
 * Give referral purchase bonus (when referred user makes first purchase)
 * @param {string} referred_provider_id - Provider who made the purchase
 * @returns {Object} Result
 */
const giveReferralPurchaseBonus = async (referred_provider_id) => {
    const referral = await Referral.findUnique({
        where: { referred_id: referred_provider_id }
    });

    if (!referral) {
        return { success: false, message: "No referral found" };
    }

    if (referral.purchase_bonus_given) {
        return { success: false, message: "Purchase bonus already given" };
    }

    // Give bonus to referrer
    await creditCoins(
        referral.referrer_id,
        REFERRAL_PURCHASE_BONUS,
        "REFERRAL_PURCHASE",
        `Referral bonus: Your referred user made their first purchase`,
        { reference_id: referred_provider_id, reference_type: "referral" }
    );

    // Mark purchase bonus as given
    await Referral.update({
        where: { id: referral.id },
        data: { 
            purchase_bonus_given: true,
            purchase_bonus_amount: REFERRAL_PURCHASE_BONUS
        }
    });

    return {
        success: true,
        message: "Referral purchase bonus given",
        bonus: REFERRAL_PURCHASE_BONUS
    };
};

// ═══════════════════════════════════════════════════════════════
// Transaction History
// ═══════════════════════════════════════════════════════════════

/**
 * Get transaction history for a provider
 * @param {string} provider_id - Provider ID
 * @param {Object} options - Pagination and filters
 * @returns {Object} Transactions with pagination
 */
const getTransactionHistory = async (provider_id, options = {}) => {
    const {
        page = 1,
        limit = 20,
        type = null,  // "CREDIT" or "DEBIT"
        action = null,
        dateFrom = null,
        dateTo = null,
    } = options;

    const skip = (page - 1) * limit;

    const where = { provider_id };
    if (type) where.type = type;
    if (action) where.action = action;
    if (dateFrom || dateTo) {
        where.created_at = {};
        if (dateFrom) where.created_at.gte = dateFrom;
        if (dateTo) {
            const end = new Date(dateTo);
            end.setHours(23, 59, 59, 999);
            where.created_at.lte = end;
        }
    }

    const [transactions, total] = await Promise.all([
        CoinTransaction.findMany({
            where,
            orderBy: { created_at: "desc" },
            skip,
            take: limit,
            include: {
                package: {
                    select: { name: true, coins: true, bonus_coins: true }
                }
            }
        }),
        CoinTransaction.count({ where })
    ]);

    return {
        transactions: transactions.map(t => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            action: t.action,
            description: t.description,
            balance_after: t.balance_after,
            reference_type: t.reference_type,
            reference_id: t.reference_id,
            package: t.package,
            created_at: t.created_at
        })),
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit)
        }
    };
};

// ═══════════════════════════════════════════════════════════════
// Package Operations
// ═══════════════════════════════════════════════════════════════

/**
 * Get all available coin packages
 * @returns {Array} Active packages sorted by price
 */
const getAvailablePackages = async () => {
    return await CoinPackage.findMany({
        where: { 
            is_active: true,
            is_deleted: false
        },
        orderBy: { sort_order: "asc" }
    });
};

/**
 * Purchase a coin package
 * @param {string} provider_id - Provider ID
 * @param {string} package_id - Package ID
 * @param {string} razorpay_payment_id - Razorpay payment ID
 * @param {string} razorpay_order_id - Razorpay order ID
 * @returns {Object} Purchase result
 */
const purchasePackage = async (provider_id, package_id, razorpay_payment_id, razorpay_order_id) => {
    const pkg = await CoinPackage.findUnique({
        where: { id: package_id }
    });

    if (!pkg || !pkg.is_active || pkg.is_deleted) {
        throw new Error("Invalid or inactive package");
    }

    const totalCoins = pkg.coins + pkg.bonus_coins;

    const result = await creditCoins(
        provider_id,
        totalCoins,
        "PURCHASE_PACKAGE",
        `Purchased ${pkg.name} package (${pkg.coins} + ${pkg.bonus_coins} bonus coins)`,
        {
            package_id,
            razorpay_payment_id,
            razorpay_order_id,
            reference_type: "package"
        }
    );

    // Give referral purchase bonus if this is first purchase
    await giveReferralPurchaseBonus(provider_id);

    return {
        success: true,
        package: pkg,
        coins_added: totalCoins,
        new_balance: result.new_balance
    };
};

// ═══════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════

export {
    // Constants
    MINIMUM_BALANCE_REQUIRED,
    WELCOME_BONUS,
    PROFILE_COMPLETION_BONUS,
    CENTS_PER_COIN,
    getWarrantyCostByMonthsFromDB,
    REFERRAL_SIGNUP_BONUS,
    REFERRAL_PURCHASE_BONUS,
    DEFAULT_COIN_COSTS,
    
    // Balance operations
    getOrCreateBalance,
    getBalance,
    checkBalance,
    
    // Credit/Debit operations
    creditCoins,
    debitCoins,
    debitForAction,
    
    // Pricing
    getActionCost,
    getAllActionCosts,
    getWarrantyCodeCostByDuration,
    parseWarrantyMonths,
    checkBalanceForWarranty,
    debitForWarrantyCodes,
    
    // Welcome bonus
    giveWelcomeBonus,
    
    // Profile bonus
    giveProfileCompletionBonus,
    checkProfileCompletion,
    
    // Referral system
    getOrCreateReferralCode,
    applyReferralCode,
    giveReferralPurchaseBonus,
    
    // Transaction history
    getTransactionHistory,
    
    // Package operations
    getAvailablePackages,
    purchasePackage,
    purchaseCustomAmount,
    purchaseCoins
};
