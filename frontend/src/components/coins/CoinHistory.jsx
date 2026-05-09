/**
 * CoinHistory Page
 * 
 * Displays transaction history with:
 * - Current balance
 * - Transaction list (credits and debits)
 * - Filters and pagination
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
    Coins, 
    ArrowUpRight, 
    ArrowDownRight,
    ArrowLeft,
    Plus,
    Filter,
    Loader2,
    Calendar,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { 
    getCoinBalance, 
    getTransactionHistory,
    formatCoins,
    getActionDisplayName
} from "../../services/coinService";

const CoinHistory = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [filter, setFilter] = useState({ type: null, page: 1 });

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(filter.page === 1);
            setLoadingMore(filter.page > 1);
            
            const [balanceData, historyData] = await Promise.all([
                getCoinBalance(),
                getTransactionHistory({ 
                    page: filter.page, 
                    limit: 20,
                    type: filter.type 
                })
            ]);
            
            setBalance(balanceData);
            
            if (filter.page === 1) {
                setTransactions(historyData.transactions || []);
            } else {
                setTransactions(prev => [...prev, ...(historyData.transactions || [])]);
            }
            setPagination(historyData.pagination);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleFilterChange = (type) => {
        setFilter({ type: type === filter.type ? null : type, page: 1 });
    };

    const loadMore = () => {
        if (pagination && filter.page < pagination.total_pages) {
            setFilter(prev => ({ ...prev, page: prev.page + 1 }));
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
        
        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
        });
    };

    if (loading && filter.page === 1) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Coin History</h1>
                        <p className="text-slate-500">Track your coin transactions</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate("/owner/buy-coins")}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1A7FC1] text-white rounded-lg font-medium hover:bg-[#166EA8] transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Buy Ecoins
                </button>
            </div>

            {/* Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Current Ecoins</p>
                        <p className="text-3xl font-bold text-amber-700">
                            {formatCoins(balance?.balance || 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Total Earned</p>
                        <p className="text-2xl font-semibold text-emerald-600">
                            +{formatCoins(balance?.total_earned || 0)}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Total Spent</p>
                        <p className="text-2xl font-semibold text-red-500">
                            -{formatCoins(balance?.total_spent || 0)}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-6">
                <Filter className="w-4 h-4 text-slate-400" />
                <button
                    onClick={() => handleFilterChange(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filter.type === null 
                            ? "bg-[#1A7FC1] text-white" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    All
                </button>
                <button
                    onClick={() => handleFilterChange("CREDIT")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                        filter.type === "CREDIT" 
                            ? "bg-emerald-500 text-white" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    <ArrowUpRight className="w-4 h-4" />
                    Credits
                </button>
                <button
                    onClick={() => handleFilterChange("DEBIT")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                        filter.type === "DEBIT" 
                            ? "bg-red-500 text-white" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    <ArrowDownRight className="w-4 h-4" />
                    Debits
                </button>
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {transactions.length === 0 ? (
                    <div className="p-12 text-center">
                        <Coins className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No transactions yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {transactions.map((tx, index) => (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="p-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon */}
                                    <div className={`p-2 rounded-full ${
                                        tx.type === "CREDIT" 
                                            ? "bg-emerald-100" 
                                            : "bg-red-100"
                                    }`}>
                                        {tx.type === "CREDIT" ? (
                                            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                                        ) : (
                                            <ArrowDownRight className="w-5 h-5 text-red-600" />
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 truncate">
                                            {tx.description}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {getActionDisplayName(tx.action)}
                                        </p>
                                    </div>

                                    {/* Amount & Date */}
                                    <div className="text-right">
                                        <p className={`font-semibold ${
                                            tx.type === "CREDIT" 
                                                ? "text-emerald-600" 
                                                : "text-red-600"
                                        }`}>
                                            {tx.type === "CREDIT" ? "+" : "-"}{tx.amount}
                                        </p>
                                        <p className="text-xs text-slate-400 flex items-center justify-end gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(tx.created_at)}
                                        </p>
                                    </div>
                                </div>

                                {/* Balance After */}
                                <p className="text-xs text-slate-400 mt-2 pl-12">
                                    Balance after: {tx.balance_after} ecoins
                                </p>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Load More / Pagination */}
                {pagination && pagination.total_pages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Showing {transactions.length} of {pagination.total} transactions
                        </p>
                        {filter.page < pagination.total_pages && (
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                            >
                                {loadingMore ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        Load More
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoinHistory;
