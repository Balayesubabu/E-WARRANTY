import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, ShieldCheck, BarChart3, AlertTriangle, Clock, CreditCard,
  TrendingUp, Loader2, RefreshCw, ArrowRight, Users, Store, FileText, Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { getOverview } from "../../services/ownerConsoleService";
import { getWarrantyClaimStats } from "../../services/warrantyClaimService";

const fmt = (n) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};

export function OwnerOverview() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [claimStats, setClaimStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overview, cs] = await Promise.allSettled([getOverview(), getWarrantyClaimStats()]);
      if (overview.status === "fulfilled") setData(overview.value);
      if (cs.status === "fulfilled") setClaimStats(cs.value?.data || cs.value);
    } catch { toast.error("Failed to load overview"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  const kpis = data ? [
    //{ label: "Total Revenue", value: fmt(data.totalRevenue), icon: DollarSign, color: "bg-emerald-500", sub: "From purchase orders" },
    { label: "Active Warranties", value: data.activeWarranties, icon: ShieldCheck, color: "bg-blue-500", sub: "Currently active" },
    { label: "Claims Ratio", value: `${data.claimsRatio}%`, icon: BarChart3, color: "bg-purple-500", sub: "Claims vs warranties" },
    { label: "Open Claims", value: data.openClaims, icon: AlertTriangle, color: "bg-amber-500", sub: "Pending resolution" },
    //{ label: "SLA Breaches", value: data.slaBreach, icon: Clock, color: "bg-red-500", sub: "Overdue claims" },
    //{ label: "Outstanding Payments", value: fmt(data.outstandingPayments), icon: CreditCard, color: "bg-orange-500", sub: "Dealer balance due" },
  ] : [];

  const quickLinks = [
    { label: "Claims Management", icon: Wrench, route: "/owner/claims-management", desc: "Review & process claims" },
    { label: "Warranty Registry", icon: FileText, route: "/owner/warranty-registry", desc: "All registered warranties" },
    //{ label: "Dealer Ledger", icon: Store, route: "/owner/dealer-ledger", desc: "Financial overview" },
    { label: "Reports & Analytics", icon: TrendingUp, route: "/owner/analytics", desc: "Business intelligence" },
  ];

  const claimBreakdown = claimStats ? [
    { label: "Submitted", count: claimStats.submitted || 0, color: "bg-amber-400" },
    { label: "Under Review", count: claimStats.underReview || 0, color: "bg-indigo-400" },
    { label: "Approved", count: claimStats.approved || 0, color: "bg-blue-400" },
    { label: "In Progress", count: claimStats.inProgress || 0, color: "bg-violet-400" },
    { label: "Repaired", count: claimStats.repaired || 0, color: "bg-emerald-400" },
    { label: "Closed", count: claimStats.closed || 0, color: "bg-slate-400" },
    { label: "Rejected", count: claimStats.rejected || 0, color: "bg-red-400" },
  ] : [];
  const totalClaimsForBar = claimBreakdown.reduce((s, c) => s + c.count, 0) || 1;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Business Overview</h1>
          <p className="text-sm text-slate-500">Real-time business analytics</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-[#1A7FC1] text-white rounded-lg hover:bg-[#166EA8] text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg ${kpi.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Claim Status Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Claim Status Distribution</h3>
            <button onClick={() => navigate("/owner/claims-management")} className="text-xs text-[#1A7FC1] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {/* Stacked bar */}
          <div className="h-6 rounded-full overflow-hidden flex bg-slate-100 mb-4">
            {claimBreakdown.filter((c) => c.count > 0).map((c) => (
              <div key={c.label} className={`${c.color} h-full`} style={{ width: `${(c.count / totalClaimsForBar) * 100}%` }} title={`${c.label}: ${c.count}`} />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {claimBreakdown.map((c) => (
              <div key={c.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${c.color}`} />
                <span className="text-xs text-slate-600">{c.label}</span>
                <span className="text-xs font-bold text-slate-800 ml-auto">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Quick Navigation</h3>
          <div className="space-y-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button key={link.label} onClick={() => navigate(link.route)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-left transition-colors group border border-transparent hover:border-slate-200">
                  <div className="w-9 h-9 rounded-lg bg-[#1A7FC1]/10 flex items-center justify-center group-hover:bg-[#1A7FC1]/20 transition-colors">
                    <Icon className="w-4 h-4 text-[#1A7FC1]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{link.label}</p>
                    <p className="text-xs text-slate-400">{link.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1A7FC1] transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <button onClick={() => navigate("/owner/dealer-management")} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center gap-2 mb-1"><Store className="w-4 h-4 text-[#1A7FC1]" /><span className="text-xs text-slate-500">Active Dealers</span></div>
          <p className="text-2xl font-bold text-slate-800">{data?.totalDealers || 0}</p>
        </button>
        <button onClick={() => navigate("/owner/claims-management")} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-xs text-slate-500">Total Claims</span></div>
          <p className="text-2xl font-bold text-slate-800">{data?.totalClaims || 0}</p>
        </button>
        {/* <button onClick={() => navigate("/owner/purchase-orders")} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-emerald-500" /><span className="text-xs text-slate-500">Revenue</span></div>
          <p className="text-2xl font-bold text-slate-800">{data ? fmt(data.totalRevenue) : "₹0"}</p>
        </button> */}
        <button onClick={() => navigate("/owner/customers")} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center gap-2 mb-1"><Users className="w-4 h-4 text-purple-500" /><span className="text-xs text-slate-500">Customers</span></div>
          <p className="text-2xl font-bold text-slate-800">{data?.activeWarranties || 0}</p>
        </button>
      </div>
    </div>
  );
}
