import { useState, useEffect, useCallback } from "react";
import { CreditCard, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getPaymentRecords } from "../../services/ownerConsoleService";

export function OwnerPaymentRecords() {
  const [data, setData] = useState({ payments: [], pagination: { page: 1, totalPages: 0, totalCount: 0 } });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await getPaymentRecords({ page, limit: 20, search: search || undefined });
      setData(result);
    } catch { toast.error("Failed to load payment records"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(1); }, [fetchData]);

  const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;
  const modeColors = { CASH: "bg-green-50 text-green-700", UPI: "bg-purple-50 text-purple-700", NEFT: "bg-blue-50 text-blue-700", CHEQUE: "bg-amber-50 text-amber-700", BANK_TRANSFER: "bg-cyan-50 text-cyan-700", OTHER: "bg-slate-50 text-slate-600" };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Payment Records</h1>
        <p className="text-sm text-slate-500">All dealer payment transactions</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by reference number or dealer..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]" />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-[#1A7FC1] text-white rounded-lg text-sm hover:bg-[#166EA8]">Search</button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Payment ID</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Dealer</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Amount</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Mode</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Reference</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#1A7FC1] mx-auto" /></td></tr>
              ) : data.payments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16"><CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">No payment records</p></td></tr>
              ) : data.payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.id.substring(0, 8)}...</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{p.dealerName}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{fmt(p.amount)}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${modeColors[p.paymentMode] || modeColors.OTHER}`}>{p.paymentMode?.replace("_", " ")}</span></td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{p.referenceNumber}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{p.date ? new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <p className="text-xs text-slate-500">Page {data.pagination.page} of {data.pagination.totalPages}</p>
            <div className="flex gap-1">
              <button disabled={data.pagination.page <= 1} onClick={() => fetchData(data.pagination.page - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={data.pagination.page >= data.pagination.totalPages} onClick={() => fetchData(data.pagination.page + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
