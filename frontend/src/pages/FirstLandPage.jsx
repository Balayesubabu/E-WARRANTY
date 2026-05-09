import React from "react";
import { useNavigate } from "react-router-dom";
import landingHeroImage from "../assets/images/ChatGPT Image Feb 3, 2026, 12_03_51 PM.png";

export const FirstLandPage = () => {
  const navigate = useNavigate();

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-8 md:px-20 py-20">
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-3xl md:text-5xl font-medium">E-Warrantify</h1>
          <p className="text-base md:text-lg font-normal">
            Manage your warranties effortlessly. Track products, claims, and coverage all in one place.
          </p>
          <div className="flex space-x-4">
            <button
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
              // onClick={goToDashboard}
              onClick={() => navigate("/dashboard")}
            >
              Get Started
            </button>
            <button
              className="px-6 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition"
              onClick={""}
            >
              Learn More
            </button>
          </div>
        </div>
        <div className="md:w-1/2 mt-10 md:mt-0">
          <img
            src={landingHeroImage}
            alt="E-Warrantify Dashboard"
            className="rounded-xl shadow-lg"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="px-8 md:px-20 py-20 space-y-12">
        <h2 className="text-2xl md:text-4xl font-medium text-center">Why Choose E-Warrantify?</h2>
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          <div className="bg-card p-6 rounded-xl shadow-md flex-1 hover:translate-y-[-4px] transition">
            <h3 className="text-xl font-medium mb-2">Track Warranties</h3>
            <p className="text-muted-foreground text-base">
              Keep all your product warranties organized in one dashboard.
            </p>
          </div>
          <div className="bg-card p-6 rounded-xl shadow-md flex-1 hover:translate-y-[-4px] transition">
            <h3 className="text-xl font-medium mb-2">Easy Claims</h3>
            <p className="text-muted-foreground text-base">
              File warranty claims instantly and monitor progress.
            </p>
          </div>
          <div className="bg-card p-6 rounded-xl shadow-md flex-1 hover:translate-y-[-4px] transition">
            <h3 className="text-xl font-medium mb-2">Notifications</h3>
            <p className="text-muted-foreground text-base">
              Get reminders before warranties expire so you never miss out.
            </p>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="bg-primary text-primary-foreground py-20 text-center">
        <h2 className="text-2xl md:text-4xl font-medium mb-6">
          Ready to Simplify Your Warranties?
        </h2>
        <button
          className="px-8 py-4 rounded-lg bg-background text-foreground hover:bg-muted transition"
          onClick={goToDashboard}
        >
          Sign Up Now
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-muted text-muted-foreground text-center py-6">
        © 2026 E-Warrantify. All rights reserved.
      </footer>
    </div>
  );
};


