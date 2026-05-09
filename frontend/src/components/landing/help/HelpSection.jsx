import React from "react";
import { UserPlus, FileText, Search, Download, MessageCircle } from "lucide-react";
import { Container } from "../layout/Container";
import { HelpCard } from "./HelpCard";
import { useNavigate } from "react-router-dom";

const helpItems = [
  {
    icon: UserPlus,
    iconBgColor: "bg-sky-50",
    iconColor: "text-[#0284c7]",
    title: "How to Register",
    description: "Step-by-step guide to register your products",
  },
  {
    icon: FileText,
    iconBgColor: "bg-sky-50",
    iconColor: "text-[#0284c7]",
    title: "How to Claim",
    description: "Learn the warranty claim process",
  },
  {
    icon: Search,
    iconBgColor: "bg-[#0284c7]",
    iconColor: "text-white",
    title: "Check Warranty Status",
    description: "Verify your warranty status instantly",
  },
  {
    icon: Download,
    iconBgColor: "bg-sky-50",
    iconColor: "text-[#0284c7]",
    title: "Download User Guide",
    description: "Complete user manual and documentation",
  },
];

export function HelpSection() {
  const navigate = useNavigate();

  const handleCardClick = (title) => {
    if (title === "How to Register") {
      navigate("/customer-register");
      return;
    }

    if (title === "How to Claim") {
      navigate("/customer-auth", { state: { intent: "claim" } });
      return;
    }

    if (title === "Check Warranty Status") {
      navigate("/check-warranty");
      return;
    }

    if (title === "Download User Guide") {
      navigate("/user-guide");
      return;
    }

    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="help" className="py-12 lg:py-16 bg-slate-50 dark:bg-slate-900 scroll-mt-16 lg:scroll-mt-20">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0f172a] dark:text-slate-100 mb-3">
            Need Help?
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Quick access to guides, tutorials, and support resources
          </p>
        </div>

        {/* Help Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-8">
          {helpItems.map((item, index) => (
            <HelpCard
              key={index}
              icon={item.icon}
              iconBgColor={item.iconBgColor}
              iconColor={item.iconColor}
              title={item.title}
              description={item.description}
              onClick={() => handleCardClick(item.title)}
            />
          ))}
        </div>

        {/* Live Chat CTA */}
        <div className="text-center">
          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0284c7] text-white font-semibold rounded-full hover:bg-[#0369a1] transition-colors shadow-md hover:shadow-lg">
            <MessageCircle className="w-5 h-5" />
            Start Live Chat
          </button>
        </div>
      </Container>
    </section>
  );
}
