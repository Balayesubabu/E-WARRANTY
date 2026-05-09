import React, { useState } from "react";
import { MessageCircle, Mail, FileText, Play, ShieldCheck, Check } from "lucide-react";
import { Container } from "../layout/Container";
import { FAQItem } from "./FAQItem";

const faqs = [
  {
    question: "How does the coin-based billing system work?",
    answer: "Our platform uses a coin-based system for warranty operations such as generating warranty codes. Coins are purchased via coin packages or wallet top-up using Razorpay. The coin-to-rupee rate is set by the platform and shown at the time of purchase, so pricing is clear. You can recharge your wallet at any time using standard payment gateways."
  },
  {
    question: "How do I register my product warranty?",
    answer:
      "You can register your product warranty by logging into your account, entering the product details and warranty code (from QR or packaging), and completing the activation steps. Once verified, your warranty will be active and visible in your dashboard.",
  },
  {
    question: "What happens if a claim is rejected?",
    answer:
      "If a claim is rejected, you will receive a notification with the reason. You can review the feedback, gather any additional documentation if required, and resubmit the claim or contact our support team for assistance.",
  },
  {
    question: "How to generate bulk QR codes?",
    answer:
      "Product owners and authorized staff can generate bulk QR codes from the Warranty Management section. Select your product and batch size, then export print-ready QR codes in standard formats for labels or packaging.",
  },
  {
    question: "Can I transfer my warranty to another user?",
    answer:
      "Yes, warranty transfer is supported. The current owner can initiate a transfer from their dashboard; the new owner will need to accept the transfer. Once completed, the warranty is linked to the new account.",
  },
];

const quickLinks = [
  { label: "User Documentation", icon: FileText, href: "#" },
  { label: "Video Tutorials", icon: Play, href: "#" },
  { label: "Security Policy", icon: ShieldCheck, href: "#" },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-8 lg:py-10 bg-white dark:bg-slate-950 scroll-mt-16 lg:scroll-mt-20">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Left: FAQ accordion (2/3 width) */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openIndex === index}
                  onToggle={() => handleToggle(index)}
                />
              ))}
            </div>
          </div>

          {/* Right: Support card + Quick Links + Trust badge */}
          <div className="space-y-6">
            {/* Still have questions? */}
            <div className="rounded-2xl bg-[#0284c7] p-6 lg:p-8 text-white">
              <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
              <p className="text-white/90 text-sm leading-relaxed mb-6">
                Our dedicated support team is here to help you manage your warranties effectively.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-slate-800 text-[#0284c7] dark:text-sky-400 font-semibold rounded-xl border-2 border-sky-200 dark:border-sky-600 hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Live Chat
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0369a1] text-white font-semibold rounded-xl hover:bg-[#0c5a8a] transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  Email Support
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-[#0284c7] dark:hover:text-sky-400 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="text-sm font-medium">{link.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Trusted badge */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0284c7]/10 dark:bg-sky-500/20 flex items-center justify-center shrink-0">
                <Check className="w-6 h-6 text-[#0284c7]" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">TRUSTED FOR 15+ YEARS</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Official Warranty Partner</p>
              </div>
            </div>
          </div>
        </div>

        {/* Second section: We're here to help */}
        <div className="mt-12 pt-10 border-t border-slate-200 dark:border-slate-800 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-5 max-w-2xl mx-auto leading-tight">
            We&apos;re here to help you{" "}
            <span className="text-[#0284c7]">secure</span> your products.
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            Our dedicated enterprise support team is available around the clock to ensure your
            warranty management is seamless and efficient.
          </p>
        </div>
      </Container>
    </section>
  );
}
