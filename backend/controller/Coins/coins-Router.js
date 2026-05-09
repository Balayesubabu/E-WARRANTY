/**
 * Coins Router
 * 
 * Routes for coin operations:
 * - Balance management
 * - Transaction history
 * - Package purchases
 * - Referral system
 * - Profile bonus
 */

import { Router } from "express";
import { verifyLoginToken } from "../../middleware/verify-token.js";
import { checkSubscribedModule } from "../../middleware/check-subscribed-module.js";
import {
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
} from "./index.js";

const coinsRouter = Router();

// ═══════════════════════════════════════════════════════════════
// Balance & Transactions (Authenticated + Provider)
// checkSubscribedModule sets req.provider_id needed by these endpoints
// ═══════════════════════════════════════════════════════════════

// Get current coin balance
coinsRouter.get("/balance", verifyLoginToken, checkSubscribedModule, getBalanceEndpoint);

// Check if user has enough coins for an action
// Query: ?action=CREATE_DEALER&quantity=1
coinsRouter.get("/check-balance", verifyLoginToken, checkSubscribedModule, checkBalanceEndpoint);

// Check balance for warranty code generation (duration-based: 3mo=1, 6mo=2, 1yr=4 coins)
// Query: ?warranty_days=90&quantity=10 or ?warranty_days=365&warranty_period_readable=1 year&quantity=5
coinsRouter.get("/check-balance-for-warranty", verifyLoginToken, checkSubscribedModule, checkBalanceForWarrantyEndpoint);

// Get transaction history
// Query: ?page=1&limit=20&type=CREDIT|DEBIT&action=CREATE_DEALER
coinsRouter.get("/transactions", verifyLoginToken, checkSubscribedModule, getTransactionsEndpoint);

// ═══════════════════════════════════════════════════════════════
// Packages & Pricing (Public + Authenticated)
// ═══════════════════════════════════════════════════════════════

// Get available coin packages (public - for display on pricing page)
coinsRouter.get("/packages", getPackagesEndpoint);

// Get warranty costs by duration (public - 3mo, 6mo, 12mo coins)
coinsRouter.get("/warranty-costs", getWarrantyCostsEndpoint);

// Get action costs (authenticated - to show what costs coins)
coinsRouter.get("/action-costs", verifyLoginToken, checkSubscribedModule, getActionCostsEndpoint);

// ═══════════════════════════════════════════════════════════════
// Purchase Flow (Authenticated + Provider)
// ═══════════════════════════════════════════════════════════════

// Create Razorpay order for package purchase (legacy)
coinsRouter.post("/create-order", verifyLoginToken, checkSubscribedModule, createOrderEndpoint);

// Verify payment and credit coins (legacy)
coinsRouter.post("/verify-payment", verifyLoginToken, checkSubscribedModule, verifyPaymentEndpoint);

// ═══════════════════════════════════════════════════════════════
// Simplified Wallet - Custom Amount Purchase (1 Rupee = 1 Coin)
// ═══════════════════════════════════════════════════════════════

// Create Razorpay order for custom amount (wallet topup)
coinsRouter.post("/create-custom-order", verifyLoginToken, checkSubscribedModule, createCustomOrderEndpoint);

// Verify custom payment and credit coins
coinsRouter.post("/verify-custom-payment", verifyLoginToken, checkSubscribedModule, verifyCustomPaymentEndpoint);

// ═══════════════════════════════════════════════════════════════
// Referral System (Authenticated + Provider)
// ═══════════════════════════════════════════════════════════════

// Get or generate referral code
coinsRouter.get("/referral-code", verifyLoginToken, checkSubscribedModule, getReferralCodeEndpoint);

// ═══════════════════════════════════════════════════════════════
// Bonuses (Authenticated + Provider)
// ═══════════════════════════════════════════════════════════════

// Claim profile completion bonus
coinsRouter.post("/profile-bonus", verifyLoginToken, checkSubscribedModule, claimProfileBonusEndpoint);

export { coinsRouter };
