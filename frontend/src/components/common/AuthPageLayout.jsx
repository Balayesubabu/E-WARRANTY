import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Shared shell for public auth flows (matches /login: brand header + elevated card).
 * @param {object} props
 * @param {string} [props.headerSubtitle] — Short line under “E-Warrantify” in the gradient band
 * @param {string} [props.backTo="/login"]
 * @param {string} [props.backLabel="Back to sign in"]
 * @param {boolean} [props.showBackLink=true]
 * @param {React.ReactNode} props.children — Card body (below optional back link)
 */
export function AuthPageLayout({
  headerSubtitle,
  backTo = "/login",
  backLabel = "Back to sign in",
  showBackLink = true,
  children,
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 shrink-0" aria-hidden />
      <header
        className="bg-linear-to-br from-[#1A7FC1] to-[#0F5F91] pt-12 sm:pt-14 pb-20 sm:pb-24 px-6 rounded-b-[2.5rem] shadow-lg"
        role="banner"
      >
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-12 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white">E-Warrantify</h1>
          {headerSubtitle ? (
            <p className="text-white/80 mt-1 text-sm">{headerSubtitle}</p>
          ) : null}
        </div>
      </header>

      <div className="flex-1 px-6 pb-10 -mt-12">
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-5">
            {showBackLink ? (
              <Link
                to={backTo}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
                {backLabel}
              </Link>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
