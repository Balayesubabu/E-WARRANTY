import { useState, useEffect } from "react";
import { Package, Search, Loader2, ArrowUpDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getInventoryMovement } from "../../services/ownerConsoleService";

export function OwnerInventoryMovement() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortField, setSortField] = useState("productName");
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => {
    setLoading(true);
    getInventoryMovement({ search: search || undefined })
      .then(setData)
      .catch(() => toast.error("Failed to load inventory"))
      .finally(() => setLoading(false));
  }, [search]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const sorted = [...data].sort((a, b) => {
    const av = a[sortField] ?? "";
    const bv = b[sortField] ?? "";
    if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
    return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const totalSent = data.reduce((s, r) => s + r.quantitySent, 0);
  const totalSold = data.reduce((s, r) => s + r.quantitySold, 0);
  const totalAvail = data.reduce((s, r) => s + r.availableStock, 0);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Inventory Movement</h1>
        <p className="text-sm text-slate-500">Stock tracking across all dealers</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Total Sent</p><p className="text-2xl font-bold text-slate-800">{totalSent}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Total Sold</p><p className="text-2xl font-bold text-emerald-600">{totalSold}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Available Stock</p><p className="text-2xl font-bold text-[#1A7FC1]">{totalAvail}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by product, model or dealer..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
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
                {[
                  { key: "productName", label: "Product" },
                  { key: "modelNumber", label: "Model" },
                  { key: "dealerName", label: "Dealer" },
                  { key: "quantitySent", label: "Qty Sent" },
                  { key: "quantitySold", label: "Qty Sold" },
                  { key: "availableStock", label: "Available" },
                ].map((col) => (
                  <th key={col.key} className={`${col.key === "quantitySent" || col.key === "quantitySold" || col.key === "availableStock" ? "text-right" : "text-left"} px-4 py-3 font-semibold text-slate-600`}>
                    <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 hover:text-[#1A7FC1]">
                      {col.label} <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#1A7FC1] mx-auto" /></td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16"><Package className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">No inventory data</p></td></tr>
              ) : sorted.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.productName}</td>
                  <td className="px-4 py-3 text-slate-600">{r.modelNumber || "—"}</td>
                  <td className="px-4 py-3"><p className="text-slate-700">{r.dealerName}</p>{r.dealerCity && <p className="text-xs text-slate-400">{r.dealerCity}</p>}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">{r.quantitySent}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{r.quantitySold}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${r.availableStock <= 0 ? "text-red-600" : r.availableStock < 5 ? "text-amber-600" : "text-[#1A7FC1]"}`}>
                      {r.availableStock}
                    </span>
                    {r.availableStock <= 0 && <AlertTriangle className="w-3 h-3 text-red-500 inline ml-1" />}
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
