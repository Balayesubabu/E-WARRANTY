import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ScrollText,
  Search,
  Filter,
  Loader2,
  Clock,
  User,
  Building2,
  Store,
  ShieldCheck,
  AlertTriangle,
  Coins,
  Wrench,
  RefreshCw,
} from "lucide-react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { getActivityLogs } from "../../services/superAdminService";
import { toast } from "sonner";

const ACTION_CONFIG = {
  provider_blocked: { icon: AlertTriangle, bg: "bg-red-100", text: "text-red-700" },
  provider_unblocked: { icon: ShieldCheck, bg: "bg-emerald-100", text: "text-emerald-700" },
  coins_added: { icon: Coins, bg: "bg-green-100", text: "text-green-700" },
  coins_deducted: { icon: Coins, bg: "bg-amber-100", text: "text-amber-700" },
  coins_purchased: { icon: Coins, bg: "bg-blue-100", text: "text-blue-700" },
  dealer_activated: { icon: Store, bg: "bg-emerald-100", text: "text-emerald-700" },
  dealer_deactivated: { icon: Store, bg: "bg-slate-100", text: "text-slate-600" },
  staff_activated: { icon: User, bg: "bg-emerald-100", text: "text-emerald-700" },
  staff_deactivated: { icon: User, bg: "bg-slate-100", text: "text-slate-600" },
  service_center_activated: { icon: Wrench, bg: "bg-emerald-100", text: "text-emerald-700" },
  service_center_deactivated: { icon: Wrench, bg: "bg-red-100", text: "text-red-700" },
  coin_pricing_updated: { icon: Coins, bg: "bg-indigo-100", text: "text-indigo-700" },
};

const getTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

/** Full date/time plus relative in parentheses */
const formatDateTime = (timestamp) => {
  const d = new Date(timestamp);
  const absolute = d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  const relative = getTimeAgo(timestamp);
  return `${absolute} (${relative})`;
};

const formatDetails = (details, action) => {
  if (!details || typeof details !== "object") return null;
  const parts = [];
  if (details.amount != null) parts.push(`${details.amount} coins`);
  if (details.reason) parts.push(details.reason);
  if (details.new_balance != null) parts.push(`New balance: ${details.new_balance}`);
  // Coin pricing updated
  if (details.packages_updated != null && details.packages_updated > 0)
    parts.push(`${details.packages_updated} packages updated`);
  if (details.action_costs_updated != null && details.action_costs_updated > 0)
    parts.push(`${details.action_costs_updated} action costs updated`);
  if (details.warranty_costs_updated != null) {
    const wc = details.warranty_costs_updated;
    if (typeof wc === "object") {
      const keys = Object.keys(wc).filter((k) => wc[k] != null).map((k) => `${k}mo`).join(", ");
      if (keys) parts.push(`Warranty costs (${keys}) updated`);
    } else {
      parts.push("Warranty costs updated");
    }
  }
  return parts.length ? parts.join(" · ") : null;
};

const COIN_ACTIONS = "coins_purchased,coins_added,coins_deducted,coin_pricing_updated";

export function SuperAdminActivityLogs() {
  const [searchParams] = useSearchParams();
  const actionsFromUrl = searchParams.get("actions");
  const isCoinsOnly = actionsFromUrl === COIN_ACTIONS;

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ today: 0, thisWeek: 0, total: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [search, setSearch] = useState("");

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (actionsFromUrl) {
        params.actions = actionsFromUrl;
      } else if (filterAction && filterAction !== "all") {
        params.action = filterAction;
      }
      if (filterEntity && filterEntity !== "all") params.entity_type = filterEntity;
      const res = await getActivityLogs(params);
      setLogs(res?.logs || []);
      setStats(res?.stats || { today: 0, thisWeek: 0, total: 0 });
      setPagination(res?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch {
      toast.error("Failed to load activity logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [filterAction, filterEntity, actionsFromUrl]);

  const getActorDisplay = (log) => {
    if (log.actor_role === "super_admin") return "Super Admin";
    return log.actor_name || log.target_name || null;
  };

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (log.action_label || "").toLowerCase().includes(q) ||
      (log.target_name || "").toLowerCase().includes(q) ||
      (log.actor_name || "").toLowerCase().includes(q) ||
      (log.entity_type || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-[#1A7FC1]" />
          Platform Activity Logs
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isCoinsOnly ? (
            <span className="flex items-center gap-2">
              Coin transactions
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-medium">
                <Coins className="w-3 h-3" />
                Coins only
              </span>
            </span>
          ) : (
            "Audit trail of platform actions"
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-slate-500 text-sm">Today</p>
          <p className="text-2xl font-bold text-slate-800">{stats.today ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-slate-500 text-sm">This Week</p>
          <p className="text-2xl font-bold text-[#1A7FC1]">{stats.thisWeek ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-slate-500 text-sm">Total</p>
          <p className="text-2xl font-bold text-slate-800">{stats.total ?? 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, target..."
            className="pl-10"
          />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="provider_blocked">Provider Blocked</SelectItem>
            <SelectItem value="provider_unblocked">Provider Unblocked</SelectItem>
            <SelectItem value="coins_added">Coins Added</SelectItem>
            <SelectItem value="coins_deducted">Coins Deducted</SelectItem>
            <SelectItem value="coins_purchased">Coins Purchased (Razorpay)</SelectItem>
            <SelectItem value="dealer_activated">Dealer Activated</SelectItem>
            <SelectItem value="dealer_deactivated">Dealer Deactivated</SelectItem>
            <SelectItem value="staff_activated">Staff Activated</SelectItem>
            <SelectItem value="staff_deactivated">Staff Deactivated</SelectItem>
            <SelectItem value="service_center_activated">Service Center Activated</SelectItem>
            <SelectItem value="service_center_deactivated">Service Center Deactivated</SelectItem>
            <SelectItem value="coin_pricing_updated">Coin Pricing Updated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="provider">Provider</SelectItem>
            <SelectItem value="dealer">Dealer</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="service_center">Service Center</SelectItem>
            <SelectItem value="coin_pricing">Coin Pricing</SelectItem>
          </SelectContent>
        </Select>
        <button
          onClick={() => fetchData(pagination.page)}
          className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Logs */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <ScrollText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {logs.length === 0 ? "No activity logs yet" : "No logs match your filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const cfg = ACTION_CONFIG[log.action] || {
              icon: Clock,
              bg: "bg-slate-100",
              text: "text-slate-600",
            };
            const Icon = cfg.icon;
            const detailsStr = formatDetails(log.details, log.action);
            const actorDisplay = getActorDisplay(log);
            return (
              <div
                key={log.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${cfg.bg} ${cfg.text} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                    <h3 className="font-medium text-slate-900">{log.action_label || log.action}</h3>
                    <span className="text-slate-500 text-xs shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                  {actorDisplay && (
                    <p className="text-slate-600 text-sm mt-1">
                      <Building2 className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      {actorDisplay}
                    </p>
                  )}
                  {!actorDisplay && log.target_name && (
                    <p className="text-slate-600 text-sm mt-1">
                      <Building2 className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      {log.target_name}
                    </p>
                  )}
                  {detailsStr && (
                    <p className="text-slate-500 text-sm mt-1">{detailsStr}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchData(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              onClick={() => fetchData(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
