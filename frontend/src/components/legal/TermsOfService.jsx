import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function getBackTo(from) {
  if (!from || typeof from !== "string") return "/";
  const path = from.trim();
  if (!path.startsWith("/") || path.includes("//") || path === "/terms-of-service" || path === "/privacy-policy") return "/";
  return path;
}

export function TermsOfService() {
  const [searchParams] = useSearchParams();
  const backTo = getBackTo(searchParams.get("from"));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to={backTo}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-8 w-auto" />
            <span className="text-lg font-semibold text-slate-800">E-Warrantify</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 lg:py-12">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
          Terms of Service
        </h1>
        <p className="text-slate-500 text-sm mb-8">Last updated: March 2025</p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the E-Warrantify platform ("Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Description of Service</h2>
            <p>
              E-Warrantify provides a digital warranty management platform for businesses and consumers. Our Service enables
              warranty registration, verification, claims management, and related features for manufacturers, dealers,
              service centers, and end customers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Account Terms</h2>
            <p>
              You must provide accurate and complete information when creating an account. You are responsible for
              maintaining the confidentiality of your credentials and for all activities under your account. Notify us
              immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Acceptable Use</h2>
            <p>
              You agree not to use the Service for any illegal purpose or in violation of applicable laws. You must not
              submit false warranty information, engage in fraud, or abuse the platform. We reserve the right to
              suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Intellectual Property</h2>
            <p>
              The Service, including its design, branding, and content, is owned by E-Warrantify Private Limited. You may
              not copy, modify, or distribute our materials without express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" without warranties of any kind, express or implied. We do not guarantee
              uninterrupted or error-free operation. Your use of the Service is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, E-Warrantify shall not be liable for any indirect, incidental,
              special, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">8. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify users of material changes via the platform or
              email. Continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">9. Contact</h2>
            <p>
              For questions about these Terms of Service, please contact us through our{" "}
              <Link to="/#contact" className="text-[#1A7FC1] hover:underline">Contact</Link> section or at ewarrantify.com.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200">
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-[#1A7FC1] font-medium hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {backTo === "/" ? "Back to Home" : "Back"}
          </Link>
        </div>
      </main>
    </div>
  );
}
