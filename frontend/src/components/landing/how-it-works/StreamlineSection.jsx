import React from "react";
import { QrCode, Share2, Coins, TrendingUp, Banknote, FileText, Zap } from "lucide-react";
import { Container } from "../layout/Container";

const featureCards = [
  {
    icon: QrCode,
    iconColor: "text-[#0284c7]",
    iconBg: "bg-sky-100",
    title: "QR & Batch Generation",
    description:
      "Secure, encrypted QR codes for entire product lines. Export to print-ready formats in seconds.",
  },
  {
    icon: Share2,
    iconColor: "text-[#0284c7]",
    iconBg: "bg-sky-100",
    title: "Multi-Portal Access",
    description:
      "Dedicated permission-based interfaces for Product Owners, Dealers, and internal Service Staff.",
  },
  {
    icon: Coins,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
    title: "Coins-Based Payments",
    description:
      "Integrated credit system with Razorpay. Pay as you scale with transparent, unit-based billing.",
  },
  {
    icon: TrendingUp,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    title: "Real-time Analytics",
    description:
      "Monitor claim patterns, product failure rates, and dealer performance in one centralized view.",
  },
];

export function StreamlineSection() {
  return (
    <section className="py-10 lg:py-12 bg-slate-50 dark:bg-slate-900">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Run warranties at scale
          </h2>
          <p className="text-sky-600 dark:text-sky-400 text-base lg:text-lg font-medium max-w-3xl mx-auto">
            From QR issuance and registrations to claims and analytics—everything in one place for your warranty program.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/80"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${card.iconBg} dark:bg-slate-700 flex items-center justify-center mb-5`}
                >
                  <Icon className={`w-6 h-6 ${card.iconColor}`} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">{card.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{card.description}</p>
              </div>
            );
          })}
        </div>

        {/* Coins Info Banner */}
        <div className="mt-10 bg-slate-800 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-600/60 overflow-hidden">
          <div className="flex-1 flex items-center justify-center gap-4 px-6 py-6 sm:py-5">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5 text-sky-300" strokeWidth={1.5} />
            </div>
            <span className="text-white font-medium">1 Ecoin = 10¢</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-4 px-6 py-6 sm:py-5">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-sky-300" strokeWidth={1.5} />
            </div>
            <span className="text-white font-medium">Transparent, pay‑as‑you‑go</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-4 px-6 py-6 sm:py-5">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-sky-300" strokeWidth={1.5} />
            </div>
            <span className="text-white font-medium">Instant top‑ups via Razorpay</span>
          </div>
        </div>
      </Container>
    </section>
  );
}
