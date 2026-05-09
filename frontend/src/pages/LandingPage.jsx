import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "../components/landing/layout/Navbar";
import { Footer } from "../components/landing/layout/Footer";
import { HeroSection } from "../components/landing/hero/HeroSection";
import { HowItWorksSection } from "../components/landing/how-it-works/HowItWorksSection";
import { StreamlineSection } from "../components/landing/how-it-works/StreamlineSection";
import { IndustriesSection } from "../components/landing/industries/IndustriesSection";
import { FAQSection } from "../components/landing/faq/FAQSection";
import { ContactSection } from "../components/landing/contact/ContactSection";
import { HelpSection } from "../components/landing/help/HelpSection";
import { HelpSearchSection } from "../components/landing/help/HelpSearchSection";
import { PricingSection } from "../components/landing/pricing/PricingSection";
import Cookies from 'js-cookie';
import { Navigate } from "react-router-dom";

export function LandingPage() {
  const token = Cookies.get('authToken') || localStorage.getItem('token');
  const location = useLocation();

  useEffect(() => {
    const id = location.hash?.replace(/^#/, "");
    if (!id) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const headerOffset = window.innerWidth >= 1024 ? 80 : 64;
      const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  if (token) {
    return <Navigate to="/home" />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="pt-16 lg:pt-20 ">
        {/* Hero Section */}
        <HeroSection />

        {/* Solutions - Stakeholders + Streamline */}
        <HowItWorksSection />
        <StreamlineSection />

        {/* Help Search */}
        <HelpSearchSection />

        {/* Pricing */}
        <PricingSection />

        {/* Industries */}
        <IndustriesSection />

        {/* FAQ */}
        <FAQSection />

        {/* Contact Us */}
        <ContactSection />

        {/* Help / Support */}
        <HelpSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default LandingPage;
