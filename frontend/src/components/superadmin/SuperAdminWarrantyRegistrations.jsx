import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Search, Loader2, ChevronLeft, ChevronRight, Filter, ShieldOff, X, Download } from "lucide-react";
import { toast } from "sonner";
import { getWarrantyRegistrations, getProviders, exportWarrantyRegistrations } from "../../services/superAdminService";

function toLocalDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDateRange(preset, dateFrom, dateTo) {
  if (!preset || preset === "") return {};
  const now = new Date();
  const todayStr = toLocalDateStr(now);
  if (preset === "today") return { date_from: todayStr, date_to: todayStr };
  if (preset === "1week") {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    return { date_from: toLocalDateStr(from), date_to: todayStr };
  }
  if (preset === "1month") {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    return { date_from: toLocalDateStr(from), date_to: todayStr };
  }
  if (preset === "custom" && dateFrom && dateTo) {
    return { date_from: dateFrom, date_to: dateTo };
  }
  return {};
}

export function SuperAdminWarrantyRegistrations() {
  const [data, setData] = useState({ items: [], pagination: { page: 1, totalPages: 0, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [datePreset, setDatePreset] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [providers, setProviders] = useState([]);

  const dateRange = getDateRange(datePreset, dateFrom, dateTo);

  useEffect(() => {
    getProviders({ page: 1, limit: 500 })
      .then((res) => setProviders(res?.providers ?? []))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const result = await getWarrantyRegistrations({
          page,
          limit: 20,
          search: search || undefined,
          provider_id: providerFilter || undefined,
          ...dateRange,
        });
        setData({
          items: result?.items ?? [],
          pagination: result?.pagination ?? { page: 1, totalPages: 0, total: 0 },
        });
      } catch {
        toast.error("Failed to load registered warranties");
      } finally {
        setLoading(false);
      }
    },
    [search, providerFilter, datePreset, dateFrom, dateTo]
  );

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const hasFilters = search || providerFilter || datePreset;

  const handleExportCsv = async () => {
    if (data.items.length === 0) {
      toast.error("No data to export. Try adjusting your filters or date range.");
      return;
    }
    try {
      toast.info("Preparing export...");
      const blob = await exportWarrantyRegistrations({
        provider_id: providerFilter || undefined,
        search: search || undefined,
        ...dateRange,
      });
      const url = URL.createObjectURL(new Blob([blob], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `registered-warranties-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (err) {
      const msg = err?.response?.status === 400
        ? "No data to export. Try adjusting your filters or date range."
        : (err?.response?.data?.message || "Failed to export");
      toast.error(msg);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Registered Warranties</h1>
        <p className="text-sm text-slate-500">All customer-registered warranties across providers — view and export</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
            }}
            className="flex-1 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by serial, warranty code, name, phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-[#1A7FC1] text-white rounded-lg text-sm hover:bg-[#166EA8]">
              Search
            </button>
          </form>
          <div className="flex gap-2">
            <button
              onClick={handleExportCsv}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#1A7FC1] text-[#1A7FC1] rounded-lg hover:bg-[#1A7FC1]/5 text-sm disabled:opacity-60"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm ${
                showFilters || hasFilters ? "bg-[#1A7FC1]/10 border-[#1A7FC1]/30 text-[#1A7FC1]" : "border-slate-200 text-slate-600"
              }`}
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Provider</label>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">All Providers</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.company_name || p.business_name || p.email || p.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Date range</label>
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">All time</option>
                <option value="today">Today</option>
                <option value="1week">Last 1 week</option>
                <option value="1month">Last 1 month</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            {datePreset === "custom" && (
              <>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1 block">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1 block">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </>
            )}
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setProviderFilter("");
                  setDatePreset("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-xs text-red-500 flex items-center gap-1 self-end"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Serial #</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Warranty Code</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Provider</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Dealer</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Start</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Expiry</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Claims</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1A7FC1] mx-auto" />
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">No registered warranties found</p>
                  </td>
                </tr>
              ) : (
                data.items.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{w.customerName}</p>
                      <p className="text-xs text-slate-400">{w.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{w.productName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{w.serialNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 hidden lg:table-cell">{w.warrantyCode}</td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{w.providerName}</td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{w.dealerName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                      {w.warrantyFrom ? new Date(w.warrantyFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                      {w.warrantyTo ? new Date(w.warrantyTo).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          w.warrantyStatus === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {w.warrantyStatus === "Active" ? <ShieldCheck className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                        {w.warrantyStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {w.claimsCount > 0 ? (
                        <span className="w-6 h-6 rounded-full bg-red-50 text-red-600 text-xs font-bold inline-flex items-center justify-center">{w.claimsCount}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data.pagination.totalPages > 1 && (
          <div className="flex justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <p className="text-xs text-slate-500">Page {data.pagination.page} of {data.pagination.totalPages}</p>
            <div className="flex gap-1">
              <button
                disabled={data.pagination.page <= 1}
                onClick={() => fetchData(data.pagination.page - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={data.pagination.page >= data.pagination.totalPages}
                onClick={() => fetchData(data.pagination.page + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
