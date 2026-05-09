import React, { useState, useEffect } from "react";
import { Container } from "../layout/Container";
import { PricingCard } from "./PricingCard";
import { Coins, Sparkles, Loader2 } from "lucide-react";
import { getCoinPackages, getWarrantyCosts } from "../../../services/coinService";

const FALLBACK_DESCRIPTIONS = {
  Starter: "Perfect for trying out E-Warrantify",
  Growth: "Best value for growing businesses",
  Business: "For established businesses",
  Enterprise: "Maximum savings for high volume",
};  

const FALLBACK_PACKAGES = [
  { id: "fallback-0", name: "Starter", coins: 500, bonus_coins: 0, price: 199, currency: "INR", is_popular: false },
  { id: "fallback-1", name: "Growth", coins: 2000, bonus_coins: 200, price: 699, currency: "INR", is_popular: true },
  { id: "fallback-2", name: "Business", coins: 5000, bonus_coins: 1000, price: 1499, currency: "INR", is_popular: false },
  { id: "fallback-3", name: "Enterprise", coins: 15000, bonus_coins: 5000, price: 3999, currency: "INR", is_popular: false },
].map((p) => ({
  ...p,
  total_coins: p.coins + p.bonus_coins,
  price_per_coin: (p.price / (p.coins + p.bonus_coins)).toFixed(2),
}));

export function PricingSection() {
  const [packages, setPackages] = useState([]);
  const [warrantyCosts, setWarrantyCosts] = useState({ 3: 1, 6: 2, 12: 4 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [packagesData, warrantyData] = await Promise.all([
        getCoinPackages().catch((e) => {
          console.warn("Using fallback packages (API unavailable):", e);
          return { packages: FALLBACK_PACKAGES, seeded: false, _fallback: true };
        }),
        getWarrantyCosts().catch(() => ({ 3: 1, 6: 2, 12: 4 })),
      ]);
      const nextPackages = packagesData?.packages?.length ? packagesData.packages : FALLBACK_PACKAGES;
      setPackages(nextPackages);
      setWarrantyCosts(warrantyData || { 3: 1, 6: 2, 12: 4 });
    } catch (err) {
      console.error("Failed to fetch pricing:", err);
      setError("Showing standard pricing (live pricing temporarily unavailable).");
      setPackages(FALLBACK_PACKAGES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when user returns to tab (e.g. after Super Admin updates pricing)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchData();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchData]);
  return (
    <section id="pricing" className="py-6 lg:py-8 bg-slate-50 dark:bg-slate-950 scroll-mt-16 lg:scroll-mt-20">
      <Container>
        <div className="text-center mb-6 lg:mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-950/50 rounded-full mb-3">
            <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-700 dark:text-amber-300 font-medium text-sm">Pay As You Go</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0f172a] dark:text-slate-100 mb-2">
            Simple Credit-Based Pricing
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
            1 credit = 10¢. Buy credits to generate warranty codes (3mo={warrantyCosts[3] ?? 1} credit, 6mo={warrantyCosts[6] ?? 2}, 1yr={warrantyCosts[12] ?? 4} per product). No monthly fees!
          </p>
        </div>

        {/* Coin Packages - fetched from API (reflects Super Admin changes) */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-10 h-10 animate-spin text-[#0284c7]" />
          </div>
        ) : packages.length > 0 ? (
          <>
            {error ? (
              <div className="text-center pb-4 text-xs text-slate-500 dark:text-slate-400">{error}</div>
            ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {packages.map((pkg) => (
              <PricingCard
                key={pkg.id}
                name={pkg.name}
                price={pkg.price}
                currency={pkg.currency || "INR"}
                coins={pkg.coins}
                bonus_coins={pkg.bonus_coins ?? 0}
                total_coins={pkg.total_coins ?? pkg.coins + (pkg.bonus_coins || 0)}
                description={pkg.description || FALLBACK_DESCRIPTIONS[pkg.name] || ""}
                popular={pkg.is_popular ?? false}
                price_per_coin={pkg.price_per_coin}
              />
            ))}
          </div>
          </>
        ) : null}

        {/* What Ecoins Can Do */}
        <div className="mt-8 max-w-4xl mx-auto">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200 text-center mb-5">
            Warranty Costs (1 credit = 10¢)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { action: "3 months warranty", cost: warrantyCosts[3] ?? 1, cents: `${(warrantyCosts[3] ?? 1) * 10}¢`, unit: "credit" },
              { action: "6 months warranty", cost: warrantyCosts[6] ?? 2, cents: `${(warrantyCosts[6] ?? 2) * 10}¢`, unit: "credits" },
              { action: "1 year warranty", cost: warrantyCosts[12] ?? 4, cents: `${(warrantyCosts[12] ?? 4) * 10}¢`, unit: "credits" },
              { action: "Create Dealer / Staff", cost: 0, cents: "FREE" },
            ].map((item) => (
              <div
                key={item.action}
                className="group flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-200 dark:hover:border-sky-600 hover:shadow-sm transition-all"
              >
                <span className="text-xl sm:text-2xl font-bold text-[#0284c7] group-hover:-translate-y-px transition-transform">
                  {item.cost === 0 ? "FREE" : `${item.cost} ${item.cost === 1 ? "credit" : "credits"}`}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{item.cents}</span>
                <span className="text-sm text-slate-700 dark:text-slate-200 mt-1.5 text-center">{item.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Welcome Bonus Banner */}
        <div className="mt-7 max-w-3xl mx-auto">
          <div className="bg-linear-to-r from-[#E8F4FC] to-[#D6EDFA] dark:from-slate-800 dark:to-slate-800 border border-[#A8D4F0] dark:border-slate-600 rounded-2xl p-4 sm:p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-6 h-6 text-[#1A7FC1]" />
              <h4 className="text-lg font-semibold text-[#1A7FC1]">Profile Bonus!</h4>
            </div>
            <p className="text-slate-700 dark:text-slate-200">
              Complete your profile and get <strong className="text-[#1A7FC1] dark:text-sky-400">20 FREE credits</strong> ($2 value)!
            </p>
          </div>
        </div>

        <div className="mt-7 text-center">
          <div className="inline-flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500">✓</span> No monthly subscription
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500">✓</span> Credits never expire
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500">✓</span> Secure Razorpay payments
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
