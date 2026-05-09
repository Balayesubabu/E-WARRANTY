import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Container } from "./Container";

const quickLinks = [
  { label: "Register Product", href: "/customer-register", isRoute: true },
  { label: "Features", href: "/features", isRoute: true },
  { label: "Solutions", href: "#solutions", isRoute: false },
  { label: "FAQ", href: "#faq", isRoute: false },
  { label: "Contact", href: "#contact", isRoute: false },
];

const supportLinks = [
  { label: "Help Center", href: "#help" },
  { label: "User Guide", href: "/user-guide", isRoute: true },
  { label: "Live Chat", href: "#contact" },
  { label: "Status Page", href: "#faq" },
];

export function Footer() {
  const location = useLocation();
  const navigate = useNavigate();
  const fromParam = `?from=${encodeURIComponent(location.pathname || "/")}`;

  const handleLinkClick = (href) => {
    if (!href.startsWith("#") || href === "#") return;
    if (location.pathname !== "/") {
      navigate({ pathname: "/", hash: href.replace(/^#/, "") });
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-[#0f172a] text-white">
      <Container>
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/ewarrantify-logo.png"
                  alt="E-Warrantify"
                  className="h-10 w-auto shrink-0"
                />
                <span className="text-xl font-semibold text-[#38bdf8]">E-Warrantify</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-md">
                Your trusted digital warranty management platform. Paperless, secure, and always
                accessible. Visit us at ewarrantify.com
              </p>
              <div className="flex gap-3">
                <Link
                  to={`/privacy-policy${fromParam}`}
                  className="px-4 py-2 text-sm font-medium text-white border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  to={`/terms-of-service${fromParam}`}
                  className="px-4 py-2 text-sm font-medium text-white border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Terms of Service
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-base font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    {link.isRoute ? (
                      <Link
                        to={link.href}
                        className="text-sm text-slate-400 hover:text-[#38bdf8] transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleLinkClick(link.href)}
                        className="text-sm text-slate-400 hover:text-[#38bdf8] transition-colors"
                      >
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-base font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-3">
                {supportLinks.map((link) => (
                  <li key={link.label}>
                    {"isRoute" in link && link.isRoute ? (
                      <Link
                        to={link.href}
                        className="text-sm text-slate-400 hover:text-[#38bdf8] transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleLinkClick(link.href)}
                        className="text-sm text-slate-400 hover:text-[#38bdf8] transition-colors"
                      >
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="py-6 border-t border-slate-800">
          <p className="text-center text-sm text-slate-500">
            © 2025 E-Warrantify Private Limited – All Rights Reserved | ewarrantify.com
          </p>
        </div>
      </Container>
    </footer>
  );
}
