import React from "react";
import { Key, UserCog, ArrowRight, CheckCircle2 } from "lucide-react";
import { Container } from "../layout/Container";

function NetworkIllustration() {
  return (
    <div className="rounded-2xl bg-slate-900 border border-sky-200/60 dark:border-slate-600 p-7 lg:p-8 overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-slate-950/50">
      <svg
        viewBox="0 0 280 200"
        className="w-full h-auto"
        fill="none"
        stroke="rgba(148,163,184,0.6)"
        strokeWidth="1.5"
      >
        {/* Connection lines */}
        <line x1="70" y1="80" x2="140" y2="50" />
        <line x1="140" y1="50" x2="210" y2="80" />
        <line x1="70" y1="80" x2="100" y2="150" />
        <line x1="70" y1="80" x2="140" y2="120" />
        <line x1="140" y1="50" x2="140" y2="120" />
        <line x1="210" y1="80" x2="180" y2="150" />
        <line x1="210" y1="80" x2="140" y2="120" />
        <line x1="100" y1="150" x2="140" y2="120" />
        <line x1="140" y1="120" x2="180" y2="150" />
        <line x1="100" y1="150" x2="180" y2="150" />
        {/* User nodes - varied silhouettes */}
        <circle cx="70" cy="80" r="22" fill="rgba(148,163,184,0.25)" stroke="rgba(148,163,184,0.5)" />
        <circle cx="70" cy="80" r="8" fill="rgba(148,163,184,0.6)" />
        <ellipse cx="70" cy="95" rx="10" ry="12" fill="rgba(148,163,184,0.6)" />

        <circle cx="140" cy="50" r="22" fill="rgba(148,163,184,0.25)" stroke="rgba(148,163,184,0.5)" />
        <circle cx="140" cy="50" r="8" fill="rgba(148,163,184,0.6)" />
        <ellipse cx="140" cy="65" rx="10" ry="12" fill="rgba(148,163,184,0.6)" />

        <circle cx="210" cy="80" r="22" fill="rgba(148,163,184,0.25)" stroke="rgba(148,163,184,0.5)" />
        <circle cx="210" cy="80" r="8" fill="rgba(148,163,184,0.6)" />
        <ellipse cx="210" cy="95" rx="10" ry="12" fill="rgba(148,163,184,0.6)" />

        <circle cx="100" cy="150" r="22" fill="rgba(148,163,184,0.25)" stroke="rgba(148,163,184,0.5)" />
        <circle cx="100" cy="150" r="8" fill="rgba(148,163,184,0.6)" />
        <ellipse cx="100" cy="165" rx="10" ry="12" fill="rgba(148,163,184,0.6)" />

        <circle cx="140" cy="120" r="22" fill="rgba(148,163,184,0.25)" stroke="rgba(148,163,184,0.5)" />
        <circle cx="140" cy="120" r="8" fill="rgba(148,163,184,0.6)" />
        <ellipse cx="140" cy="135" rx="10" ry="12" fill="rgba(148,163,184,0.6)" />

        <circle cx="180" cy="150" r="22" fill="rgba(148,163,184,0.25)" stroke="rgba(148,163,184,0.5)" />
        <circle cx="180" cy="150" r="8" fill="rgba(148,163,184,0.6)" />
        <ellipse cx="180" cy="165" rx="10" ry="12" fill="rgba(148,163,184,0.6)" />
      </svg>
    </div>
  );
}

export function OnboardingSection() {
  return (
    <section id="onboarding" className="py-6 lg:py-8 bg-white dark:bg-slate-950 scroll-mt-16 lg:scroll-mt-20">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left column - Content and cards */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 dark:bg-sky-950/50 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-semibold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" aria-hidden />
              Onboarding
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Launch your warranty program faster
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base lg:text-lg leading-relaxed mb-6">
              Bring dealers, staff, and service centers online with secure access, role-based permissions, and a guided setup
              that scales with your network.
            </p>

            {/* Interactive onboarding cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {[
                { title: "Verify", desc: "Secure sign-in with OTP or Google", icon: Key },
                { title: "Invite", desc: "Add dealers, staff, service centers", icon: UserCog },
                { title: "Go live", desc: "Start issuing QR and warranties", icon: CheckCircle2 },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="group rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 p-4 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:shadow-slate-200/60 dark:hover:shadow-slate-900/40 transition-all"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center shrink-0 group-hover:bg-sky-200 dark:group-hover:bg-sky-900 transition-colors">
                        <Icon className="w-5 h-5 text-[#0284c7]" strokeWidth={1.75} />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* CTA row */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284c7] text-white text-sm font-semibold hover:bg-[#0369a1] transition-colors shadow-md shadow-sky-200/70"
              >
                View pricing
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Talk to us
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setup takes minutes, not weeks.
              </p>
            </div>
          </div>

          {/* Right column - Network illustration */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <NetworkIllustration />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
