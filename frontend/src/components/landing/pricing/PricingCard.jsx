import React from "react";
import { Star, Gift, Coins } from "lucide-react";
import { cn } from "../../ui/utils";

export function PricingCard({ 
  name, 
  price_usd, 
  price,
  currency = "INR",
  coins,
  bonus_coins,
  total_coins,
  description, 
  popular,
  price_per_coin,
}) {
  const displayPrice = price != null ? price : price_usd;
  const isINR = currency === "INR";
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl p-2 transition-all duration-300 hover:shadow-xl",
        popular
          ? "border-2 border-[#0284c7] bg-linear-to-b from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 shadow-xl scale-[1.02]"
          : "border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-md"
      )}
    >
      {/* Popular Badge */}
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#0284c7] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-md">
            <Star className="w-3 h-3 fill-current" />
            Best Value
          </span>
        </div>
      )}  

      {/* Package Name & Description */}
      <div className={cn("text-center", popular && "pt-2")}>
        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">{name}</h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>

      {/* Price */}
      <div className="text-center mt-3">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {isINR ? `₹${Number(displayPrice).toLocaleString()}` : `$${displayPrice}`}
        </span>
      </div>

      {/* Coin Breakdown */}
      <div className="space-y-2.5 mt-4 mb-4">
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
          <span className="text-slate-600 text-sm">Base Credits</span>
          <span className="font-semibold text-slate-800">{coins.toLocaleString()}</span>
        </div>
        
        {bonus_coins > 0 && (
          <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
            <span className="text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
              <Gift className="w-4 h-4" />
              Bonus
            </span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">+{bonus_coins.toLocaleString()}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg">
          <span className="text-amber-600 dark:text-amber-400 font-medium text-sm flex items-center gap-1">
            <Coins className="w-4 h-4" />
            Total
          </span>
          <span className="font-bold text-amber-700 dark:text-amber-300">{total_coins.toLocaleString()} credits</span>
        </div>
      </div>

      {/* Price Per Coin */}
      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-3">
        {price_per_coin != null ? `₹${price_per_coin} per credit` : "10¢ per credit"}
      </p>

      {/* CTA Button */}
      <button
        className={cn(
          "mt-auto w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2",
          popular
            ? "bg-[#0284c7] text-white hover:bg-[#0369a1] shadow-md hover:shadow-lg"
            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600"
        )}
      >
        Get Started
      </button>
    </div>
  );
}
