/**
 * Coins Controller
 * 
 * API endpoints for coin operations:
 * - GET /coins/balance - Get current coin balance
 * - GET /coins/transactions - Get transaction history
 * - GET /coins/packages - Get available coin packages
 * - GET /coins/action-costs - Get costs for all actions
 * - POST /coins/purchase - Purchase a coin package (initiates Razorpay order)
 * - POST /coins/purchase-complete - Complete purchase after Razorpay payment
 * - GET /coins/referral-code - Get or generate referral code
 * - POST /coins/profile-bonus - Claim profile completion bonus
 */

import { StatusCodes } from "http-status-codes";
import { logger, returnResponse, returnError } from "../../services/logger.js";
import { 
    getBalance,
    checkBalance,
    checkBalanceForWarranty,
    parseWarrantyMonths,
    getTransactionHistory,
    getAvailablePackages,
    getAllActionCosts,
    getOrCreateReferralCode,
    giveProfileCompletionBonus,
    checkProfileCompletion,
    purchasePackage,
    purchaseCustomAmount,
    purchaseCoins,
    giveReferralPurchaseBonus,
    getWarrantyCostByMonthsFromDB,
    MINIMUM_BALANCE_REQUIRED,
    CENTS_PER_COIN
} from "../../services/coinService.js";
import { CoinPackage, Provider, CoinTransaction } from "../../prisma/db-models.js";
import { logPlatformActivity } from "../../services/platform-activity-service.js";
import Razorpay from "razorpay";

// Lazy-initialize Razorpay (to ensure env vars are loaded)
let razorpayInstance = null;

const getRazorpay = () => {
    if (!razorpayInstance) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay credentials not configured");
        }
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        logger.info("Razorpay initialized successfully");
    }
    return razorpayInstance;
};

