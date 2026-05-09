import React from "react";
import { Settings, Store, User, Check } from "lucide-react";
import { Container } from "../layout/Container";

const stakeholderCards = [
  {
    icon: Settings,
    title: "For Brands & OEMs",
    description:
      "Control your warranty program end-to-end. Define warranty terms, onboard partners, and get a single source of truth for registrations and claims.",
    features: ["Warranty policy configuration", "Analytics & audit trail"],
  },
  {
    icon: Store,
    title: "For Dealers",
    description:
      "Register sales instantly and help customers activate warranties. Track service status and reduce manual follow-ups.",
    features: ["Instant sale registration", "Service routing & status"],
  },
  {
    icon: User,
    title: "For Customers",
    description:
      "Activate warranties in seconds. View coverage details, get expiry reminders, and raise claims without searching for paper invoices.",
    features: ["Digital warranty certificate", "Simple claim submission"],
  },
];

export function HowItWorksSection() {
  return (
    <section id="solutions" className="py-8 lg:py-10 bg-white scroll-mt-16 lg:scroll-mt-20">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-6 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Built for Every Stakeholder
          </h2>
          <p className="text-sky-600 text-base lg:text-lg font-medium max-w-2xl mx-auto">
            Purpose-built workflows for brands, dealers, and customers—connected in one platform.
          </p>
        </div>

        {/* Stakeholder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
          {stakeholderCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-2xl bg-slate-100/80 p-5 lg:p-6 shadow-sm border border-slate-200/60 flex flex-col"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#0284c7]" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{card.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                  {card.description}
                </p>
                <ul className="space-y-2.5">
                  {card.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-emerald-600" strokeWidth={2.5} />
                      </span>
                      <span className="text-slate-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
