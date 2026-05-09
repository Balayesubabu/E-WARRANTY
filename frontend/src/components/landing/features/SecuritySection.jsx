import React from "react";
import { ShieldCheck, Lock, Shield, Check } from "lucide-react";
import { Container } from "../layout/Container";

const securityCards = [
  // {
  //   icon: ShieldCheck,
  //   title: "ISO 27001",
  //   subtitle: "Security Certified",
  // },
  {
    icon: Lock,
    title: "OTP Verification",
    subtitle: "Secure Access",
  },
  {
    icon: ShieldCheck,
    title: "Google OAuth",
    subtitle: "SSO Ready",
  },
  // {
  //   icon: Shield,
  //   title: "AES-256",
  //   subtitle: "Data Encryption",
  // },
];

const benefits = [
  "Multi-factor authentication for all portal users",
  "Automatic audit logs for every claim transaction",
  "Region-based data residency compliance",
];

export function SecuritySection() {
  return (
    <section className="py-8 lg:py-10 bg-slate-50 dark:bg-slate-900">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column - security cards aligned side by side */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0 items-stretch">
            {securityCards.map((card) => {
              const Icon = card.icon;
              const isGoogle = card.title === "Google OAuth";
              return (
                <div
                  key={card.title}
                  className="flex flex-col bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-sky-100 dark:border-slate-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center mb-4 shrink-0">
                      {isGoogle ? (
                        <span className="text-[#0284c7] font-bold text-lg">G</span>
                      ) : (
                        <Icon className="w-6 h-6 text-[#0284c7]" strokeWidth={1.5} />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{card.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{card.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right column - Security overview */}
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-5">
              Built-in Trust & Enterprise Security
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base lg:text-lg leading-relaxed mb-8">
              Protect registrations, claims, and customer data with strong authentication and clear audit trails.
              Designed for enterprise deployments and partner ecosystems.
            </p>
            <ul className="space-y-4">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#0284c7]" strokeWidth={2.5} />
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
