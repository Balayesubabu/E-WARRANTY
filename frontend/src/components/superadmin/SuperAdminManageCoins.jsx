import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Coins,
  Plus,
  Minus,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  getProviderCoins,
  addCoins,
  deductCoins,
} from "../../services/superAdminService";

const formatDateTime = (d) => (d ? new Date(d).toLocaleString() : "");

export function SuperAdminManageCoins() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [providerName, setProviderName] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addReason, setAddReason] = useState("");
  const [deductAmount, setDeductAmount] = useState("");
  const [deductReason, setDeductReason] = useState("");
  const [acting, setActing] = useState(false);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const pagination = data?.pagination ?? { page: 1, limit: 20, total: 0, total_pages: 0 };
  const transactions = Array.isArray(data?.transactions) ? data.transactions : [];
  const balance = data?.balance ?? 0;

  const fetchData = useCallback(async (pageOverride = null) => {
    if (!providerId) return;
    const p = pageOverride ?? page;
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (typeFilter === "CREDIT" || typeFilter === "DEBIT") params.type = typeFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await getProviderCoins(providerId, params);
      setData(res);
    } catch {
      toast.error("Failed to load provider coins");
      navigate("/super-admin/providers");
    } finally {
      setLoading(false);
    }
  }, [providerId, page, typeFilter, dateFrom, dateTo, navigate]);

  useEffect(() => {
    setProviderName(location?.state?.providerName || "Provider");
  }, [location?.state?.providerName]);

  useEffect(() => {
    fetchData(page);
  }, [providerId, page, typeFilter, dateFrom, dateTo, fetchData]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.total_pages) return;
    setPage(newPage);
  };

  const handleApplyFilters = () => {
    setPage(1);
  };

  const handleClearFilters = () => {
    setTypeFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const amt = parseInt(addAmount, 10);
    if (!amt || amt < 1) {
      toast.error("Enter a valid amount");
      return;
    }
    setActing(true);
    try {
      await addCoins(providerId, amt, addReason || "Admin credit");
      toast.success(`${amt} coins added`);
      setAddAmount("");
      setAddReason("");
      setPage(1);
      fetchData(1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add coins");
    } finally {
      setActing(false);
    }
  };

  const handleDeduct = async (e) => {
    e.preventDefault();
    const amt = parseInt(deductAmount, 10);
    if (!amt || amt < 1) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amt > balance) {
      toast.error("Amount exceeds current balance");
      return;
    }
    setActing(true);
    try {
      await deductCoins(providerId, amt, deductReason || "Admin debit");
      toast.success(`${amt} coins deducted`);
      setDeductAmount("");
      setDeductReason("");
      setPage(1);
      fetchData(1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to deduct coins");
    } finally {
      setActing(false);
    }
  };

  const getActionLabel = (action, refType) => {
    if (action === "ADMIN_CREDIT") return "Admin credit";
    if (action === "ADMIN_DEBIT") return "Admin debit";
    if (refType === "super_admin") return "Admin";
    return action || "—";
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <button
        onClick={() => navigate("/super-admin/providers")}
        className="flex items-center gap-2 text-slate-600 hover:text-[#1A7FC1] text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Providers
      </button>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#1A7FC1]/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-[#1A7FC1]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Manage Coins</h1>
          <p className="text-sm text-slate-500">{providerName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-700">Current Balance</h3>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#1A7FC1]" />
                <span className="text-2xl font-bold text-slate-800">{balance}</span>
                <span className="text-slate-500 text-sm">coins</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500">Total Earned</p>
                <p className="font-semibold text-slate-800">{data?.total_earned ?? 0}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-500">Total Spent</p>
                <p className="font-semibold text-slate-800">{data?.total_spent ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <form onSubmit={handleAdd} className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" /> Add Coins
              </h4>
              <input
                type="number"
                min="1"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Amount"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
              />
              <input
                type="text"
                value={addReason}
                onChange={(e) => setAddReason(e.target.value)}
                placeholder="Reason (optional)"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
              />
              <button
                type="submit"
                disabled={acting || !addAmount}
                className="w-full py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </form>

            <form onSubmit={handleDeduct} className="bg-white rounded-xl border border-slate-200 p-5">
              <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Minus className="w-4 h-4 text-red-500" /> Deduct Coins
              </h4>
              <input
                type="number"
                min="1"
                max={balance}
                value={deductAmount}
                onChange={(e) => setDeductAmount(e.target.value)}
                placeholder="Amount"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
              />
              <input
                type="text"
                value={deductReason}
                onChange={(e) => setDeductReason(e.target.value)}
                placeholder="Reason (optional)"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
              />
              <button
                type="submit"
                disabled={acting || !deductAmount || parseInt(deductAmount, 10) > balance}
                className="w-full py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
                Deduct
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Transaction History</h3>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
            >
              <option value="">All types</option>
              <option value="CREDIT">Credit</option>
              <option value="DEBIT">Debit</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
              placeholder="To"
            />
            <button
              onClick={handleApplyFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1A7FC1] text-white text-sm hover:bg-[#166EA8]"
            >
              <Filter className="w-3.5 h-3.5" /> Apply
            </button>
            {(typeFilter || dateFrom || dateTo) && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm"
              >
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#1A7FC1]" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-slate-500">No transactions yet</p>
          ) : (
            <>
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {t.description || getActionLabel(t.action, t.reference_type)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-400">{formatDateTime(t.created_at)}</p>
                        {t.reference_type === "super_admin" && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-slate-500">
                            <User className="w-3 h-3" /> Admin
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold shrink-0 ml-2 ${
                        (t.type || "").toLowerCase().includes("credit") || (t.amount || 0) > 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {(t.amount || 0) > 0 ? "+" : "-"}
                      {Math.abs(t.amount ?? 0)}
                    </span>
                  </div>
                ))}
              </div>

              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Page {pagination.page} of {pagination.total_pages} ({pagination.total} total)
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= pagination.total_pages}
                      className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
