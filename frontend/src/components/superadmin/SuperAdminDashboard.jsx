import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Coins,
  RefreshCw,
  Loader2,
  ArrowRight,
  Store,
  ScrollText,
  Clock,
  UserCircle,
  CreditCard,
  Settings,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  getDashboardStats,
  getActivityLogs,
  getWarrantyRegistrationsChart,
} from "../../services/superAdminService";

const getTimeAgo = (ts) => {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / 604800)}w ago`;
};

const formatCurrency = (n) => {
  const num = Number(n) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartDays, setChartDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, logsRes] = await Promise.all([
        getDashboardStats().catch((e) => {
          toast.error("Failed to load dashboard stats");
          return null;
        }),
        getActivityLogs({ page: 1, limit: 10 }).catch(() => ({ logs: [] })),
      ]);
      setStats(statsData);
      setRecentLogs(logsRes?.logs || []);
    } catch {
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const toDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const fetchChart = async () => {
    setChartLoading(true);
    try {
      const res = await getWarrantyRegistrationsChart(chartDays);
      const raw = Array.isArray(res?.data) ? res.data : [];
      const start = new Date();
      start.setDate(start.getDate() - chartDays + 1);
      const filled = [];
      for (let i = 0; i < chartDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dateStr = toDateStr(d);
        const point = raw.find((r) => r.date === dateStr);
        filled.push({
          date: dateStr,
          count: point?.count ?? 0,
          label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
        });
      }
      setChartData(filled);
    } catch {
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) fetchChart();
  }, [chartDays, loading]);

  const handleRefresh = () => {
    fetchData().then(() => fetchChart());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  const s = stats || {};
  const usage = s.platformUsage || {};
  const revenue = s.revenue || {};
  const coinsSold = s.coinsSold ?? 0;
  const coinsUsed = s.coinsUsed ?? 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Platform Overview</h1>
          <p className="text-sm text-slate-500">Super Admin dashboard</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A7FC1] text-white rounded-lg hover:bg-[#166EA8] text-sm font-medium shrink-0"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Platform Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1A7FC1]/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-[#1A7FC1]" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-slate-800">{s.totalProviders ?? 0}</p>
            <p className="text-xs text-slate-500">Total Providers</p>
          </div>
        </div>
        <div
          onClick={() => navigate("/super-admin/providers")}
          className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-slate-800">{s.activeProviders ?? 0}</p>
            <p className="text-xs text-slate-500">Active Providers</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <UserCircle className="w-5 h-5 text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-slate-800">{s.totalCustomers ?? 0}</p>
            <p className="text-xs text-slate-500">Total Customers</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2">
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(revenue.total ?? 0)}</p>
          <p className="text-xs text-slate-500">Revenue</p>
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Today {formatCurrency(revenue.today ?? 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Usage */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Platform Usage</h3>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold text-slate-800">{s.totalWarrantyCodes ?? 0}</p>
              <p className="text-sm text-slate-500">Warranty Codes Generated</p>
              {usage.warrantyCodesDelta != null && (
                <p className="text-xs text-emerald-600 mt-0.5">
                  +{usage.warrantyCodesDelta} this week
                </p>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{s.totalWarranties ?? 0}</p>
              <p className="text-sm text-slate-500">Registered Warranties</p>
              {(usage.warrantiesDelta != null || usage.warrantiesPercent != null) && (
                <p className={`text-xs mt-0.5 ${(usage.warrantiesPercent ?? 0) >= 0 && (usage.warrantiesDelta ?? 0) >= 0 ? "text-emerald-600" : "text-slate-500"}`}>
                  {(() => {
                    const pct = usage.warrantiesPercent;
                    const d = usage.warrantiesDelta ?? 0;
                    if (pct === 0 && d > 0) return `+${d} this week`;
                    if (pct !== null && pct !== undefined && pct !== 0) return `${pct > 0 ? "↑" : "↓"} ${Math.abs(pct)}% this week`;
                    if (d === 0) return "No change this week";
                    return `+${d} this week`;
                  })()}
                </p>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{s.totalClaims ?? 0}</p>
              <p className="text-sm text-slate-500">Warranty Claims</p>
              {usage.claimsDelta != null && (
                <p className="text-xs text-emerald-600 mt-0.5">
                  ↑ {usage.claimsDelta} this week
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Revenue & Coins + Chart */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700">Revenue & Coins</h3>
              <button
                onClick={() => navigate("/super-admin/activity-logs?actions=coins_purchased,coins_added,coins_deducted,coin_pricing_updated")}
                className="text-sm text-[#1A7FC1] hover:underline flex items-center gap-1"
              >
                View report <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-800">{coinsSold.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Coins Sold</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-800">{coinsUsed.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Coins Used</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warranty Registrations Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700">Warranty Registrations</h3>
              <div className="relative">
                <select
                  value={chartDays}
                  onChange={(e) => setChartDays(Number(e.target.value))}
                  className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="h-48">
              {chartLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1A7FC1]" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  No data for selected period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1A7FC1" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#1A7FC1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickFormatter={(v) => {
                        const parts = String(v).split("-");
                        return parts.length === 3 ? `${parts[1]}/${parts[2]}` : v;
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.[0] ? (
                          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-sm">
                            <span className="text-slate-600">{payload[0].payload.date}</span>
                            <span className="font-semibold ml-2">{payload[0].value} registrations</span>
                          </div>
                        ) : null
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#1A7FC1"
                      strokeWidth={2}
                      fill="url(#chartGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate("/super-admin/providers")}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-left transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#1A7FC1]/10 flex items-center justify-center group-hover:bg-[#1A7FC1]/20">
                <Building2 className="w-4 h-4 text-[#1A7FC1]" />
              </div>
              <span className="text-sm font-medium text-slate-700">Manage Providers</span>
              <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
            </button>
            <button
              onClick={() => navigate("/super-admin/coin-pricing")}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-left transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20">
                <CreditCard className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">Payments & Wallets</span>
              <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
            </button>
            <button
              onClick={() => navigate("/super-admin/coin-pricing")}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-left transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-500/10 flex items-center justify-center group-hover:bg-slate-500/20">
                <Settings className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">Global Settings</span>
              <ArrowRight className="w-4 h-4 text-slate-300 ml-auto" />
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">Recent Activity</h3>
            <button
              onClick={() => navigate("/super-admin/activity-logs")}
              className="text-sm text-[#1A7FC1] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {recentLogs.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0"
                >
                  <ScrollText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      {log.action_label || log.action}
                      {log.target_name && (
                        <span className="text-slate-500"> — {log.target_name}</span>
                      )}
                      {log.details?.amount != null && (
                        <span className="text-slate-500">
                          {" "}
                          ({log.details.amount} coins)
                        </span>
                      )}
                    </p>
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {getTimeAgo(log.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
