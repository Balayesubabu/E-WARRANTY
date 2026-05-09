import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Search, Filter, Loader2, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { toast } from "sonner";
import { getPurchaseOrders } from "../../services/ownerConsoleService";

const statusColors = { PAID: "bg-emerald-50 text-emerald-700", PARTIAL: "bg-amber-50 text-amber-700", UNPAID: "bg-red-50 text-red-700" };

export function OwnerPurchaseOrders() {
  const [data, setData] = useState({ orders: [], pagination: { page: 1, totalPages: 0, totalCount: 0 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await getPurchaseOrders({ page, limit: 15, search: search || undefined, status: statusFilter || undefined });
      setData(result);
    } catch { toast.error("Failed to load purchase orders"); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetch(1); }, [fetch]);

  const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Purchase Orders</h1>
        <p className="text-sm text-slate-500">All dealer purchase orders</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); }} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by order number or dealer..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]" />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-[#1A7FC1] text-white rounded-lg text-sm hover:bg-[#166EA8]">Search</button>
        </form>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20">
          <option value="">All Status</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Order #</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Dealer</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Amount</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Paid</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Pending</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#1A7FC1] mx-auto" /></td></tr>
              ) : data.orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16"><ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">No purchase orders found</p></td></tr>
              ) : data.orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/60 cursor-pointer" onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                  <td className="px-4 py-3 font-mono text-xs text-[#1A7FC1]">{o.orderNumber}</td>
                  <td className="px-4 py-3"><p className="font-medium text-slate-800">{o.dealerName}</p>{o.dealerCity && <p className="text-xs text-slate-400">{o.dealerCity}</p>}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{o.orderDate ? new Date(o.orderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">{fmt(o.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{fmt(o.paidAmount)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{fmt(o.pendingAmount)}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.paymentStatus] || "bg-slate-50 text-slate-600"}`}>{o.paymentStatus}</span></td>
                  <td className="px-4 py-3 text-center text-slate-600">{o.itemCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <p className="text-xs text-slate-500">Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.totalCount} total)</p>
            <div className="flex gap-1">
              <button disabled={data.pagination.page <= 1} onClick={() => fetch(data.pagination.page - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={data.pagination.page >= data.pagination.totalPages} onClick={() => fetch(data.pagination.page + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
