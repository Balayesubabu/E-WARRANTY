/**
 * Buy Warranty Codes Page
 * 
 * Purchase warranty codes using coin balance.
 * Cost varies by warranty: 3mo=1 ecoin, 6mo=2 ecoins, 1yr=4 ecoins per product.
 * Uses 4 ecoins (1yr) as default for quantity estimate.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
    Ticket, 
    Coins, 
    Loader2, 
    ArrowLeft,
    Plus,
    Minus,
    ShoppingCart,
    AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { getCoinBalance } from "../../services/coinService";
import LowBalancePopup from "./LowBalancePopup";

// Cost varies: 3mo=1, 6mo=2, 1yr=4 ecoins per code
const MIN_COST = 1;
const MAX_COST = 4;

const BuyWarrantyCodes = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [showLowBalancePopup, setShowLowBalancePopup] = useState(false);
    const [purchasing, setPurchasing] = useState(false);

    const minCost = quantity * MIN_COST;
    const maxCost = quantity * MAX_COST;
    const maxCodes = Math.floor((balance?.balance || 0) / MIN_COST);
    const canAfford = (balance?.balance || 0) >= minCost;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const balanceData = await getCoinBalance();
            setBalance(balanceData);
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load balance data");
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value) || 1;
        setQuantity(Math.max(1, Math.min(1000, value)));
    };

    const incrementQuantity = () => {
        setQuantity(prev => Math.min(prev + 1, 1000));
    };

    const decrementQuantity = () => {
        setQuantity(prev => Math.max(prev - 1, 1));
    };

    const handlePurchase = async () => {
        if (!canAfford) {
            setShowLowBalancePopup(true);
            return;
        }

        try {
            setPurchasing(true);
            
            // Navigate to generate warranty codes page with the quantity
            // The actual deduction happens in the generate warranty codes endpoint
            navigate(`/owner/warranty-management?generate=${quantity}`);
            
            toast.success(`Proceeding to generate ${quantity} warranty codes`);
        } catch (err) {
            console.error("Purchase error:", err);
            toast.error("Failed to proceed. Please try again.");
        } finally {
            setPurchasing(false);
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
        <div className="max-w-2xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        Buy Warranty Codes <Ticket className="w-6 h-6 text-[#1A7FC1]" />
                    </h1>
                    <p className="text-slate-500">Purchase warranty codes using your coin balance</p>
                </div>
            </div>

            {/* Stats Row */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-4 mb-6"
            >
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-blue-600 mb-1">Price per Code</p>
                    <p className="text-xl font-bold text-blue-700">1–4 coins</p>
                    <p className="text-xs text-blue-600 mt-1">3mo=1, 6mo=2, 1yr=4</p>
                </div>
                <div className={`rounded-xl p-4 text-center ${
                    canAfford ? "bg-emerald-50" : "bg-red-50"
                }`}>
                    <p className={`text-sm mb-1 ${canAfford ? "text-emerald-600" : "text-red-600"}`}>
                        Your Balance
                    </p>
                    <p className={`text-xl font-bold ${canAfford ? "text-emerald-700" : "text-red-700"}`}>
                        {balance?.balance || 0} ecoins
                    </p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-amber-600 mb-1">You Can Buy</p>
                    <p className="text-xl font-bold text-amber-700">{maxCodes} codes</p>
                </div>
            </motion.div>

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 p-6"
            >
                {/* Quantity Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-600 mb-3">
                        Enter Quantity
                    </label>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={decrementQuantity}
                            disabled={quantity <= 1}
                            className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Minus className="w-5 h-5 text-slate-600" />
                        </button>
                        <input
                            type="number"
                            value={quantity}
                            onChange={handleQuantityChange}
                            min="1"
                            max="1000"
                            className="flex-1 text-center text-3xl font-bold py-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A7FC1] focus:border-transparent"
                        />
                        <button
                            onClick={incrementQuantity}
                            disabled={quantity >= 1000}
                            className="p-3 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Plus className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Calculation Display */}
                <div className="mb-6 p-6 bg-slate-50 rounded-xl">
                    <div className="flex flex-col items-center gap-2 text-lg font-bold text-slate-700">
                        <span>{quantity} code{quantity > 1 ? "s" : ""} × 1–4 ecoins =</span>
                        <span className={canAfford ? "text-emerald-600" : "text-red-600"}>
                            {minCost}–{maxCost} ecoins (based on warranty duration)
                        </span>
                    </div>
                    
                    {canAfford ? (
                        <p className="text-center text-sm text-slate-500 mt-3">
                            Balance: <span className="font-semibold">{(balance?.balance || 0).toLocaleString()} ecoins</span>
                        </p>
                    ) : (
                        <div className="flex items-center justify-center gap-2 mt-3 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            <p className="text-sm">
                                Need at least <span className="font-semibold">{minCost}</span> ecoins. You have {(balance?.balance || 0).toLocaleString()}.
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handlePurchase}
                        disabled={purchasing || quantity < 1}
                        className={`w-full py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                            canAfford
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-amber-500 text-white hover:bg-amber-600"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {purchasing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : canAfford ? (
                            <>
                                <Ticket className="w-5 h-5" />
                                Generate {quantity} Warranty Code{quantity > 1 ? "s" : ""}
                            </>
                        ) : (
                            <>
                                <Coins className="w-5 h-5" />
                                Add Coins to Continue
                            </>
                        )}
                    </button>

                    {!canAfford && (
                        <button
                            onClick={() => navigate("/owner/wallet")}
                            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                        >
                            Go to Wallet
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Quick Info */}
            <div className="mt-6 text-center text-sm text-slate-500">
                <p>1 ecoin = 10¢ · 3mo=1 ecoin, 6mo=2, 1yr=4 per product</p>
            </div>

            {/* Low Balance Popup */}
            <LowBalancePopup
                isOpen={showLowBalancePopup}
                onClose={() => setShowLowBalancePopup(false)}
                currentBalance={balance?.balance || 0}
                requiredAmount={minCost}
                quantity={quantity}
            />
        </div>
    );
};

export default BuyWarrantyCodes;
