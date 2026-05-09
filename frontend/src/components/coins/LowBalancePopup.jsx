/**
 * Low Balance Popup
 * 
 * Modal popup shown when user tries to perform an action
 * without sufficient ecoins.
 */

import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
    AlertTriangle, 
    X, 
    Coins,
    Wallet
} from "lucide-react";

const LowBalancePopup = ({ 
    isOpen, 
    onClose, 
    currentBalance = 0, 
    requiredAmount = 0,
    quantity = 1,
    actionName = "warranty codes"
}) => {
    const navigate = useNavigate();
    const shortfall = requiredAmount - currentBalance;

    const handleAddCoins = () => {
        onClose();
        navigate("/owner/wallet");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50"
                    />
                    
                    {/* Popup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>

                            {/* Icon */}
                            <div className="flex justify-center mb-4">
                                <div className="p-4 bg-amber-100 rounded-full">
                                    <AlertTriangle className="w-10 h-10 text-amber-600" />
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-xl font-bold text-center text-slate-800 mb-2">
                                Insufficient Ecoins
                            </h2>

                            {/* Message */}
                            <p className="text-center text-slate-600 mb-6">
                                You need <span className="font-bold text-slate-800">{requiredAmount.toLocaleString()} ecoins</span> to generate{" "}
                                <span className="font-bold text-slate-800">{quantity} {actionName}</span>.
                            </p>

                            {/* Balance Info */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Current Balance</span>
                                    <span className="font-bold text-slate-800">{currentBalance.toLocaleString()} ecoins</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-slate-600">Required</span>
                                    <span className="font-bold text-slate-800">{requiredAmount.toLocaleString()} ecoins</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                    <span className="text-red-600">Need to Add</span>
                                    <span className="font-bold text-red-700">{shortfall.toLocaleString()} ecoins</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddCoins}
                                    className="flex-1 py-3 bg-[#1A7FC1] text-white rounded-xl font-semibold hover:bg-[#166EA8] transition-colors flex items-center justify-center gap-2"
                                >
                                    <Wallet className="w-5 h-5" />
                                    Add Ecoins
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default LowBalancePopup;
