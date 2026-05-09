/**
 * BuyCoins Page
 * 
 * Displays coin packages for purchase with Razorpay integration.
 * Shows:
 * - Current balance
 * - Available packages
 * - Action costs
 * - Referral code
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
    Coins, 
    Package, 
    Star, 
    Check, 
    Loader2, 
    ArrowLeft,
    Share2,
    Copy,
    Gift,
    Sparkles,
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { 
    getCoinBalance, 
    getCoinPackages, 
    getActionCosts,
    getReferralCode,
    createCoinOrder,
    verifyCoinPayment,
    formatCoins 
} from "../../services/coinService";
import { withRazorpayPaymentMethods, RAZORPAY_CHECKOUT_THEME } from "../../utils/razorpayCheckout";

const BuyCoins = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(null);
    const [packages, setPackages] = useState([]);
    const [actionCosts, setActionCosts] = useState([]);
    const [referralCode, setReferralCode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);

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
            const [balanceData, packagesData, costsData, referralData] = await Promise.all([
                getCoinBalance(),
                getCoinPackages(),
                getActionCosts(),
                getReferralCode()
            ]);
            setBalance(balanceData);
            setPackages(packagesData.packages || []);
            setActionCosts(costsData.costs || []);
            setReferralCode(referralData);
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load coin data");
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (pkg) => {
        if (String(pkg.id || "").startsWith("default-")) {
            toast.error("Coin packages not configured. Please contact support.");
            return;
        }
        try {
            setPurchasing(pkg.id);
            
            // Create order
            const orderData = await createCoinOrder(pkg.id);
            
            // Open Razorpay (card, UPI, netbanking, wallet, EMI — per Dashboard + eligibility)
            const options = withRazorpayPaymentMethods({
                key: orderData.razorpay_key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "E-Warrantify",
                description: `${orderData.package.name} - ${orderData.package.total_coins} Ecoins`,
                order_id: orderData.order_id,
                handler: async (response) => {
                    try {
                        const result = await verifyCoinPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            package_id: pkg.id
                        });
                        
                        toast.success(`Successfully added ${result.coins_added} ecoins!`);
                        setBalance(prev => ({
                            ...prev,
                            balance: result.new_balance
                        }));
                        window.dispatchEvent(new Event("coins-updated"));
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
            setPurchasing(null);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Buy Ecoins</h1>
                    <p className="text-slate-500">Purchase coin packages to continue using E-Warrantify</p>
                </div>
            </div>

            {/* Current Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-8 p-6 rounded-2xl ${
                    balance?.can_perform_actions 
                        ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
                        : "bg-gradient-to-r from-red-50 to-orange-50 border border-red-200"
                }`}
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-full ${
                            balance?.can_perform_actions ? "bg-amber-100" : "bg-red-100"
                        }`}>
                            <Coins className={`w-8 h-8 ${
                                balance?.can_perform_actions ? "text-amber-600" : "text-red-600"
                            }`} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Current Balance</p>
                            <p className={`text-3xl font-bold ${
                                balance?.can_perform_actions ? "text-amber-700" : "text-red-700"
                            }`}>
                                {formatCoins(balance?.balance || 0)} ecoins
                            </p>
                        </div>
                    </div>
                    
                    {!balance?.can_perform_actions && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-100 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <span className="text-sm text-red-700 font-medium">
                                Low balance! Minimum {balance?.minimum_required ?? 0} ecoins required.
                            </span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Packages Grid */}
            <div className="mb-12">
                <h2 className="text-xl font-semibold text-slate-800 mb-6">Choose a Package</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {packages.map((pkg, index) => (
                        <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative p-6 rounded-2xl border-2 transition-all hover:shadow-lg ${
                                pkg.is_popular 
                                    ? "border-[#1A7FC1] bg-gradient-to-b from-blue-50 to-white"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                        >
                            {/* Popular Badge */}
                            {pkg.is_popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="px-3 py-1 bg-[#1A7FC1] text-white text-xs font-semibold rounded-full flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current" />
                                        BEST VALUE
                                    </span>
                                </div>
                            )}

                            {/* Package Info */}
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800">{pkg.name}</h3>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold text-slate-900">₹{pkg.price}</span>
                                </div>
                            </div>

                            {/* Coins Info */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Base Ecoins</span>
                                    <span className="font-semibold text-slate-800">{pkg.coins}</span>
                                </div>
                                {pkg.bonus_coins > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                                        <span className="text-emerald-600 flex items-center gap-1">
                                            <Gift className="w-4 h-4" />
                                            Bonus
                                        </span>
                                        <span className="font-semibold text-emerald-700">+{pkg.bonus_coins}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                    <span className="text-amber-600 font-medium">Total</span>
                                    <span className="font-bold text-amber-700">{pkg.total_coins} ecoins</span>
                                </div>
                            </div>

                            {/* Price per coin */}
                            <p className="text-center text-sm text-slate-500 mb-4">
                                ₹{pkg.price_per_coin} per coin
                            </p>

                            {/* Buy Button */}
                            <button
                                onClick={() => handlePurchase(pkg)}
                                disabled={purchasing === pkg.id}
                                className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                                    pkg.is_popular
                                        ? "bg-[#1A7FC1] text-white hover:bg-[#166EA8]"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {purchasing === pkg.id ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Package className="w-5 h-5" />
                                        Buy Now
                                    </>
                                )}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Action Costs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* What costs ecoins */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 p-6"
                >
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Coins className="w-5 h-5 text-amber-500" />
                        What Costs Ecoins
                    </h3>
                    <div className="space-y-3">
                        {actionCosts.map((cost) => (
                            <div 
                                key={cost.action}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                            >
                                <span className="text-slate-600">{cost.description}</span>
                                <span className="font-semibold text-slate-800">
                                    {cost.cost} {cost.cost === 1 ? "ecoin" : "ecoins"}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Referral Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-br from-[#E8F4FC] to-[#D6EDFA] rounded-2xl border border-[#A8D4F0] p-6"
                >
                    <h3 className="text-lg font-semibold text-[#1A7FC1] mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#1A7FC1]" />
                        Earn Free Ecoins
                    </h3>
                    <p className="text-slate-700 mb-4">
                        Refer friends and earn <strong className="text-[#1A7FC1]">15 ecoins</strong> when they sign up with your code.
                    </p>
                    
                    {referralCode && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 p-3 bg-white rounded-lg border border-[#A8D4F0]">
                                    <p className="text-xs text-[#1A7FC1] mb-1">Your Referral Code</p>
                                    <p className="text-xl font-bold text-slate-800">{referralCode.code}</p>
                                </div>
                                <button
                                    onClick={copyReferralCode}
                                    className="p-3 bg-white rounded-lg border border-[#A8D4F0] hover:bg-[#E8F4FC] transition-colors"
                                    title="Copy code"
                                >
                                    <Copy className="w-5 h-5 text-[#1A7FC1]" />
                                </button>
                                <button
                                    onClick={shareReferralLink}
                                    className="p-3 bg-[#1A7FC1] text-white rounded-lg hover:bg-[#166EA8] transition-colors"
                                    title="Share link"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-slate-600">
                                {referralCode.uses_count} people have used your code
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* View History Link */}
            <div className="text-center">
                <button
                    onClick={() => navigate("/owner/coins")}
                    className="text-[#1A7FC1] hover:text-[#166EA8] font-medium"
                >
                    View Transaction History →
                </button>
            </div>
        </div>
    );
};

export default BuyCoins;
