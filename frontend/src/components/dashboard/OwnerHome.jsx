import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  BarChart3,
  Store,
  Users,
  Settings,
  LayoutDashboard,
  FileText,
  Search,
  BellRing,
  Ticket,
  ClipboardCheck,
  Wrench,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { getUserDetails } from '../../services/userService';
import { getDealers } from '../../services/ownerService';
import { getProviderWarrantyCodes } from '../../services/warrantyCodeService';
import { getAllSupportTickets } from '../../services/staffService';
import api from '../../utils/api';

const getClaimStatus = (customer) => {
  const raw = String(customer?.provider_warranty_code?.warranty_code_status || customer?.status || '').toLowerCase();
  if (raw === 'active') return 'Approved';
  if (raw === 'rejected' || raw === 'expired') return 'Rejected';
  if (raw === 'resolved') return 'Resolved';
  if (raw === 'in progress' || raw === 'under review') return 'Under Review';
  if (customer?.is_active === true) return 'Approved';
  return 'Pending';
};

const statusClass = (status) => {
  const key = String(status || '').toLowerCase();
  if (key === 'approved' || key === 'active') return 'bg-emerald-100 text-emerald-700';
  if (key === 'rejected') return 'bg-red-100 text-red-700';
  if (key === 'resolved') return 'bg-blue-100 text-blue-700';
  if (key === 'under review' || key === 'in progress') return 'bg-violet-100 text-violet-700';
  return 'bg-amber-100 text-amber-700';
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

export function OwnerHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWarranties: 0,
    activeDealers: 0,
    totalCustomers: 0,
    totalStaff: 0,
    pendingClaims: 0,
    activeCustomers: 0,
    pendingTickets: 0,
  });
  const [recentDealers, setRecentDealers] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [dashboardMeta, setDashboardMeta] = useState({
    totalDealers: 0,
    inactiveDealers: 0,
    failedSources: 0,
    lastUpdated: null,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        getUserDetails(),
        getDealers(),
        getProviderWarrantyCodes(),
        api.get('/e-warranty/warranty-customer/get-registered-customers'),
        api.get('/staff/get-all-staff-details'),
        getAllSupportTickets(),
      ]);

      if (results[0].status === 'fulfilled') {
        setUser(results[0].value);
      }

      let dealerList = [];
      let activeDealerCount = 0;
      let inactiveDealerCount = 0;
      if (results[1].status === 'fulfilled') {
        const dealersData = results[1].value?.data || [];
        dealerList = Array.isArray(dealersData) ? dealersData : [];
        activeDealerCount = dealerList.filter((d) => d.is_active !== false).length;
        inactiveDealerCount = dealerList.filter((d) => d.is_active === false).length;
        setRecentDealers(dealerList.slice(0, 5));
      }

      let totalWarranties = 0;
      if (results[2].status === 'fulfilled') {
        const warrantyCodes = results[2].value?.data?.warranty_codes || [];
        totalWarranties = Array.isArray(warrantyCodes) ? warrantyCodes.length : 0;
      }

      let customerList = [];
      let uniqueCustomerCount = 0;
      if (results[3].status === 'fulfilled') {
        const resData = results[3].value?.data?.data;
        const customers = resData?.registered_customers || [];
        customerList = Array.isArray(customers) ? customers : [];
        uniqueCustomerCount = typeof resData?.unique_customer_count === 'number' ? resData.unique_customer_count : customerList.length;
        setRecentCustomers(
          [...customerList]
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 8)
        );
      }

      let totalStaff = 0;
      if (results[4].status === 'fulfilled') {
        const staffList = results[4].value?.data?.data || [];
        totalStaff = Array.isArray(staffList)
          ? staffList.filter((staffMember) => staffMember?.is_active !== false).length
          : 0;
      }

      let pendingTickets = 0;
      if (results[5].status === 'fulfilled') {
        const ticketsRaw = results[5].value?.data || [];
        const tickets = Array.isArray(ticketsRaw) ? ticketsRaw : [];
        pendingTickets = tickets.filter((ticket) => {
          const s = String(ticket?.status || '').toLowerCase();
          return s === 'open' || s === 'pending' || s === 'in progress';
        }).length;
      }

      const pendingClaims = customerList.filter((customer) => {
        const status = String(customer?.provider_warranty_code?.warranty_code_status || customer?.status || '').toLowerCase();
        return status === 'pending' || (!status && customer?.is_active !== true);
      }).length;

      const activeCustomers = customerList.filter((customer) => {
        const status = String(customer?.provider_warranty_code?.warranty_code_status || customer?.status || '').toLowerCase();
        return status === 'active' || customer?.is_active === true;
      }).length;

      setStats({
        totalWarranties,
        activeDealers: activeDealerCount,
        totalCustomers: uniqueCustomerCount,
        totalStaff,
        pendingClaims,
        activeCustomers,
        pendingTickets,
      });

      setDashboardMeta({
        totalDealers: dealerList.length,
        inactiveDealers: inactiveDealerCount,
        failedSources: results.filter((result) => result.status === 'rejected').length,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load some dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const sidebarItems = [
    { label: 'Dashboard', icon: LayoutDashboard, route: '/home' },
    { label: 'Claims', icon: ClipboardCheck, route: '/warranty-claims' },
    { label: 'Claim Mgmt', icon: Wrench, route: '/claim-management' },
    { label: 'Tickets', icon: Ticket, route: '/support-tickets' },
    { label: 'Warranties', icon: FileText, route: '/warranty-codes' },
    { label: 'Dealers', icon: Store, route: '/dealer-management' },
    { label: 'Staff', icon: Users, route: '/staff' },
    { label: 'Customers', icon: Users, route: '/owner-register-customer' },
    { label: 'Reports', icon: BarChart3, route: '/analytics' },
    { label: 'Settings', icon: Settings, route: '/warranty-settings' },
  ];

  const dealerActivationRate = dashboardMeta.totalDealers > 0
    ? Math.round((stats.activeDealers / dashboardMeta.totalDealers) * 100)
    : 0;

  const filteredClaims = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recentCustomers;
    return recentCustomers.filter((customer) => {
      const name = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
      const product = String(customer.product_name || '').toLowerCase();
      const code = String(customer.warranty_code || '').toLowerCase();
      return name.includes(q) || product.includes(q) || code.includes(q);
    });
  }, [recentCustomers, searchQuery]);

  const reportSeries = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const baseClaims = [180, 220, 250, 210, 290, 260];
    const baseRegistrations = [150, 180, 230, 260, 240, 300];
    const baseDealers = [80, 95, 120, 135, 140, 160];
    const scale = Math.max(1, Math.round(stats.totalCustomers / 6));
    return months.map((month, idx) => ({
      month,
      claims: baseClaims[idx] + Math.round(scale * 0.8),
      registrations: baseRegistrations[idx] + Math.round(scale),
      dealers: baseDealers[idx] + Math.round(scale * 0.5),
    }));
  }, [stats.totalCustomers]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7FC1] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Unable to load user data</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-[#1A7FC1] text-white rounded-lg hover:bg-[#166EA8]"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-[#0F4E78]">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#1A7FC1] border-r border-[#166EA8] text-white">
          <div className="h-16 px-5 flex items-center gap-2.5 border-b border-[#166EA8]">
            <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-8 w-auto shrink-0" />
            <span className="font-semibold text-lg">E-Warrantify</span>
          </div>
          <nav className="p-3 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.route === '/home';
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.route)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#166EA8] text-white'
                      : 'text-white/85 hover:bg-[#166EA8] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-auto p-3 border-t border-[#166EA8]">
            <div className="rounded-xl bg-[#166EA8] border border-[#0F5F91] p-3">
              <p className="text-xs text-white/85">Need Help?</p>
              <button
                onClick={() => navigate('/support-tickets')}
                className="mt-2 w-full h-9 rounded-lg bg-[#1A7FC1] hover:bg-[#1470AB] text-white text-sm"
              >
                Contact Support
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <header className="h-16 px-4 lg:px-6 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-base lg:text-lg font-semibold">Welcome back, {user?.fullname || 'Owner'}</h1>
              <span className="hidden md:inline text-sm text-slate-500">Owner Console</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 h-10">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="bg-transparent outline-none text-sm text-[#1A7FC1] w-44"
                />
              </div>
              <button className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                <BellRing className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-full bg-slate-100 text-[#1A7FC1] flex items-center justify-center"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>
          </header>

          <div className="p-4 lg:p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-slate-500 text-sm">Pending Claims</p>
                <p className="text-2xl font-semibold text-[#0F4E78]">{stats.pendingClaims}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-slate-500 text-sm">Open Tickets</p>
                <p className="text-2xl font-semibold text-[#0F4E78]">{stats.pendingTickets}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-slate-500 text-sm">Active Customers</p>
                <p className="text-2xl font-semibold text-[#0F4E78]">{stats.activeCustomers}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-slate-500 text-sm">Active Dealers</p>
                <p className="text-2xl font-semibold text-[#0F4E78]">{stats.activeDealers}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2 space-y-5">
                <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-[#0F4E78]">Work Queue Snapshot</h3>
                    <span className="text-xs text-slate-500">Updated now</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <p className="text-slate-500 text-sm">Pending Claims</p>
                      <p className="text-2xl text-[#0F4E78] font-semibold">{stats.pendingClaims}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <p className="text-slate-500 text-sm">Open Tickets</p>
                      <p className="text-2xl text-[#0F4E78] font-semibold">{stats.pendingTickets}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <p className="text-slate-500 text-sm">Total Customers</p>
                      <p className="text-2xl text-[#0F4E78] font-semibold">{stats.totalCustomers}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
                    <button
                      onClick={() => navigate('/owner-register-customer')}
                      className="h-10 rounded-lg bg-[#1A7FC1] text-white text-sm hover:bg-[#166EA8]"
                    >
                      Register Customer
                    </button>
                    <button
                      onClick={() => navigate('/verify')}
                      className="h-10 rounded-lg border border-slate-300 bg-white text-[#1A7FC1] text-sm hover:bg-slate-50"
                    >
                      Verify a Product
                    </button>
                    <button
                      onClick={() => navigate('/dealer-management')}
                      className="h-10 rounded-lg border border-slate-300 bg-white text-[#1A7FC1] text-sm hover:bg-slate-50"
                    >
                      Manage Dealers
                    </button>
                    <button
                      onClick={() => navigate('/staff')}
                      className="h-10 rounded-lg border border-slate-300 bg-white text-[#1A7FC1] text-sm hover:bg-slate-50"
                    >
                      Manage Staff
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-semibold text-[#0F4E78]">Latest Warranty Claims</h3>
                    <button
                      onClick={() => navigate('/warranty-claims')}
                      className="text-sm text-[#1A7FC1] hover:text-[#166EA8]"
                    >
                      View All Claims
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="text-left px-4 py-2">Date</th>
                          <th className="text-left px-4 py-2">Customer</th>
                          <th className="text-left px-4 py-2">Product</th>
                          <th className="text-left px-4 py-2">Status</th>
                          <th className="text-left px-4 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClaims.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                              No claim records available
                            </td>
                          </tr>
                        ) : (
                          filteredClaims.slice(0, 8).map((customer, idx) => {
                            const claimStatus = getClaimStatus(customer);
                            return (
                              <tr key={customer.id || idx} className="border-t border-slate-100">
                                <td className="px-4 py-3 text-slate-600">{formatDate(customer.created_at)}</td>
                                <td className="px-4 py-3 text-[#0F4E78]">
                                  {`${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer'}
                                </td>
                                <td className="px-4 py-3 text-[#1A7FC1]">{customer.product_name || '-'}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusClass(claimStatus)}`}>
                                    {claimStatus}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => navigate('/warranty-claims')}
                                      className="px-3 h-8 rounded-md bg-[#1A7FC1] hover:bg-[#166EA8] text-white text-xs"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => navigate('/warranty-claims')}
                                      className="px-3 h-8 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-[#1A7FC1] text-xs"
                                    >
                                      Review
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#0F4E78]">System Overview</h3>
                    <span className="text-xs text-slate-500">Updated now</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <p className="text-slate-500 text-xs">Total Warranties</p>
                      <p className="text-xl text-[#0F4E78]">{stats.totalWarranties}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <p className="text-slate-500 text-xs">Claims In Progress</p>
                      <p className="text-xl text-[#0F4E78]">{stats.pendingClaims}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <p className="text-slate-500 text-xs">Customers Registered</p>
                      <p className="text-xl text-[#0F4E78]">{stats.totalCustomers}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <p className="text-slate-500 text-xs">Active Dealers</p>
                      <p className="text-xl text-[#0F4E78]">{stats.activeDealers}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#0F4E78]">Activity Overview</h3>
                    <span className="text-xs text-slate-500">{new Date().getFullYear()}</span>
                  </div>
                  <div className="h-44 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="h-full grid grid-cols-6 gap-2 items-end">
                      {reportSeries.map((item) => {
                        const maxVal = 340;
                        const claimsHeight = `${Math.max(10, Math.round((item.claims / maxVal) * 100))}%`;
                        const registrationsHeight = `${Math.max(10, Math.round((item.registrations / maxVal) * 100))}%`;
                        const dealersHeight = `${Math.max(10, Math.round((item.dealers / maxVal) * 100))}%`;
                        return (
                          <div key={item.month} className="flex flex-col items-center justify-end gap-1 h-full">
                            <div className="w-full flex items-end justify-center gap-1 h-full">
                              <div className="w-1.5 rounded bg-slate-500/80" style={{ height: claimsHeight }} />
                              <div className="w-1.5 rounded bg-slate-400/80" style={{ height: registrationsHeight }} />
                              <div className="w-1.5 rounded bg-slate-300/90" style={{ height: dealersHeight }} />
                            </div>
                            <span className="text-[10px] text-slate-500">{item.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/analytics')}
                    className="mt-3 w-full h-10 rounded-lg bg-[#1A7FC1] hover:bg-[#166EA8] text-white"
                  >
                    View Report
                  </button>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#0F4E78]">Active Dealers (Top 5)</h3>
                    <button
                      onClick={() => navigate('/dealer-management')}
                      className="text-xs text-[#1A7FC1] hover:text-[#166EA8]"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentDealers.length === 0 ? (
                      <p className="text-sm text-slate-400">No active dealers yet.</p>
                    ) : (
                      recentDealers.map((dealer, index) => (
                        <div key={dealer.id || index} className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm text-[#0F4E78] truncate">{dealer.name || `Dealer ${index + 1}`}</p>
                            <p className="text-xs text-slate-500 truncate">{dealer.email || 'No email'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm text-[#166EA8]">{dealer.is_active !== false ? 'Active' : 'Inactive'}</p>
                            <p className="text-xs text-slate-500">{dealerActivationRate}% health</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="w-4 h-4 text-slate-600" />
                    <h4 className="font-semibold text-[#0F4E78]">Quick Actions</h4>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/owner-register-customer')}
                      className="w-full h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[#1A7FC1] text-sm flex items-center justify-between px-3"
                    >
                      Register Customer <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate('/warranty-codes')}
                      className="w-full h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[#1A7FC1] text-sm flex items-center justify-between px-3"
                    >
                      Manage Warranty Codes <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate('/staff')}
                      className="w-full h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[#1A7FC1] text-sm flex items-center justify-between px-3"
                    >
                      Manage Staff <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate('/support-tickets')}
                      className="w-full h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[#1A7FC1] text-sm flex items-center justify-between px-3"
                    >
                      Open Support Queue <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
