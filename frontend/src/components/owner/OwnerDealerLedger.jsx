import { useState, useEffect } from "react";
import { Wallet, Loader2, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { getDealerLedger } from "../../services/ownerConsoleService";

export function OwnerDealerLedger() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    getDealerLedger().then(setData).catch(() => toast.error("Failed to load ledger")).finally(() => setLoading(false));
  }, []);

  const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;
  const filtered = data.filter((d) => !search || d.dealerName.toLowerCase().includes(search.toLowerCase()) || d.city.toLowerCase().includes(search.toLowerCase()));
  const totalPurchase = filtered.reduce((s, d) => s + d.totalPurchase, 0);
  const totalPaid = filtered.reduce((s, d) => s + d.totalPaid, 0);
  const totalOutstanding = filtered.reduce((s, d) => s + d.outstanding, 0);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Dealer Ledger</h1>
        <p className="text-sm text-slate-500">Financial overview of all dealers</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Total Purchases</p><p className="text-2xl font-bold text-slate-800">{fmt(totalPurchase)}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Total Paid</p><p className="text-2xl font-bold text-emerald-600">{fmt(totalPaid)}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Outstanding</p><p className="text-2xl font-bold text-red-600">{fmt(totalOutstanding)}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by dealer or city..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Dealer</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Total Purchase</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Total Paid</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Outstanding</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Credit Limit</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Credit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#1A7FC1] mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16"><Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">No ledger data</p></td></tr>
              ) : filtered.map((d) => (
                <tr key={d.dealerId} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3"><p className="font-medium text-slate-800">{d.dealerName}</p>{d.city && <p className="text-xs text-slate-400">{d.city}</p>}</td>
                  <td className="px-4 py-3 text-right text-slate-800">{fmt(d.totalPurchase)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{fmt(d.totalPaid)}</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{fmt(d.outstanding)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{d.creditLimit > 0 ? fmt(d.creditLimit) : "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.creditStatus === "Hold" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {d.creditStatus === "Hold" && <AlertTriangle className="w-3 h-3 inline mr-1" />}{d.creditStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
