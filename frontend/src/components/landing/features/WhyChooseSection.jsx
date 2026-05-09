import React from "react";
import { Monitor, Bell, QrCode } from "lucide-react"; 
import { Container } from "../layout/Container";

export function WhyChooseSection() {
  return (
    <section id="features" className="py-6 lg:py-8 bg-white scroll-mt-16 lg:scroll-mt-20">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-7 lg:mb-9">
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-600 mb-3">
            The Platform
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            Smart Features for Smart Assets
          </h2>
        </div>

        {/* Features Grid - 2 columns: large left, 2 stacked right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-stretch">
          {/* Left - Multi-brand Support (large card) */}
          <div className="rounded-2xl bg-slate-100/80 p-4 lg:p-5 shadow-sm border border-slate-200/60 flex flex-col">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                <Monitor className="w-5 h-5 text-[#0284c7]" strokeWidth={1.75} />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
                Multi-brand Support
              </h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              Run multiple product lines under one roof. Standardize warranty terms, track serials, and manage claims
              across brands from a single, unified dashboard.
            </p>
            {/* Dashboard mockup (kept, but height-capped so card aligns) */}
            <div className="mt-auto rounded-xl bg-white border border-slate-200 p-2.5 shadow-sm max-h-20 overflow-hidden">
              <div className="flex gap-1.5 mb-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-3 flex-1 max-w-[60%] rounded bg-slate-200" />
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500 text-white">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="h-3 flex-1 max-w-[70%] rounded bg-slate-200" />
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500 text-white">
                    Expiring Soon
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - stacked cards */}
          <div className="flex flex-col gap-4 lg:gap-5">
            {/* Real-time Notifications */}
            <div className="rounded-2xl bg-slate-100/80 p-4 lg:p-5 shadow-sm border border-slate-200/60 flex-1 flex flex-col">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-[#0284c7]" strokeWidth={1.75} />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
                  Real-time Notifications
                </h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                Stay ahead with proactive alerts for expiries, claim updates, and service SLAs.
              </p>
              {/* Notification mockup (height-capped to keep alignment) */}
              <div className="mt-auto space-y-2 max-h-16 overflow-hidden">
                <div className="rounded-lg bg-white border border-slate-200 p-2.5 shadow-sm">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-600">
                    Reminder
                  </span>
                  <p className="text-xs text-slate-700 mt-1">
                    Laptop warranty expires in 15 days
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Access */}
            <div className="rounded-2xl bg-slate-100/80 p-4 lg:p-5 shadow-sm border border-slate-200/60 flex-1">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5 text-[#0284c7]" strokeWidth={1.75} />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
                  Mobile Access
                </h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Register products via QR, access warranty certificates anytime, and support customers on the go.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
