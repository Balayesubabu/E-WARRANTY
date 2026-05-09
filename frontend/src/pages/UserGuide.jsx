import React from "react";
import { Link } from "react-router-dom";
import { Container } from "../components/landing/layout/Container";

export function UserGuide() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Container>
        <div className="py-12 lg:py-16">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              User Guide
            </h1>
            <p className="mt-3 text-slate-600">
              Quick instructions to help you register products, check warranty status, and get support.
            </p>

            <div className="mt-8 space-y-6">
              <section>
                <h2 className="text-lg font-semibold text-slate-900">1) Register a product</h2>
                <p className="mt-2 text-slate-600">
                  Start registration and follow the steps to submit your product details.
                </p>
                <div className="mt-3">
                  <Link
                    to="/customer-register"
                    className="inline-flex items-center justify-center rounded-full bg-[#0284c7] px-5 py-2.5 text-white font-semibold hover:bg-[#0369a1] transition-colors"
                  >
                    Register Product
                  </Link>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">2) Check warranty status</h2>
                <p className="mt-2 text-slate-600">
                  Verify your warranty instantly using the warranty code or relevant details.
                </p>
                <div className="mt-3">
                  <Link
                    to="/check-warranty"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-slate-900 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Check Warranty Status
                  </Link>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-900">3) Warranty claims</h2>
                <p className="mt-2 text-slate-600">
                  Claims typically require sign-in so we can associate the claim with your registered warranty.
                </p>
                <div className="mt-3">
                  <Link
                    to="/customer-auth"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-slate-900 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Sign in to continue
                  </Link>
                </div>
              </section>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <Link to="/landing" className="text-[#0284c7] font-semibold hover:underline">
                Back to landing
              </Link>
              <div className="text-sm text-slate-500">
                Need help? Use the contact section on the landing page.
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default UserGuide;
