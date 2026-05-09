import { useNavigate } from "react-router-dom";
import { ArrowRight, Code2, ShieldCheck, Coins } from "lucide-react";

export function ApiSalesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-[#0F4E78] via-[#1A7FC1] to-[#2A8FD1] py-14 px-6">
        <div className="max-w-5xl mx-auto text-white">
          <p className="text-white/80 text-sm">E‑Warrantify API</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold">Integrate warranty workflows into your app</h1>
          <p className="mt-3 text-white/85 max-w-2xl">
            Generate warranty codes, verify warranties, and manage registrations using secure APIs.
            Usage is billed via credits in your E‑Warrantify wallet.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/owner-signup")}
              className="h-11 px-5 rounded-xl bg-white text-[#0F4E78] font-semibold hover:bg-white/95 inline-flex items-center gap-2"
            >
              Start as Business <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="h-11 px-5 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 grid gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#1A7FC1] flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
          <h3 className="mt-3 font-semibold text-slate-900">Developer friendly</h3>
          <p className="mt-1 text-sm text-slate-600">Simple auth, predictable responses, and clear error codes.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="mt-3 font-semibold text-slate-900">Secure by default</h3>
          <p className="mt-1 text-sm text-slate-600">API keys, usage tracking, and audit trails for every action.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
          <h3 className="mt-3 font-semibold text-slate-900">Credits based billing</h3>
          <p className="mt-1 text-sm text-slate-600">Buy credits once and use them across supported features.</p>
        </div>
      </div>
    </div>
  );
}