// ═══════════════════════════════════════════════════════════════
// GET /coins/balance - Get current coin balance
// ═══════════════════════════════════════════════════════════════
const getBalanceEndpoint = async (req, res) => {
    try {
        const provider_id = req.provider_id;
        
        if (!provider_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID required");
        }

        const balance = await getBalance(provider_id);

        return returnResponse(res, StatusCodes.OK, "Coin balance retrieved", {
            ...balance,
            minimum_balance_message: balance.can_perform_actions 
                ? null 
                : `You need at least ${MINIMUM_BALANCE_REQUIRED} coins to perform actions. Buy coins to continue.`
        });
    } catch (error) {
        logger.error(`Get balance error: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET /coins/check-balance - Check if user can perform an action
// ═══════════════════════════════════════════════════════════════
const checkBalanceEndpoint = async (req, res) => {
    try {
        const provider_id = req.provider_id;
        const { action, quantity = 1 } = req.query;

        if (!provider_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID required");
        }

        if (!action) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Action parameter required");
        }

        const result = await checkBalance(provider_id, action, parseInt(quantity));

        return returnResponse(res, StatusCodes.OK, "Balance check completed", result);
    } catch (error) {
        logger.error(`Check balance error: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET /coins/check-balance-for-warranty - Duration-based balance check
// Query: ?warranty_days=90&quantity=10 or ?warranty_days=365&warranty_period_readable=1 year&quantity=5
// ═══════════════════════════════════════════════════════════════
const checkBalanceForWarrantyEndpoint = async (req, res) => {
    try {
        const provider_id = req.provider_id;
        const warranty_days = parseInt(req.query.warranty_days, 10);
        const warranty_period_readable = req.query.warranty_period_readable || "";
        const quantity = Math.max(1, parseInt(req.query.quantity, 10) || 1);

        if (!provider_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID required");
        }

        const warrantyMonths = parseWarrantyMonths(warranty_days, warranty_period_readable);
        const result = await checkBalanceForWarranty(provider_id, warrantyMonths, quantity);

        return returnResponse(res, StatusCodes.OK, "Balance check completed", result);
    } catch (error) {
        logger.error(`Check balance for warranty error: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET /coins/transactions - Get transaction history
// ═══════════════════════════════════════════════════════════════
const getTransactionsEndpoint = async (req, res) => {
    try {
        const provider_id = req.provider_id;
        const { page = 1, limit = 20, type, action } = req.query;

        if (!provider_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID required");
        }

        const result = await getTransactionHistory(provider_id, {
            page: parseInt(page),
            limit: parseInt(limit),
            type,
            action
        });

        return returnResponse(res, StatusCodes.OK, "Transaction history retrieved", result);
    } catch (error) {
        logger.error(`Get transactions error: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET /coins/packages - Get available coin packages
// ═══════════════════════════════════════════════════════════════
const getPackagesEndpoint = async (req, res) => {
    try {
        const packages = await getAvailablePackages();

        // If no packages exist, return default packages info
        if (packages.length === 0) {
            const defaultPackages = [
                { name: "Starter", coins: 500, bonus_coins: 0, price: 199, is_popular: false },
                { name: "Growth", coins: 2000, bonus_coins: 200, price: 699, is_popular: true },
                { name: "Business", coins: 5000, bonus_coins: 1000, price: 1499, is_popular: false },
                { name: "Enterprise", coins: 15000, bonus_coins: 5000, price: 3999, is_popular: false }
            ];
            return returnResponse(res, StatusCodes.OK, "Default packages (seed required)", {
                packages: defaultPackages.map((p, i) => ({
                    ...p,
                    id: `default-${i}`,
                    total_coins: p.coins + p.bonus_coins,
                    price_per_coin: (p.price / (p.coins + p.bonus_coins)).toFixed(2)
                })),
                seeded: false
            });
        }

        return returnResponse(res, StatusCodes.OK, "Coin packages retrieved", {
            packages: packages.map(p => ({
                ...p,
                total_coins: p.coins + p.bonus_coins,
                price_per_coin: (p.price / (p.coins + p.bonus_coins)).toFixed(2)
            })),
            seeded: true
        });
    } catch (error) {
        logger.error(`Get packages error: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET /coins/warranty-costs - Get warranty cost by duration (public)
// ═══════════════════════════════════════════════════════════════
const getWarrantyCostsEndpoint = async (req, res) => {
    try {
        const warrantyCostByMonths = await getWarrantyCostByMonthsFromDB();
        res.setHeader("Cache-Control", "no-store");
        return returnResponse(res, StatusCodes.OK, "Warranty costs retrieved", warrantyCostByMonths);
    } catch (error) {
        logger.error(`Get warranty costs error: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET /coins/action-costs - Get costs for all actions
// ═══════════════════════════════════════════════════════════════
const getActionCostsEndpoint = async (req, res) => {
    try {
        const costs = await getAllActionCosts();

        return returnResponse(res, StatusCodes.OK, "Action costs retrieved", {
            minimum_balance_required: MINIMUM_BALANCE_REQUIRED,
            costs
        });
    } catch (error) {
        logger.error(`Get action costs error: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

// ═══════════════════════════════════════════════════════════════
// POST /coins/create-order - Create Razorpay order for package purchase
// ═══════════════════════════════════════════════════════════════
const createOrderEndpoint = async (req, res) => {
    try {
        const provider_id = req.provider_id;
        const { package_id } = req.body;

        if (!provider_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID required");
        }

        if (!package_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Package ID required");
        }

        // Check if Razorpay is configured
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            logger.error("Razorpay credentials not configured");
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Payment gateway not configured. Please contact support.");
        }

        const pkg = await CoinPackage.findUnique({
            where: { id: package_id }
        });

        if (!pkg || !pkg.is_active || pkg.is_deleted) {
            return returnError(res, StatusCodes.NOT_FOUND, "Package not found or inactive");
        }

        // Create Razorpay order
        // Receipt must be <= 40 chars: "coin_" (5) + provider_id first 8 (8) + "_" (1) + timestamp (13) = 27 chars
        const receiptId = `coin_${provider_id.substring(0, 8)}_${Date.now()}`;
        
        const orderOptions = {
            amount: Math.round(pkg.price * 100), // Amount in paise
            currency: pkg.currency || "INR",
            receipt: receiptId,
            notes: {
                provider_id,
                package_id,
                package_name: pkg.name,
                coins: pkg.coins,
                bonus_coins: pkg.bonus_coins
            }
        };

        logger.info(`Creating Razorpay order: ${JSON.stringify(orderOptions)}`);

        const razorpay = getRazorpay();
        const order = await razorpay.orders.create(orderOptions);

        logger.info(`Razorpay order created: ${order.id}`);

        return returnResponse(res, StatusCodes.OK, "Order created", {
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            package: {
                id: pkg.id,
                name: pkg.name,
                coins: pkg.coins,
                bonus_coins: pkg.bonus_coins,
                total_coins: pkg.coins + pkg.bonus_coins,
                price: pkg.price
            },
            razorpay_key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        // Handle Razorpay-specific errors (they have error.error.description structure)
        const errorMessage = error?.error?.description || error?.description || error?.message || "Failed to create order";
        const errorCode = error?.error?.code || error?.code || "UNKNOWN";
        
        logger.error(`Create order error [${errorCode}]: ${errorMessage}`);
        logger.error(`Full error: ${JSON.stringify(error)}`);
        
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, errorMessage);
    }
};

// ═══════════════════════════════════════════════════════════════
// POST /coins/verify-payment - Verify Razorpay payment and credit coins
// ═══════════════════════════════════════════════════════════════
const verifyPaymentEndpoint = async (req, res) => {
    try {
        const provider_id = req.provider_id;
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            package_id 
        } = req.body;

        if (!provider_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID required");
        }

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !package_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Missing payment details");
        }

        // Verify signature
        const crypto = await import("crypto");
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Invalid payment signature");
        }

        // Credit coins
        const result = await purchasePackage(
            provider_id,
            package_id,
            razorpay_payment_id,
            razorpay_order_id
        );

        // Log for Super Admin notifications and activity logs
        try {
            const provider = await Provider.findFirst({ where: { id: provider_id }, select: { company_name: true } });
            await logPlatformActivity({
                actor_role: "provider",
                actor_id: provider_id,
                actor_name: provider?.company_name || null,
                action: "coins_purchased",
                target_entity_type: "provider",
                target_entity_id: provider_id,
                target_name: provider?.company_name || null,
                provider_id,
                details: { amount: result.coins_added, razorpay_payment_id, package_id },
            });
        } catch (logErr) {
            logger.warn(`Failed to log coins purchase: ${logErr?.message || logErr}`);
        }

        // ═══════════════════════════════════════════════════════════════
        // COINS: Give referral purchase bonus to referrer (if applicable)
        // This is the bonus given to the person who referred this user
        // when the referred user makes their first coin purchase
        // ═══════════════════════════════════════════════════════════════
        let referralBonusResult = null;
        try {
            referralBonusResult = await giveReferralPurchaseBonus(provider_id);
            if (referralBonusResult.success) {
                logger.info(`Referral purchase bonus given for provider ${provider_id}'s purchase`);
            }
        } catch (referralError) {
            logger.error(`Failed to process referral purchase bonus: ${referralError.message}`);
        }

        return returnResponse(res, StatusCodes.OK, "Payment verified and coins credited", {
            ...result,
            referral_bonus: referralBonusResult,
        });
    } catch (error) {
        logger.error(`Verify payment error: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

// ═══════════════════════════════════════════════════════════════
// GET /coins/referral-code - Get or generate referral code
// ═══════════════════════════════════════════════════════════════
const getReferralCodeEndpoint = async (req, res) => {
    try {
        const provider_id = req.provider_id;

        if (!provider_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID required");
        }

        const referralInfo = await getOrCreateReferralCode(provider_id);

        return returnResponse(res, StatusCodes.OK, "Referral code retrieved", referralInfo);
    } catch (error) {
        logger.error(`Get referral code error: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

// ═══════════════════════════════════════════════════════════════
// POST /coins/profile-bonus - Claim profile completion bonus
// ═══════════════════════════════════════════════════════════════
const claimProfileBonusEndpoint = async (req, res) => {
    try {
        const provider_id = req.provider_id;

        if (!provider_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID required");
        }

        // Check profile completion
        const completion = await checkProfileCompletion(provider_id);
        
        if (!completion.complete) {
            return returnError(
                res, 
                StatusCodes.BAD_REQUEST, 
                `Please complete your profile first. Missing: ${completion.missing.join(", ")}`
            );
        }

        // Give bonus
        const result = await giveProfileCompletionBonus(provider_id);

        if (!result.success) {
            return returnError(res, StatusCodes.BAD_REQUEST, result.message);
        }

        return returnResponse(res, StatusCodes.OK, result.message, {
            bonus: result.bonus,
            new_balance: result.new_balance
        });
    } catch (error) {
        logger.error(`Claim profile bonus error: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

// 1 coin = 10 cents. For Razorpay (INR): rupees per coin from env (default 9.3 ≈ 93 INR/USD)
const RUPEES_PER_COIN = parseFloat(process.env.RUPEES_PER_COIN || "9.3");
const MIN_LEGACY_INR_AMOUNT = Math.ceil(10 * RUPEES_PER_COIN);

// ═══════════════════════════════════════════════════════════════
// POST /coins/create-custom-order - Create order for coin purchase
// 1 coin = 10 cents USD. Accepts: { coins } (preferred) or { amount } (legacy INR)
// ═══════════════════════════════════════════════════════════════
const createCustomOrderEndpoint = async (req, res) => {
    try {
        const provider_id = req.provider_id;
        const { coins: coinsParam, amount: amountParam } = req.body;

        let coins;
        let amountPaise;
        let currency = "INR";

        if (coinsParam != null && coinsParam > 0) {
            coins = Math.floor(parseInt(coinsParam, 10) || 0);
            if (coins < 10) {
                return returnError(res, StatusCodes.BAD_REQUEST, "Minimum purchase is 10 coins ($1)");
            }
            if (coins > 10000) {
                return returnError(res, StatusCodes.BAD_REQUEST, "Maximum purchase is 10,000 coins ($1000)");
            }
            amountPaise = Math.ceil(coins * RUPEES_PER_COIN * 100);
        } else if (amountParam != null && amountParam >= MIN_LEGACY_INR_AMOUNT) {
            coins = Math.floor(parseInt(amountParam, 10) / RUPEES_PER_COIN);
            amountPaise = Math.round(amountParam * 100);
        } else {
            return returnError(
                res,
                StatusCodes.BAD_REQUEST,
                `Provide coins (min 10) or amount in INR (min ${MIN_LEGACY_INR_AMOUNT})`
            );
        }

        if (!provider_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID required");
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            logger.error("Razorpay credentials not configured");
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Payment gateway not configured. Please contact support.");
        }

        const receiptId = `wallet_${provider_id.substring(0, 8)}_${Date.now()}`;
        const orderOptions = {
            amount: amountPaise,
            currency,
            receipt: receiptId,
            notes: {
                provider_id,
                coins: String(coins),
                type: "custom_wallet_topup"
            }
        };

        logger.info(`Creating Razorpay order for ${coins} coins (1 coin = 10¢)`);

        const razorpay = getRazorpay();
        const order = await razorpay.orders.create(orderOptions);

        logger.info(`Custom Razorpay order created: ${order.id}`);

        return returnResponse(res, StatusCodes.OK, "Order created", {
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            coins,
            cents_per_coin: CENTS_PER_COIN,
            razorpay_key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        const errorMessage = error?.error?.description || error?.description || error?.message || "Failed to create order";
        const errorCode = error?.error?.code || error?.code || "UNKNOWN";
        
        logger.error(`Create custom order error [${errorCode}]: ${errorMessage}`);
        logger.error(`Full error: ${JSON.stringify(error)}`);
        
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, errorMessage);
    }
};

// ═══════════════════════════════════════════════════════════════
// POST /coins/verify-custom-payment - Verify Razorpay payment for custom amount
// ═══════════════════════════════════════════════════════════════
const verifyCustomPaymentEndpoint = async (req, res) => {
    try {
        const provider_id = req.provider_id;
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            amount,
            coins: coinsParam
        } = req.body;

        if (!provider_id) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Provider ID required");
        }

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Missing payment details");
        }

        const crypto = await import("crypto");
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return returnError(res, StatusCodes.BAD_REQUEST, "Invalid payment signature");
        }

        let result;
        if (coinsParam != null && coinsParam > 0) {
            const coins = parseInt(coinsParam, 10);
            result = await purchaseCoins(provider_id, coins, {
                razorpay_payment_id,
                razorpay_order_id
            });
            logger.info(`Custom payment verified: ${coins} coins for provider ${provider_id}`);
        } else {
            result = await purchaseCustomAmount(
                provider_id,
                parseInt(amount, 10) || 0,
                razorpay_payment_id,
                razorpay_order_id
            );
            logger.info(`Custom payment verified: ₹${amount} = ${result.coins_added} coins for provider ${provider_id}`);
        }

        // Log for Super Admin notifications and activity logs
        try {
            const provider = await Provider.findFirst({ where: { id: provider_id }, select: { company_name: true } });
            await logPlatformActivity({
                actor_role: "provider",
                actor_id: provider_id,
                actor_name: provider?.company_name || null,
                action: "coins_purchased",
                target_entity_type: "provider",
                target_entity_id: provider_id,
                target_name: provider?.company_name || null,
                provider_id,
                details: { amount: result.coins_added, razorpay_payment_id },
            });
        } catch (logErr) {
            logger.warn(`Failed to log coins purchase: ${logErr?.message || logErr}`);
        }

        return returnResponse(res, StatusCodes.OK, "Payment verified and coins credited", {
            ...result,
        });
    } catch (error) {
        logger.error(`Verify custom payment error: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

// ═══════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════
export {
    getBalanceEndpoint,
    checkBalanceEndpoint,
    checkBalanceForWarrantyEndpoint,
    getTransactionsEndpoint,
    getPackagesEndpoint,
    getWarrantyCostsEndpoint,
    getActionCostsEndpoint,
    createOrderEndpoint,
    verifyPaymentEndpoint,
    getReferralCodeEndpoint,
    claimProfileBonusEndpoint,
    createCustomOrderEndpoint,
    verifyCustomPaymentEndpoint
};
