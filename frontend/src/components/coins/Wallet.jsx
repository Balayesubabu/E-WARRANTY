/**
 * Wallet Page
 * Add Ecredits via Razorpay. 1 Ecredit = 10¢ | Warranty: 3mo=1, 6mo=2, 1yr=4 Ecredits per product.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
    Wallet as WalletIcon,
    Coins,
    Loader2,
    ArrowLeft,
    Lock,
    Plus,
    History,
    ShieldCheck,
    ChevronRight,
    Sparkles,
    Copy,
    Share2
} from "lucide-react";
import { toast } from "sonner";
import { getCoinBalance, createCustomCoinOrder, verifyCoinPayment, getReferralCode } from "../../services/coinService";
import { withRazorpayPaymentMethods, RAZORPAY_CHECKOUT_THEME } from "../../utils/razorpayCheckout";

const quickAmounts = [
    { coins: 100, usd: 10 },
    { coins: 500, usd: 50 },
    { coins: 1000, usd: 100 },
    { coins: 2000, usd: 200 }
];

const WARRANTY_TIERS = [
    { label: "3 months", coins: 1, cents: "10¢" },
    { label: "6 months", coins: 2, cents: "20¢" },
    { label: "1 year", coins: 4, cents: "40¢" }
];

const Wallet = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [coins, setCoins] = useState("");
    const [purchasing, setPurchasing] = useState(false);
    const [referralCode, setReferralCode] = useState(null);

    useEffect(() => {
        fetchData();
        loadRazorpay();
    }, []);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [balanceData, referralData] = await Promise.all([
                getCoinBalance(),
                getReferralCode().catch((err) => {
                    console.warn("Referral code fetch failed:", err);
                    return null;
                })
            ]);
            setBalance(balanceData);
            setReferralCode(referralData);
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load wallet data");
        } finally {
            setLoading(false);
        }
    };

    const copyReferralCode = () => {
        if (referralCode?.code) {
            navigator.clipboard.writeText(referralCode.code);
            toast.success("Referral code copied!");
        }
    };

    const shareReferralLink = () => {
        if (referralCode?.referral_link) {
            if (navigator.share) {
                navigator.share({
                    title: "Join E-Warrantify",
                    text: `Use my referral code ${referralCode.code} to get started!`,
                    url: referralCode.referral_link
                });
            } else {
                navigator.clipboard.writeText(referralCode.referral_link);
                toast.success("Referral link copied!");
            }
        }
    };

    const handleQuickAmount = (value) => {
        setCoins(String(value));
    };

    const handleCoinsChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, "");
        setCoins(value);
    };

    const handlePurchase = async () => {
        const coinsValue = parseInt(coins, 10);
        
        if (!coinsValue || coinsValue < 10) {
            toast.error("Minimum purchase is 10 ecredits ($1)");
            return;
        }

        if (coinsValue > 10000) {
            toast.error("Maximum purchase is 10,000 ecredits ($1000)");
            return;
        }

        try {
            setPurchasing(true);
            
            const orderData = await createCustomCoinOrder(coinsValue);
            
            const options = withRazorpayPaymentMethods({
                key: orderData.razorpay_key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "E-Warrantify",
                description: `Add ${orderData.coins} Ecredits to wallet (1 Ecredit = 10¢)`,
                order_id: orderData.order_id,
                handler: async (response) => {
                    try {
                        const result = await verifyCoinPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            coins: orderData.coins
                        });
                        
                        toast.success(`Successfully added ${result.coins_added} ecredits!`);
                        setBalance(prev => ({
                            ...prev,
                            balance: result.new_balance
                        }));
                        window.dispatchEvent(new Event("coins-updated"));
                        setCoins("");
                        fetchData();
                    } catch (err) {
                        console.error("Payment verification failed:", err);
                        toast.error("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: "",
                    email: "",
                    contact: ""
                },
                theme: { ...RAZORPAY_CHECKOUT_THEME }
            });

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (err) {
            console.error("Purchase error:", err);
            toast.error(err.response?.data?.message || "Failed to initiate purchase");
        } finally {
            setPurchasing(false);
        }
    };

    const coinsToReceive = parseInt(coins, 10) || 0;
    const usdAmount = (coinsToReceive * 10) / 100; // 1 coin = 10 cents

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[420px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#1A7FC1]" />
                    <p className="text-slate-500 text-sm">Loading wallet...</p>
                </div>
            </div>
        );
    }

    const balanceVal = balance?.balance || 0;
    const balanceUsd = (balanceVal * 10) / 100;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 text-amber-600">
                                <WalletIcon className="w-6 h-6" />
                            </span>
                            My Wallet
                        </h1>
                        <p className="text-slate-500 mt-1">Add ecredits to power warranty generation</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate("/owner/coins")}
                    className="flex items-center gap-2 px-4 py-2.5 text-[#1A7FC1] hover:bg-blue-50 rounded-xl font-medium transition-colors border border-blue-200"
                >
                    <History className="w-5 h-5" />
                    Transaction History
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Balance Card - Option A: Light style to match right card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative overflow-hidden rounded-2xl border-2 border-blue-100 bg-linear-to-br from-blue-50/80 via-white to-slate-50/80 p-8 shadow-lg shadow-slate-200/60 border-l-4 border-l-[#1A7FC1]"
                >
                    <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 text-[#1A7FC1]">
                            <WalletIcon className="w-5 h-5" />
                        </span>
                        Current Balance
                    </h3>

                    {/* Balance box */}
                    <div className="mb-6 p-5 rounded-xl bg-white/80 border border-blue-100 shadow-sm">
                        <p className="text-sm text-slate-600 mb-1">Your balance</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-slate-800">{balanceVal.toLocaleString()}</span>
                            <span className="text-xl font-semibold text-slate-600">ecredits</span>
                        </div>
                        <p className="text-base text-slate-600 mt-1">${balanceUsd.toFixed(2)} USD</p>
                    </div>

                    {/* Warranty tiers - styled like right card sections */}
                    <p className="text-sm font-medium text-slate-600 mb-3">1 Ecredit = 10¢ · Warranty costs per product:</p>
                    <div className="space-y-2">
                        {WARRANTY_TIERS.map((tier) => (
                            <div
                                key={tier.label}
                                className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-sm"
                            >
                                <span className="text-slate-700 font-medium">{tier.label}</span>
                                <span className="text-slate-800 font-semibold">{tier.coins} Ecredit{tier.coins > 1 ? "s" : ""}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Right: Add Coins Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.08 }}
                    className="rounded-2xl border-2 border-blue-100 bg-linear-to-br from-blue-50/80 via-white to-slate-50/80 p-8 shadow-lg shadow-slate-200/60"
                >
                    <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 text-[#1A7FC1]">
                            <Plus className="w-5 h-5" />
                        </span>
                        Add Ecredits
                    </h3>

                    {/* Input */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Amount in ecredits
                        </label>
                        <div className="relative">
                            <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                            <input
                                type="text"
                                inputMode="numeric"
                                value={coins}
                                onChange={handleCoinsChange}
                                placeholder="e.g. 500"
                                className="w-full pl-12 pr-4 py-4 text-xl font-semibold border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1] transition-colors"
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500">Min 10 · Max 10,000 ecredits</p>
                    </div>

                    {/* Preview */}
                    <div className="mb-6 p-5 rounded-xl bg-white/80 border border-blue-100 shadow-sm">
                        <p className="text-sm text-slate-600 mb-1">You'll receive</p>
                        <p className="text-3xl font-bold text-slate-800">{coinsToReceive.toLocaleString()} ecredits</p>
                        <p className="text-base text-slate-600 mt-1">≈ ${usdAmount.toFixed(2)} USD</p>
                    </div>

                    {/* Quick Add */}
                    <div className="mb-6">
                        <p className="text-sm font-medium text-slate-600 mb-3">Quick add</p>
                        <div className="grid grid-cols-4 gap-2">
                            {quickAmounts.map(({ coins: val, usd }) => (
                                <button
                                    key={val}
                                    onClick={() => handleQuickAmount(val)}
                                    className={`py-3 px-3 rounded-xl font-semibold text-sm transition-all ${
                                        parseInt(coins, 10) === val
                                            ? "bg-[#1A7FC1] text-white shadow-md shadow-[#1A7FC1]/30 ring-2 ring-[#1A7FC1]/50"
                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    }`}
                                >
                                    <span className="block">{val}</span>
                                    <span className={`block text-xs mt-0.5 ${parseInt(coins, 10) === val ? "text-blue-100" : "text-slate-500"}`}>
                                        ${usd}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={handlePurchase}
                        disabled={purchasing || !coins || parseInt(coins, 10) < 10}
                        className="w-full py-4 bg-[#1A7FC1] text-white rounded-xl font-semibold hover:bg-[#166EA8] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-[#1A7FC1]/25"
                    >
                        {purchasing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Pay with Razorpay"
                        )}
                    </button>

                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600">
                        <Lock className="w-4 h-4 text-slate-500" />
                        <span>100% secure payment</span>
                        <ShieldCheck className="w-4 h-4 text-[#1A7FC1]" />
                    </div>
                </motion.div>
            </div>

            {/* Earn Free Ecredits - Referral Section */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12 }}
                className="mt-8 rounded-2xl border-2 border-[#A8D4F0] bg-linear-to-br from-[#E8F4FC] to-[#D6EDFA] p-8 shadow-lg shadow-slate-200/40"
            >
                <h3 className="text-xl font-semibold text-[#1A7FC1] mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#1A7FC1]/10 text-[#1A7FC1]">
                        <Sparkles className="w-5 h-5" />
                    </span>
                    Earn Free Ecredits
                </h3>
                <p className="text-slate-700 mb-6">
                    Refer friends and earn <strong className="text-[#1A7FC1]">15 ecredits</strong> when they sign up with your code.
                </p>

                {referralCode ? (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex-1 min-w-[200px] p-4 rounded-xl bg-white border border-[#A8D4F0] shadow-sm">
                                <p className="text-xs text-[#1A7FC1] mb-1 font-medium">Your Referral Code</p>
                                <p className="text-2xl font-bold text-slate-800">{referralCode.code}</p>
                            </div>
                            <button
                                onClick={copyReferralCode}
                                className="p-4 bg-white rounded-xl border border-[#A8D4F0] hover:bg-[#E8F4FC] transition-colors shadow-sm"
                                title="Copy code"
                            >
                                <Copy className="w-5 h-5 text-[#1A7FC1]" />
                            </button>
                            <button
                                onClick={shareReferralLink}
                                className="p-4 bg-[#1A7FC1] text-white rounded-xl hover:bg-[#166EA8] transition-colors shadow-sm"
                                title="Share link"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-600">
                            {referralCode.uses_count} people have used your code
                        </p>
                    </div>
                ) : (
                    <p className="text-slate-600 text-sm">Unable to load referral code. Please refresh the page.</p>
                )}
            </motion.div>
        </div>
    );
};

export default Wallet;
