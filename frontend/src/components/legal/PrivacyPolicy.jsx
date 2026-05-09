import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function getBackTo(from) {
  if (!from || typeof from !== "string") return "/";
  const path = from.trim();
  if (!path.startsWith("/") || path.includes("//") || path === "/terms-of-service" || path === "/privacy-policy") return "/";
  return path;
}

export function PrivacyPolicy() {
  const [searchParams] = useSearchParams();
  const backTo = getBackTo(searchParams.get("from"));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
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

      <main className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 lg:p-10">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-slate-500 text-sm mb-8">Last updated: March 2025</p>

          <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed prose-headings:font-display prose-headings:text-slate-900 prose-h2:mt-8 prose-h2:mb-2 prose-h2:text-lg prose-p:my-2 prose-a:text-[#1A7FC1] prose-a:no-underline hover:prose-a:underline">
            <section>
              <h2>1. Information We Collect</h2>
              <p>
                We collect information you provide directly, such as name, email address, phone number, company details,
                and warranty-related data. We also collect usage data, device information, and cookies when you use our
                Service.
              </p>
            </section>

            <section>
              <h2>2. How We Use Your Information</h2>
              <p>
                We use your information to provide and improve the Service, verify your identity, process warranty
                registrations and claims, send notifications, and communicate with you. We may use aggregated data for
                analytics and to enhance our platform.
              </p>
            </section>

            <section>
              <h2>3. Third-Party Services</h2>
              <p>
                We use Google Sign-In for authentication. When you sign in with Google, we receive your email and name
                as permitted by your Google account settings. We do not share your personal information with third
                parties for their marketing purposes.
              </p>
            </section>

            <section>
              <h2>4. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to maintain your session, remember preferences, and improve our
                Service. You can manage cookie settings through your browser.
              </p>
            </section>

            <section>
              <h2>5. Data Security</h2>
              <p>
                We implement reasonable security measures to protect your personal information. However, no method of
                transmission over the internet is 100% secure. We encourage you to use strong passwords and keep your
                account credentials confidential.
              </p>
            </section>

            <section>
              <h2>6. Data Retention</h2>
              <p>
                We retain your data for as long as your account is active or as needed to provide the Service. We may
                retain certain information as required by law or for legitimate business purposes.
              </p>
            </section>

            <section>
              <h2>7. Your Rights</h2>
              <p>
                Depending on your location, you may have the right to access, correct, or delete your personal
                information. You can update your profile through the app or contact us for assistance.
              </p>
            </section>

            <section>
              <h2>8. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting
                the updated policy on our platform or by email.
              </p>
            </section>

            <section>
              <h2>9. Contact Us</h2>
              <p>
                For questions about this Privacy Policy or your personal data, please contact us through our{" "}
                <Link to="/#contact" className="text-[#1A7FC1] hover:underline">Contact</Link> section or at ewarrantify.com.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200">
            <Link
              to={backTo}
              className="inline-flex items-center gap-2 text-[#1A7FC1] font-medium hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              {backTo === "/" ? "Back to Home" : "Back"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
