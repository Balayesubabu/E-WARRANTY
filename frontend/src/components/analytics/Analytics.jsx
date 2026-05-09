import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, Clock, CheckCircle2, FileCheck, Loader2, Package,
  BarChart3, Users, AlertTriangle, Download, Filter, Calendar,
  ArrowUpRight, ArrowDownRight, Minus, ShieldCheck, XCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import api from '../../utils/api';
import { getProviderWarrantyCodes } from '../../services/warrantyCodeService';
import { getWarrantyClaimStats } from '../../services/warrantyClaimService';

const BRAND = '#1A7FC1';
const BRAND_DARK = '#166EA8';

const CHART_COLORS = ['#1A7FC1', '#059669', '#d97706', '#b91c1c', '#7c3aed', '#0891b2'];

export function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6m');
  const [selectedTab, setSelectedTab] = useState('overview');

  const [warrantyStats, setWarrantyStats] = useState({ active: 0, expiring: 0, expired: 0, total: 0, totalCodes: 0 });
  const [claimStats, setClaimStats] = useState({ submitted: 0, approved: 0, inProgress: 0, repaired: 0, replaced: 0, closed: 0, rejected: 0, total: 0 });
  const [monthlyRegistrations, setMonthlyRegistrations] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [reportData, setReportData] = useState({ avgResolutionDays: 0, topProducts: [], dealerPerformance: [], monthlyClaimTrends: [], totalClaims: 0 });
  const [allCustomers, setAllCustomers] = useState([]);
  const [dealerRegistrations, setDealerRegistrations] = useState([]);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [codesRes, custRes, claimStatsRes, reportRes] = await Promise.allSettled([
        getProviderWarrantyCodes(),
        api.get('/e-warranty/warranty-customer/get-registered-customers'),
        getWarrantyClaimStats(),
        api.get('/warranty-claim/report'),
      ]);

      const now = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);

      let allCodes = [];
      if (codesRes.status === 'fulfilled') {
        const d = codesRes.value?.data?.warranty_codes || codesRes.value?.data || [];
        allCodes = Array.isArray(d) ? d : [];
      }

      let customers = [];
      if (custRes.status === 'fulfilled') {
        const d = custRes.value?.data?.data?.registered_customers || custRes.value?.data?.data || [];
        customers = Array.isArray(d) ? d : [];
      }
      setAllCustomers(customers);

      let activeCount = 0, expiringCount = 0, expiredCount = 0;
      customers.forEach((c) => {
        const wc = c.provider_warranty_code || {};
        const installDate = c.date_of_installation ? new Date(c.date_of_installation) : null;
        let expiryDate = wc.warranty_to ? new Date(wc.warranty_to) : null;
        if (installDate && wc.warranty_days && !expiryDate) {
          expiryDate = new Date(installDate);
          expiryDate.setDate(installDate.getDate() + wc.warranty_days);
        }
        if (expiryDate) {
          if (expiryDate < now) expiredCount++;
          else if (expiryDate <= thirtyDays) expiringCount++;
          else activeCount++;
        } else if (c.is_active) activeCount++;
      });

      setWarrantyStats({ active: activeCount, expiring: expiringCount, expired: expiredCount, total: customers.length, totalCodes: allCodes.length });

      setStatusData([
        { name: 'Active', value: activeCount, color: '#059669' },
        { name: 'Expiring', value: expiringCount, color: '#d97706' },
        { name: 'Expired', value: expiredCount, color: '#b91c1c' },
      ].filter((s) => s.value > 0));

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthCount = dateRange === '12m' ? 12 : 6;
      const monthCounts = {};
      for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthCounts[key] = { month: monthNames[d.getMonth()], registrations: 0 };
      }
      customers.forEach((c) => {
        if (c.created_at) {
          const d = new Date(c.created_at);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (monthCounts[key]) monthCounts[key].registrations++;
        }
      });
      setMonthlyRegistrations(Object.values(monthCounts));

      const dealerMap = {};
      customers.forEach((c) => {
        const dealer = c.dealership_installer_name || 'Direct';
        if (!dealerMap[dealer]) dealerMap[dealer] = { name: dealer, registrations: 0 };
        dealerMap[dealer].registrations++;
      });
      setDealerRegistrations(Object.values(dealerMap).sort((a, b) => b.registrations - a.registrations).slice(0, 10));

      if (claimStatsRes.status === 'fulfilled') {
        const s = claimStatsRes.value?.data || {};
        setClaimStats(s);
      }

      if (reportRes.status === 'fulfilled') {
        const r = reportRes.value?.data?.data || {};
        setReportData(r);
      }
    } catch (error) {
      console.warn('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const claimApprovalRate = claimStats.total > 0
    ? Math.round(((claimStats.approved + claimStats.closed + claimStats.repaired + claimStats.replaced) / claimStats.total) * 100)
    : 0;

  const handleExportCSV = () => {
    const rows = [['Metric', 'Value']];
    rows.push(['Total Registrations', warrantyStats.total]);
    rows.push(['Active Warranties', warrantyStats.active]);
    rows.push(['Expiring Soon', warrantyStats.expiring]);
    rows.push(['Expired', warrantyStats.expired]);
    rows.push(['Total Codes Generated', warrantyStats.totalCodes]);
    rows.push(['Total Claims', claimStats.total]);
    rows.push(['Claim Approval Rate', `${claimApprovalRate}%`]);
    rows.push(['Avg Resolution (Days)', reportData.avgResolutionDays]);
    rows.push([]);
    rows.push(['Dealer', 'Registrations']);
    dealerRegistrations.forEach((d) => rows.push([d.name, d.registrations]));
    rows.push([]);
    rows.push(['Product', 'Claims']);
    (reportData.topProducts || []).forEach((p) => rows.push([p.name, p.claims]));

    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warranty-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#1A7FC1] animate-spin mx-auto" />
          <p className="mt-4 text-slate-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'claims', label: 'Claims Analysis' },
    { id: 'dealers', label: 'Dealer Performance' },
    { id: 'products', label: 'Product Defects' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#1A7FC1]" />
          <h2 className="text-xl font-semibold text-slate-900">Reports & Analytics</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 h-9">
            <Calendar className="w-4 h-4 text-slate-400" />
            {['6m', '12m'].map((r) => (
              <button key={r} onClick={() => setDateRange(r)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${dateRange === r ? 'bg-[#1A7FC1] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {r === '6m' ? '6 Months' : '12 Months'}
              </button>
            ))}
          </div>
          <button onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#1A7FC1] hover:bg-[#166EA8] text-white text-sm transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedTab === tab.id ? 'bg-[#1A7FC1] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard icon={FileCheck} title="Total Registrations" value={warrantyStats.total} subtitle={`${warrantyStats.totalCodes} codes generated`} color="text-[#1A7FC1]" bg="bg-[#1A7FC1]/10" />
            <KPICard icon={ShieldCheck} title="Active Warranties" value={warrantyStats.active} subtitle={`${warrantyStats.expiring} expiring soon`} color="text-emerald-700" bg="bg-emerald-100" />
            <KPICard icon={AlertTriangle} title="Total Claims" value={claimStats.total} subtitle={`${claimApprovalRate}% approval rate`} color="text-amber-700" bg="bg-amber-100" />
            {/* <KPICard icon={Clock} title="Avg Resolution" value={`${reportData.avgResolutionDays || 0}d`} subtitle="Average days to close" color="text-purple-700" bg="bg-purple-100" /> */}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Monthly Registrations */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-slate-900 font-medium mb-4">Registration Trends</h3>
              {monthlyRegistrations.length > 0 && monthlyRegistrations.some((d) => d.registrations > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="registrations" fill={BRAND} radius={[6, 6, 0, 0]} name="Registrations" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No registration data available" />
              )}
            </div>

            {/* Warranty Status Breakdown */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-slate-900 font-medium mb-4">Warranty Status</h3>
              {statusData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <ResponsiveContainer width={150} height={150}>
                      <PieChart>
                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                          {statusData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    {statusData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-600 text-sm">{item.name}</span>
                        </div>
                        <span className="text-slate-900 font-medium">{item.value}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-100 flex justify-between">
                      <span className="text-slate-500 text-sm">Total</span>
                      <span className="text-slate-900 font-semibold">{warrantyStats.total}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyChart message="No warranty data available" />
              )}
            </div>
          </div>

          {/* Operational insights */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-slate-900 font-medium mb-3">Operational Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-[#1A7FC1] mt-0.5 shrink-0" />
                <span>{warrantyStats.total > 0 ? `${warrantyStats.total} total registrations across your system` : 'No registrations yet. Start by generating warranty codes.'}</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <span>{warrantyStats.expiring > 0 ? `${warrantyStats.expiring} warranties expiring within 30 days need follow-up` : 'No warranties expiring in the next 30 days.'}</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{claimStats.total > 0 ? `${claimApprovalRate}% claim approval rate with ${reportData.avgResolutionDays || 0} day avg resolution` : 'No claims submitted yet.'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Claims Analysis Tab */}
      {selectedTab === 'claims' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Claim KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={FileCheck} title="Submitted" value={claimStats.submitted} subtitle="Pending review" color="text-amber-700" bg="bg-amber-100" />
            <KPICard icon={CheckCircle2} title="Approved" value={claimStats.approved + claimStats.repaired + claimStats.replaced} subtitle={`${claimApprovalRate}% rate`} color="text-emerald-700" bg="bg-emerald-100" />
            <KPICard icon={XCircle} title="Rejected" value={claimStats.rejected} subtitle={claimStats.total > 0 ? `${Math.round((claimStats.rejected / claimStats.total) * 100)}% rate` : '0%'} color="text-red-700" bg="bg-red-100" />
            <KPICard icon={Clock} title="In Progress" value={claimStats.inProgress} subtitle="Being processed" color="text-[#1A7FC1]" bg="bg-[#1A7FC1]/10" />
          </div>

          {/* Claim status breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-slate-900 font-medium mb-4">Claim Status Distribution</h3>
              {claimStats.total > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Submitted', value: claimStats.submitted, color: '#d97706' },
                        { name: 'Approved', value: claimStats.approved, color: '#059669' },
                        { name: 'In Progress', value: claimStats.inProgress, color: '#1A7FC1' },
                        { name: 'Repaired', value: claimStats.repaired, color: '#0891b2' },
                        { name: 'Replaced', value: claimStats.replaced, color: '#7c3aed' },
                        { name: 'Closed', value: claimStats.closed, color: '#64748b' },
                        { name: 'Rejected', value: claimStats.rejected, color: '#b91c1c' },
                      ].filter((s) => s.value > 0)}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                    >
                      {[
                        { name: 'Submitted', color: '#d97706' },
                        { name: 'Approved', color: '#059669' },
                        { name: 'In Progress', color: '#1A7FC1' },
                        { name: 'Repaired', color: '#0891b2' },
                        { name: 'Replaced', color: '#7c3aed' },
                        { name: 'Closed', color: '#64748b' },
                        { name: 'Rejected', color: '#b91c1c' },
                      ].filter((s) => claimStats[s.name === 'In Progress' ? 'inProgress' : s.name.toLowerCase()] > 0)
                        .map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No claims data yet" />
              )}
            </div>

            {/* Monthly claim trends */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-slate-900 font-medium mb-4">Monthly Claim Trends</h3>
              {(reportData.monthlyClaimTrends || []).length > 0 && (reportData.monthlyClaimTrends || []).some((d) => d.submitted > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={reportData.monthlyClaimTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="submitted" stroke="#d97706" strokeWidth={2} name="Submitted" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="approved" stroke="#059669" strokeWidth={2} name="Approved" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="rejected" stroke="#b91c1c" strokeWidth={2} name="Rejected" dot={{ r: 3 }} />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No claim trend data available" />
              )}
            </div>
          </div>

          {/* Claim summary table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200">
              <h3 className="text-slate-900 font-medium">Claim Flow Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left px-5 py-2.5">Status</th>
                    <th className="text-right px-5 py-2.5">Count</th>
                    <th className="text-right px-5 py-2.5">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Submitted', count: claimStats.submitted, color: 'text-amber-600' },
                    { label: 'Approved', count: claimStats.approved, color: 'text-emerald-600' },
                    { label: 'In Progress', count: claimStats.inProgress, color: 'text-[#1A7FC1]' },
                    { label: 'Repaired', count: claimStats.repaired, color: 'text-cyan-600' },
                    { label: 'Replaced', count: claimStats.replaced, color: 'text-purple-600' },
                    { label: 'Closed', count: claimStats.closed, color: 'text-slate-600' },
                    { label: 'Rejected', count: claimStats.rejected, color: 'text-red-600' },
                  ].map((row) => (
                    <tr key={row.label} className="border-t border-slate-100">
                      <td className={`px-5 py-2.5 font-medium ${row.color}`}>{row.label}</td>
                      <td className="px-5 py-2.5 text-right text-slate-900">{row.count}</td>
                      <td className="px-5 py-2.5 text-right text-slate-500">{claimStats.total > 0 ? `${Math.round((row.count / claimStats.total) * 100)}%` : '0%'}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                    <td className="px-5 py-2.5 text-slate-900">Total</td>
                    <td className="px-5 py-2.5 text-right text-slate-900">{claimStats.total}</td>
                    <td className="px-5 py-2.5 text-right text-slate-900">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Dealer Performance Tab */}
      {selectedTab === 'dealers' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard icon={Users} title="Total Dealers" value={dealerRegistrations.length} subtitle="Active dealers" color="text-[#1A7FC1]" bg="bg-[#1A7FC1]/10" />
            <KPICard icon={TrendingUp} title="Top Dealer" value={dealerRegistrations[0]?.name || 'N/A'} subtitle={dealerRegistrations[0] ? `${dealerRegistrations[0].registrations} registrations` : ''} color="text-emerald-700" bg="bg-emerald-100" small />
            <KPICard icon={BarChart3} title="Avg per Dealer" value={dealerRegistrations.length > 0 ? Math.round(warrantyStats.total / dealerRegistrations.length) : 0} subtitle="Registrations" color="text-purple-700" bg="bg-purple-100" />
          </div>

          {/* Dealer registration bar chart */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-slate-900 font-medium mb-4">Dealer Registration Volume</h3>
            {dealerRegistrations.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dealerRegistrations} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                  <Bar dataKey="registrations" fill={BRAND} radius={[0, 6, 6, 0]} name="Registrations" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No dealer data available" />
            )}
          </div>

          {/* Dealer claims performance */}
          {(reportData.dealerPerformance || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-200">
                <h3 className="text-slate-900 font-medium">Dealer Claims Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-left px-5 py-2.5">#</th>
                      <th className="text-left px-5 py-2.5">Dealer</th>
                      <th className="text-right px-5 py-2.5">Claims</th>
                      <th className="text-right px-5 py-2.5">Approved</th>
                      <th className="text-right px-5 py-2.5">Rejected</th>
                      <th className="text-right px-5 py-2.5">Approval Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.dealerPerformance.map((dealer, i) => {
                      const rate = dealer.claims > 0 ? Math.round((dealer.approved / dealer.claims) * 100) : 0;
                      return (
                        <tr key={dealer.name} className="border-t border-slate-100">
                          <td className="px-5 py-2.5 text-slate-400">{i + 1}</td>
                          <td className="px-5 py-2.5 text-slate-900 font-medium">{dealer.name}</td>
                          <td className="px-5 py-2.5 text-right text-slate-700">{dealer.claims}</td>
                          <td className="px-5 py-2.5 text-right text-emerald-600">{dealer.approved}</td>
                          <td className="px-5 py-2.5 text-right text-red-600">{dealer.rejected}</td>
                          <td className="px-5 py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${rate >= 70 ? 'bg-emerald-100 text-emerald-700' : rate >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Dealer ranking table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200">
              <h3 className="text-slate-900 font-medium">Dealer Registration Ranking</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left px-5 py-2.5">Rank</th>
                    <th className="text-left px-5 py-2.5">Dealer Name</th>
                    <th className="text-right px-5 py-2.5">Registrations</th>
                    <th className="text-right px-5 py-2.5">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dealerRegistrations.map((dealer, i) => (
                    <tr key={dealer.name} className="border-t border-slate-100">
                      <td className="px-5 py-2.5">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-slate-900 font-medium">{dealer.name}</td>
                      <td className="px-5 py-2.5 text-right text-slate-700">{dealer.registrations}</td>
                      <td className="px-5 py-2.5 text-right text-slate-500">{warrantyStats.total > 0 ? `${Math.round((dealer.registrations / warrantyStats.total) * 100)}%` : '0%'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Product Defects Tab */}
      {selectedTab === 'products' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KPICard icon={Package} title="Products with Claims" value={(reportData.topProducts || []).length} subtitle="Unique products" color="text-[#1A7FC1]" bg="bg-[#1A7FC1]/10" />
            <KPICard icon={AlertTriangle} title="Top Claiming Product" value={(reportData.topProducts || [])[0]?.name || 'N/A'} subtitle={(reportData.topProducts || [])[0] ? `${(reportData.topProducts || [])[0].claims} claims` : ''} color="text-red-700" bg="bg-red-100" small />
            <KPICard icon={TrendingUp} title="Total Product Claims" value={reportData.totalClaims || 0} subtitle="All products" color="text-amber-700" bg="bg-amber-100" />
          </div>

          {/* Product claims bar chart */}
          {(reportData.topProducts || []).length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-slate-900 font-medium mb-4">Claims by Product</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.topProducts} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                  <Bar dataKey="claims" fill="#b91c1c" radius={[0, 6, 6, 0]} name="Claims" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Product defect breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200">
              <h3 className="text-slate-900 font-medium">Product Defect Patterns</h3>
            </div>
            {(reportData.topProducts || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-left px-5 py-2.5">Product</th>
                      <th className="text-right px-5 py-2.5">Total Claims</th>
                      <th className="text-left px-5 py-2.5">Issue Categories</th>
                      <th className="text-right px-5 py-2.5">% of All Claims</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.topProducts || []).map((product) => (
                      <tr key={product.name} className="border-t border-slate-100">
                        <td className="px-5 py-2.5 text-slate-900 font-medium">{product.name}</td>
                        <td className="px-5 py-2.5 text-right text-slate-700">{product.claims}</td>
                        <td className="px-5 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {(product.categories || []).map((cat) => (
                              <span key={cat.category} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                                {cat.category} ({cat.count})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-right text-slate-500">
                          {reportData.totalClaims > 0 ? `${Math.round((product.claims / reportData.totalClaims) * 100)}%` : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No product defect data available yet</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, title, value, subtitle, color, bg, small }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-2`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-slate-500 text-xs mb-0.5">{title}</p>
      <p className={`text-slate-900 font-semibold ${small ? 'text-sm truncate' : 'text-xl'}`}>{value}</p>
      {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex items-center justify-center h-[200px] text-slate-400 text-sm">
      {message}
    </div>
  );
}
