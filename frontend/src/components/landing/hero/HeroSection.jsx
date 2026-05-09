import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Package, Code2 } from "lucide-react";
import { Container } from "../layout/Container";
import { AppMockup } from "./AppMockup";
import { AuthChoiceModal } from "../AuthChoiceModal";

export function HeroSection() {
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleStartFreeTrial = () => {
    setAuthModalOpen(true);
  };

  const handleViewDemo = () => {
    navigate("/features");
  };

  return (
    <section id="home" className="relative overflow-hidden bg-white scroll-mt-16 lg:scroll-mt-20">
      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center py-6 lg:py-8">
          {/* Left column - Marketing content */}
          <div className="order-2 lg:order-1">
            {/* Brand pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-100 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#1A7FC1]" />
              <span className="text-[#1A7FC1] font-semibold text-xs uppercase tracking-wider">
                E-WARRANTIFY
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-slate-900 mb-5 leading-tight">
              End-to-end{" "}
              <span className="text-[#1A7FC1]">E‑Warranty</span>{" "}
              Management
            </h1>

            {/* Description */}
            <p className="text-base lg:text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
              Issue digital warranty certificates, register sales in seconds, route service requests, and track claims
              across your entire dealer network—securely, with real-time visibility.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/customer-register"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1E88E5] text-white font-semibold rounded-[10px] hover:bg-[#1976D2] transition-all shadow-lg shadow-[#1E88E5]/25 hover:shadow-[#1E88E5]/35"
                >
                  <Package className="w-4 h-4" />
                  Register a Product
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <button
                  onClick={handleStartFreeTrial}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Get started
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/api-sales")}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-slate-200 bg-white text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Code2 className="w-4 h-4" />
                  Explore API
                </button>
              </div>
              <button
                onClick={handleViewDemo}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-[#1A7FC1] text-sm font-medium transition-colors w-fit"
              >
                <span className="leading-none">View Demo</span>
                <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Right column - App mockup */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <AppMockup />
          </div>
        </div>
      </Container>

      <AuthChoiceModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </section>
  );
}
