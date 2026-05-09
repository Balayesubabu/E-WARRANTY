import { useState, useEffect } from "react";
import { Search, RefreshCw, Loader2, FileCode, Download, Filter } from "lucide-react";
import { toast } from "sonner";
import { getWarrantyCodes, getProviders, exportWarrantyCodes } from "../../services/superAdminService";

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

export function SuperAdminWarrantyCodes() {
  const [codes, setCodes] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [providerFilter, setProviderFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [datePreset, setDatePreset] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const dateRange = getDateRange(datePreset, dateFrom, dateTo);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [codesRes, providersRes] = await Promise.all([
        getWarrantyCodes({
          page,
          limit: 20,
          provider_id: providerFilter || undefined,
          search: searchTerm || undefined,
          ...dateRange,
        }),
        getProviders({ page: 1, limit: 500 }).catch(() => ({ providers: [] })),
      ]);
      setCodes(codesRes?.codes ?? []);
      setTotalPages(codesRes?.pagination?.totalPages ?? 1);
      setProviders(providersRes?.providers ?? []);
    } catch {
      toast.error("Failed to load warranty codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, providerFilter, datePreset, dateFrom, dateTo]);

  const handleSearch = (e) => {
    e?.preventDefault?.();
    setPage(1);
    fetchData();
  };

  const handleExportCsv = async () => {
    if (codes.length === 0) {
      toast.error("No data to export. Try adjusting your filters or date range.");
      return;
    }
    try {
      toast.info("Preparing export...");
      const blob = await exportWarrantyCodes({
        provider_id: providerFilter || undefined,
        search: searchTerm || undefined,
        ...dateRange,
      });
      const url = URL.createObjectURL(new Blob([blob], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `warranty-codes-${new Date().toISOString().slice(0, 10)}.csv`;
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
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Warranty Codes</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-[#1A7FC1] text-[#1A7FC1] rounded-lg hover:bg-[#1A7FC1]/5 text-sm disabled:opacity-60"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A7FC1] text-white rounded-lg hover:bg-[#166EA8] text-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code, product, serial..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30"
            />
          </div>
          <select
            value={providerFilter}
            onChange={(e) => { setProviderFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30"
          >
            <option value="">All Providers</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.company_name || p.business_name || p.email || p.id}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${showFilters || datePreset ? "bg-[#1A7FC1]/10 border-[#1A7FC1]/30 text-[#1A7FC1]" : "border-slate-200 text-slate-600"}`}
          >
            <Filter className="w-4 h-4" /> Date
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#1A7FC1] text-white rounded-lg hover:bg-[#166EA8] text-sm"
          >
            Search
          </button>
        </form>
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-slate-500 font-medium mb-1 block">Date range</label>
              <select
                value={datePreset}
                onChange={(e) => {
                  setDatePreset(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
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
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium mb-1 block">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
        </div>
      ) : codes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No warranty codes found</p>
          <p className="text-sm text-slate-400 mt-1">Codes are created by providers</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Provider</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-slate-700">{c.warranty_code || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{c.product_name || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{c.provider?.company_name || c.provider?.user?.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          c.warranty_code_status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                          c.warranty_code_status === "USED" ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.warranty_code_status || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
