import React from "react";
import { Car, Home, Wrench, Smartphone } from "lucide-react";
import { Container } from "../layout/Container";
import { IndustryCard } from "./IndustryCard";

const industries = [
  {
    icon: Car,
    title: "Automotive Parts & Accessories",
    description:
      "Complete coverage for vehicle components, aftermarket parts, and accessories.",
  },
  {
    icon: Home,
    title: "Home Appliances & Electronics",
    description:
      "Warranty management for household appliances and electronic devices.",
  },
  {
    icon: Wrench,
    title: "Industrial Machinery & Tools",
    description:
      "Professional-grade warranty tracking for industrial equipment.",
  },
  {
    icon: Smartphone,
    title: "Consumer Products & Accessories",
    description:
      "Wide range coverage for consumer goods and related accessories.",
  },
];

export function IndustriesSection() {
  return (
    <section id="industries" className="py-12 lg:py-16 bg-slate-50 dark:bg-slate-900 scroll-mt-16 lg:scroll-mt-20">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0f172a] dark:text-slate-100 mb-3">
            Applicable Across Industries
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Whether automotive, electronics, home-appliances or more — E-Warrantify works
            seamlessly across all sectors
          </p>
        </div>

        {/* Industries Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {industries.map((industry, index) => (
            <IndustryCard
              key={index}
              icon={industry.icon}
              title={industry.title}
              description={industry.description}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
