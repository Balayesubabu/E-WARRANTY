import React from "react";
import Cookies from "js-cookie";
import { Navigate } from "react-router-dom";
import { Navbar } from "../components/landing/layout/Navbar";
import { Footer } from "../components/landing/layout/Footer";
import { WhyChooseSection } from "../components/landing/features/WhyChooseSection";
import { OnboardingSection } from "../components/landing/features/OnboardingSection";
import { SecuritySection } from "../components/landing/features/SecuritySection";

export function FeaturesPage() {
  const token = Cookies.get("authToken") || localStorage.getItem("token");

  if (token) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-16 lg:pt-20">
        <WhyChooseSection />
        <OnboardingSection />
        <SecuritySection />
      </main>
      <Footer />
    </div>
  );
}

export default FeaturesPage;
