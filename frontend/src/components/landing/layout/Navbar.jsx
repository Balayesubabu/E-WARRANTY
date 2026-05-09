import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Menu, X, Package } from "lucide-react";
import { Container } from "./Container";
import { cn } from "../../ui/utils";
import { AuthChoiceModal } from "../AuthChoiceModal";

const navLinks = [
  { label: "Home", kind: "hash", href: "#home" },
  { label: "Features", kind: "path", href: "/features" },
  { label: "Solutions", kind: "hash", href: "#solutions" },
  { label: "Pricing", kind: "hash", href: "#pricing" },
  { label: "FAQ", kind: "hash", href: "#faq" },
  { label: "Contact Us", kind: "hash", href: "#contact" },
];

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleNavClick = (link) => {
    setIsMobileMenuOpen(false);
    if (!link?.href) return;
    if (link.kind === "path") {
      navigate(link.href);
      return;
    }
    const href = link.href;
    if (!href.startsWith("#")) {
      navigate(href);
      return;
    }
    if (location.pathname !== "/") {
      if (href === "#home") {
        navigate("/");
        return;
      }
      navigate({ pathname: "/", hash: href.replace(/^#/, "") });
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      const headerOffset = window.innerWidth >= 1024 ? 80 : 64;
      const y = element.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg"
          : "bg-white shadow-sm"
      )}
    >
      <Container>
        <div className="flex items-center justify-between w-full h-16 lg:h-20">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => handleNavClick({ kind: "hash", href: "#home" })}
          >
            <img
              src="/ewarrantify-logo.png"
              alt="E-Warrantify"
              className="h-10 w-auto shrink-0"
            />
            <span className="text-lg font-bold text-slate-900">
              <span className="text-[18px] font-bold text-slate-700">E-</span>Warrantify
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden flex-1 justify-center lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className="text-sm font-medium text-slate-600 hover:text-[#0284c7] transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
  
          {/* Register Product (public) + Auth */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/customer-register"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#1E88E5] text-white rounded-[10px] hover:bg-[#1976D2] transition-colors"
            >
              <Package className="w-4 h-4" />
              Register Product
            </Link>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-2.5 text-sm font-bold text-[#1E88E5] bg-transparent border-2 border-[#1E88E5] rounded-lg hover:bg-[#1E88E5]/10 transition-colors"

              // className="px-6 py-2.5 text-sm font-bold text-white rounded-lg bg-gradient-to-b from-[#0369a1] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0ea5e9] transition-all shadow-sm"
            >
              Login / Register
            </button>
          </div>

          {/* Mobile Menu Button - min 44px touch target */}
          <button
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 -m-2 text-slate-600 hover:text-[#0284c7]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>



          {/* Auth Buttons - Mobile */}
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link)}
                  className="text-left px-4 py-3 min-h-[44px] text-sm font-medium text-slate-600 hover:text-[#0284c7] hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <div className="px-4 pt-3 mt-2 border-t border-slate-100 space-y-2">
                <Link
                  to="/customer-register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold bg-[#1E88E5] text-white rounded-[10px] hover:bg-[#1976D2] transition-colors"                >
                  <Package className="w-4 h-4" />
                  Register Product
                </Link>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); setAuthModalOpen(true); }}
                  className="w-full py-2.5 text-sm font-bold text-[#1E88E5] bg-transparent border-2 border-[#1E88E5] rounded-lg hover:bg-[#1E88E5]/10 transition-colors"
                  //className="w-full py-2.5 text-sm font-bold text-white rounded-lg bg-gradient-to-b from-[#0369a1] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0ea5e9] transition-all"
                >
                  Login / Register
                </button>
              </div>
            </div>
          </div>
        )}
      </Container>

      <AuthChoiceModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </nav>
  );
}
