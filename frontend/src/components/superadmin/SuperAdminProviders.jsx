import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Building2, Ban, CheckCircle, Coins, ChevronRight, ArrowLeft, Users, UserCog, UserCheck, Wrench, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { getProviders, blockProvider, unblockProvider } from "../../services/superAdminService";

export function SuperAdminProviders() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actingId, setActingId] = useState(null);
  const [blockModal, setBlockModal] = useState({ open: false, provider: null });
  const [blockReason, setBlockReason] = useState("");

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await getProviders(params);
      setProviders(data?.providers ?? data ?? []);
    } catch {
      toast.error("Failed to load providers");
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e?.preventDefault();
    fetchProviders();
  };

  const openBlockModal = (provider) => {
    setBlockModal({ open: true, provider });
    setBlockReason("");
  };

  const closeBlockModal = () => {
    setBlockModal({ open: false, provider: null });
    setBlockReason("");
  };

  const handleBlockConfirm = async () => {
    if (!blockModal.provider || actingId) return;
    const trimmed = blockReason.trim();
    if (!trimmed || trimmed.length < 10) {
      toast.error("Please provide a reason (minimum 10 characters)");
      return;
    }
    const provider = blockModal.provider;
    setActingId(provider.id);
    try {
      await blockProvider(provider.id, trimmed);
      toast.success(provider.company_name + " has been blocked. Email notification sent.");
      closeBlockModal();
      fetchProviders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to block provider");
    } finally {
      setActingId(null);
    }
  };

  const handleUnblock = async (provider) => {
    if (actingId) return;
    setActingId(provider.id);
    try {
      await unblockProvider(provider.id);
      toast.success(provider.company_name + " has been unblocked");
      fetchProviders();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to unblock provider");
    } finally {
      setActingId(null);
    }
  };

  const handleManageCoins = (p) => {
    navigate("/super-admin/providers/" + p.id + "/coins", {
      state: { providerName: p.company_name || p.email || "Provider" },
    });
  };

  const handleViewDetail = (p) => {
    navigate("/super-admin/providers/" + p.id + "/detail");
  };

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString();
  };

  if (loading && providers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <button
        onClick={() => navigate("/super-admin")}
        className="flex items-center gap-2 text-slate-600 hover:text-[#1A7FC1] text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Providers</h1>
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, email..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-[#1A7FC1] text-white rounded-lg hover:bg-[#166EA8] text-sm">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
        </div>
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-white rounded-xl border border-slate-200">
          <Building2 className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm font-medium">No providers found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => {
            const isActing = actingId === p.id;
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-slate-800 truncate flex-1 min-w-0">
                      {p.company_name || "Unnamed"}
                    </h3>
                    {p.is_blocked ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <Ban className="w-3 h-3" /> Blocked
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 truncate mb-3">{p.email || p.user_name || "-"}</p>
                  {p.company_address && (
                    <p className="text-xs text-slate-400 truncate mb-3">{p.company_address}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium">
                      <Coins className="w-3.5 h-3.5" />
                      {p.coin_balance ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium" title="Dealers">
                      <Users className="w-3.5 h-3.5" />
                      {p.dealers_count ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium" title="Staff">
                      <UserCog className="w-3.5 h-3.5" />
                      {p.staff_count ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium" title="Customers">
                      <UserCheck className="w-3.5 h-3.5" />
                      {p.customers_count ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium" title="Service Centers">
                      <Wrench className="w-3.5 h-3.5" />
                      {p.service_centers_count ?? 0}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-auto">Joined {formatDate(p.created_at)}</p>
                </div>
                <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {p.is_blocked ? (
                      <button
                        onClick={() => handleUnblock(p)}
                        disabled={isActing}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline disabled:opacity-50 flex items-center gap-1"
                      >
                        {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Unblock
                      </button>
                    ) : (
                      <button
                        onClick={() => openBlockModal(p)}
                        disabled={isActing}
                        className="text-xs font-medium text-amber-700 hover:text-amber-800 hover:underline disabled:opacity-50 flex items-center gap-1"
                      >
                        {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                        Block
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetail(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Detail
                    </button>
                    <button
                      onClick={() => handleManageCoins(p)}
                      className="px-3 py-1.5 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                      Coins
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={blockModal.open} onOpenChange={(open) => !open && closeBlockModal()}>
        <DialogContent className="sm:max-w-md bg-white rounded-xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-800">
              Block Provider
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {blockModal.provider && (
              <p className="text-sm text-slate-600">
                You are about to block <span className="font-medium">{blockModal.provider.company_name || "this provider"}</span>.
                The owner will receive an email notification including the reason below.
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Reason <span className="text-red-500">*</span> <span className="text-slate-500 font-normal">(included in email to owner)</span>
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g. Policy violation, payment overdue..."
                rows={3}
                required
                minLength={10}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1] resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 10 characters. This reason will be sent to the owner.</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={closeBlockModal}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBlockConfirm}
              disabled={actingId || !blockReason.trim() || blockReason.trim().length < 10}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {actingId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Confirm Block
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
