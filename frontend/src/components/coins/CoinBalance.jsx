/**
 * CoinBalance Component
 * 
 * Displays coin balance in the header with:
 * - Current balance in ecoins
 * - Low balance indicator
 * - Add ecoins button (links to wallet)
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, AlertCircle, Plus } from "lucide-react";
import { getCoinBalance } from "../../services/coinService";

const CoinBalance = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBalance = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCoinBalance();
            setBalance(data);
            setError(null);
        } catch (err) {
            console.error("Error fetching balance:", err);
            setError("Failed to load");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    useEffect(() => {
        const onCoinsUpdated = () => {
            fetchBalance();
        };
        window.addEventListener("coins-updated", onCoinsUpdated);
        return () => window.removeEventListener("coins-updated", onCoinsUpdated);
    }, [fetchBalance]);

    if (loading) {
        return (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-100 rounded-lg animate-pulse">
                <Wallet className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs sm:text-sm text-slate-400">...</span>
            </div>
        );
    }

    if (error || !balance) {
        return null;
    }

    const coinBalance = balance.balance || 0;
    const isLowBalance = coinBalance < 100;

    return (
        <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Balance Display - compact on mobile (icon + number only), full on sm+ */}
            <div 
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg cursor-pointer transition-colors shrink-0 ${
                    isLowBalance 
                        ? "bg-red-50 hover:bg-red-100 border border-red-200" 
                        : "bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                }`}
                onClick={() => navigate("/owner/wallet")}
                title={isLowBalance ? "Low balance! Click to add ecoins" : `${coinBalance.toLocaleString()} ecoins - View wallet`}
            >
                <Wallet className={`w-4 h-4 shrink-0 ${isLowBalance ? "text-red-500" : "text-emerald-600"}`} />
                <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${isLowBalance ? "text-red-700" : "text-emerald-700"}`}>
                    {coinBalance.toLocaleString()}
                    <span className="hidden sm:inline ml-0.5">Ecredits</span>
                </span>
                {isLowBalance && (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                )}
            </div>

            {/* Add Ecoins Button - icon only on mobile, full on sm+ */}
            <button
                onClick={() => navigate("/owner/wallet")}
                title="Add ecoins"
                className="flex items-center justify-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#1A7FC1] text-white rounded-lg text-sm font-medium hover:bg-[#166EA8] transition-colors shrink-0 min-h-[32px] min-w-[32px] sm:min-w-0"
            >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Add Ecredits</span>
            </button>
        </div>
    );
};

export default CoinBalance;
