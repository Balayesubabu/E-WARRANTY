import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileCheck,
  ShieldCheck,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  CircleCheckBig,
  CircleX,
  ChartColumnBig,
  ClipboardList,
} from 'lucide-react';
import { getUserDetails } from '../../services/userService';
import { getRegisteredCustomers, getActiveCustomers } from '../../services/dealerService';
import { toast } from 'sonner';

const getStatusMeta = (customer) => {
  const rawStatus = customer?.provider_warranty_code?.warranty_code_status || customer?.status;
  const normalized = String(rawStatus || '').toLowerCase();
  if (normalized === 'active' || customer?.is_active === true) {
    return { label: 'Approved', badge: 'bg-green-100 text-green-700', icon: CheckCircle2 };
  }
  if (normalized === 'rejected' || normalized === 'expired') {
    return { label: 'Rejected', badge: 'bg-red-100 text-red-700', icon: CircleX };
  }
  if (normalized === 'resolved') {
    return { label: 'Resolved', badge: 'bg-[#1A7FC1]/15 text-[#1A7FC1]', icon: CircleCheckBig };
  }
  return { label: 'Pending', badge: 'bg-amber-100 text-amber-700', icon: Clock };
};

const formatDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString();
};

export function DealerHome() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [registeredCustomers, setRegisteredCustomers] = useState([]);
  const [activeCustomers, setActiveCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    totalRegistered: 0,
    activeWarranties: 0,
    approvedToday: 0,
    rejectedCount: 0,
    resolvedCount: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const customersResponse = await getRegisteredCustomers();
      const customers = customersResponse?.data?.registered_customers || customersResponse?.data || customersResponse || [];
      const customersList = Array.isArray(customers) ? customers : [];
      setRegisteredCustomers(customersList);

      const activeResponse = await getActiveCustomers();
      const active = activeResponse?.data?.active_customers || activeResponse?.data || activeResponse || [];
      const activeList = Array.isArray(active) ? active : [];
      setActiveCustomers(activeList);

      const pendingApprovals = customersList.filter((c) => {
        const s = String(c?.provider_warranty_code?.warranty_code_status || c?.status || '').toLowerCase();
        return s === 'pending' || (!s && !c?.is_active);
      }).length;

      const rejectedCount = customersList.filter((c) => {
        const s = String(c?.provider_warranty_code?.warranty_code_status || c?.status || '').toLowerCase();
        return s === 'rejected' || s === 'expired';
      }).length;

      const resolvedCount = customersList.filter((c) => {
        const s = String(c?.provider_warranty_code?.warranty_code_status || c?.status || '').toLowerCase();
        return s === 'resolved';
      }).length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const approvedToday = activeList.filter((c) => {
        const updatedAt = new Date(c.updated_at || c.created_at);
        return updatedAt >= today;
      }).length;

      setStats({ pendingApprovals, totalRegistered: customersList.length, activeWarranties: activeList.length, approvedToday, rejectedCount, resolvedCount });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await fetchDashboardData();
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [fetchDashboardData]);

  const approvalRate = stats.totalRegistered > 0
    ? Math.round((stats.activeWarranties / stats.totalRegistered) * 100)
    : 0;

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return registeredCustomers;
    return registeredCustomers.filter((customer) => {
      const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
      const product = (customer.product_name || '').toLowerCase();
      const claimId = String(customer?.id || '').toLowerCase();
      const warrantyCode = String(customer?.warranty_code || '').toLowerCase();
      return fullName.includes(q) || product.includes(q) || claimId.includes(q) || warrantyCode.includes(q);
    });
  }, [registeredCustomers, searchQuery]);

  const monthlyReport = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts = new Array(12).fill(0);
    registeredCustomers.forEach((customer) => {
      const date = new Date(customer.created_at || customer.updated_at);
      if (!Number.isNaN(date.getTime())) {
        counts[date.getMonth()] += 1;
      }
    });
    const maxValue = Math.max(1, ...counts);
    return monthNames.map((name, index) => ({
      name, value: counts[index],
      height: `${Math.max(8, Math.round((counts[index] / maxValue) * 100))}%`,
    }));
  }, [registeredCustomers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7FC1] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Quick actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/dealer/register')}
              className="h-11 rounded-xl text-white bg-[#1A7FC1] hover:bg-[#166EA8] flex items-center justify-center gap-2 transition-colors"
            >
              <FileCheck className="w-4 h-4" />
              Register Warranty
            </button>
            <button
              onClick={() => navigate('/dealer/approvals')}
              className="h-11 rounded-xl text-white bg-[#166EA8] hover:bg-[#0F4E78] flex items-center justify-center gap-2 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Track Claims
            </button>
            <button
              onClick={() => navigate('/dealer/approvals')}
              className="h-11 rounded-xl text-slate-900 bg-amber-50 border border-amber-200 flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors"
            >
              <AlertCircle className="w-4 h-4 text-amber-700" />
              New Warranty
              <span className="w-6 h-6 rounded-full bg-[#1A7FC1] text-white text-xs flex items-center justify-center">
                {stats.pendingApprovals}
              </span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-slate-900 font-medium mb-3">Warranty Overview</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A7FC1]/10 text-[#1A7FC1] flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalRegistered}</p>
                  <p className="text-xs text-slate-500">Warranties Registered</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.pendingApprovals}</p>
                  <p className="text-xs text-slate-500">New Warranties</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{approvalRate}%</p>
                  <p className="text-xs text-slate-500">Approval Rate</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-slate-900 font-medium mb-3">Claims Summary</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <p className="text-2xl font-bold text-amber-700">{stats.pendingApprovals}</p>
                  <p className="text-xs text-slate-500">Pending</p>
                </div>
                <div className="rounded-xl bg-green-50 border border-green-100 p-3">
                  <p className="text-2xl font-bold text-green-700">{stats.activeWarranties}</p>
                  <p className="text-xs text-slate-500">Accepted</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-slate-900 font-medium mb-3">Recent Claims</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                  <p className="text-2xl font-bold text-red-700">{stats.rejectedCount}</p>
                  <p className="text-xs text-slate-500">Rejected</p>
                </div>
                <div className="rounded-xl bg-[#1A7FC1]/10 border border-[#1A7FC1]/20 p-3">
                  <p className="text-2xl font-bold text-[#1A7FC1]">{stats.resolvedCount}</p>
                  <p className="text-xs text-slate-500">Resolved</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Claims Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <p className="text-slate-900 font-medium">Recent Claims</p>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 h-9">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="bg-transparent outline-none text-sm text-slate-700 w-36"
                  />
                </div>
                <button
                  onClick={() => navigate('/dealer/approvals')}
                  className="text-sm text-[#1A7FC1] hover:underline"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left px-4 py-2">Date</th>
                    <th className="text-left px-4 py-2">Product</th>
                    <th className="text-left px-4 py-2">Claim ID</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        No claims available
                      </td>
                    </tr>
                  ) : (
                    filteredRows.slice(0, 8).map((customer, index) => {
                      const status = getStatusMeta(customer);
                      const StatusIcon = status.icon;
                      return (
                        <tr key={customer.id || index} className="border-t border-slate-100">
                          <td className="px-4 py-3 text-slate-600">{formatDate(customer.created_at)}</td>
                          <td className="px-4 py-3 text-slate-900">{customer.product_name || '-'}</td>
                          <td className="px-4 py-3 text-slate-700 font-mono text-xs">#{(customer.id || '').slice(0, 8)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.badge}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate('/dealer/approvals')}
                              className="px-3 h-8 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] text-xs transition-colors"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-900 font-medium">Monthly Report</p>
              <span className="text-xs text-slate-400">{new Date().getFullYear()}</span>
            </div>
            <div className="h-40 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="h-full flex items-end gap-1.5">
                {monthlyReport.map((item) => (
                  <div key={item.name} className="flex-1 h-full flex flex-col justify-end items-center gap-1">
                    <div
                      className="w-full rounded-sm bg-gradient-to-t from-[#1A7FC1] to-[#3A9FE1]"
                      style={{ height: item.height }}
                      title={`${item.name}: ${item.value}`}
                    />
                    <span className="text-[10px] text-slate-500">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-[#1A7FC1] text-2xl font-bold">{stats.totalRegistered.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Warranties Registered This Year</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1A7FC1]/10 text-[#1A7FC1] flex items-center justify-center">
                <ChartColumnBig className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-slate-900 font-medium">Reports</p>
                <p className="text-xs text-slate-500">Year: {new Date().getFullYear()}</p>
              </div>
              <button
                onClick={() => navigate('/dealer/reports')}
                className="px-3 h-9 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] text-sm transition-colors"
              >
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
