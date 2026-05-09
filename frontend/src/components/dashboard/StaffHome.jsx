import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import {
  Clock, AlertTriangle, CheckCircle, Search, ArrowRight, Loader2,
  FileText, Users, CreditCard, MapPin, TrendingUp, AlertCircle,
  Ticket, ShieldCheck, BarChart3, Timer, Zap,
} from 'lucide-react';
import { getStaffRoleDashboard } from '../../services/staffService';

const priorityColor = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-green-100 text-green-700',
};

const statusColor = {
  Submitted: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-green-700',
  InProgress: 'bg-blue-100 text-blue-700',
  Rejected: 'bg-red-100 text-red-700',
  Closed: 'bg-slate-100 text-slate-600',
  Repaired: 'bg-teal-100 text-teal-700',
  Replaced: 'bg-purple-100 text-purple-700',
};

const ratingColor = {
  Excellent: 'text-green-600', Good: 'text-blue-600',
  Average: 'text-amber-600', Low: 'text-red-600',
};

function KPICard({ label, value, icon: Icon, color, sublabel }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 truncate">{label}</p>
        {sublabel && <p className="text-[10px] text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

// ─── Claims Executive Dashboard ───
function ClaimsExecutiveDashboard({ data, navigate }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(() => {
    return (data.claims || []).filter((c) => {
      const q = search.toLowerCase();
      const matchQ = !q || [c.customer_name, c.product_name, c.id].some((v) => (v || '').toLowerCase().includes(q));
      const matchF = filter === 'All' ||
        (filter === 'High' && c.priority === 'High') ||
        (filter === 'Overdue' && c.is_overdue) ||
        (filter === 'Pending' && c.status === 'Submitted') ||
        (filter === 'InProgress' && c.status === 'InProgress');
      return matchQ && matchF;
    });
  }, [data.claims, search, filter]);

  const kpis = data.kpis || {};
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Assigned Today" value={kpis.assignedToday || 0} icon={Zap} color="bg-blue-50 text-[#1A7FC1]" />
        <KPICard label="Total Pending" value={kpis.totalPending || 0} icon={Clock} color="bg-amber-50 text-amber-600" />
        <KPICard label="Overdue (SLA Breached)" value={kpis.overdue || 0} icon={AlertTriangle} color="bg-red-50 text-red-600" />
        <KPICard label="Resolved This Week" value={kpis.resolvedWeek || 0} icon={CheckCircle} color="bg-green-50 text-green-600" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h3 className="font-semibold text-slate-900">My Assigned Claims</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {['All', 'High', 'Overdue', 'Pending', 'InProgress'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${filter === f ? 'bg-[#1A7FC1] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {f === 'InProgress' ? 'In Repair' : f}
              </button>
            ))}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 h-8">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent outline-none text-xs w-28" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>
              <th className="text-left px-4 py-2.5">Claim ID</th>
              <th className="text-left px-4 py-2.5">Customer</th>
              <th className="text-left px-4 py-2.5">Product</th>
              <th className="text-left px-4 py-2.5">Priority</th>
              <th className="text-left px-4 py-2.5">Status</th>
              <th className="text-left px-4 py-2.5">SLA Remaining</th>
              <th className="text-left px-4 py-2.5">Action</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400"><FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />No claims found</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className={`border-t border-slate-100 hover:bg-slate-50/50 ${c.is_overdue ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs">#{(c.id || '').slice(0, 8)}</td>
                  <td className="px-4 py-3 text-slate-900">{c.customer_name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.product_name}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor[c.priority] || priorityColor.Medium}`}>{c.priority}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] || 'bg-slate-100 text-slate-600'}`}>{c.status}</span></td>
                  <td className="px-4 py-3">
                    {c.is_overdue ? <span className="text-xs font-medium text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Overdue</span>
                      : c.sla_remaining != null ? <span className="text-xs text-slate-600">{c.sla_remaining}h left</span>
                      : <span className="text-xs text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate('/staff/claim-management')} className="px-3 py-1 rounded-lg bg-[#1A7FC1]/10 text-[#1A7FC1] hover:bg-[#1A7FC1]/20 text-xs font-medium">Process</button>
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

// ─── Claims Manager Dashboard ───
function ClaimsManagerDashboard({ data, navigate }) {
  const kpis = data.kpis || {};
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Awaiting Approval" value={kpis.awaitingApproval || 0} icon={Clock} color="bg-amber-50 text-amber-600" />
        <KPICard label="Escalated (High Priority)" value={kpis.escalated || 0} icon={AlertTriangle} color="bg-red-50 text-red-600" />
        <KPICard label="Rejected Today" value={kpis.rejectedToday || 0} icon={AlertCircle} color="bg-slate-100 text-slate-600" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200"><h3 className="font-semibold text-slate-900">Approval Queue</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>
              <th className="text-left px-4 py-2.5">Claim ID</th>
              <th className="text-left px-4 py-2.5">Assigned Executive</th>
              <th className="text-left px-4 py-2.5">Customer</th>
              <th className="text-left px-4 py-2.5">Product</th>
              <th className="text-left px-4 py-2.5">Priority</th>
              <th className="text-left px-4 py-2.5">Status</th>
              <th className="text-left px-4 py-2.5">Action</th>
            </tr></thead>
            <tbody>
              {(data.claims || []).length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No claims in queue</td></tr>
              ) : (data.claims || []).map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-xs">#{(c.id || '').slice(0, 8)}</td>
                  <td className="px-4 py-3 text-slate-600">{c.assigned_executive}</td>
                  <td className="px-4 py-3 text-slate-900">{c.customer_name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.product_name}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor[c.priority] || priorityColor.Medium}`}>{c.priority}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[c.status] || 'bg-slate-100 text-slate-600'}`}>{c.status}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate('/staff/claim-management')} className="px-3 py-1 rounded-lg bg-[#1A7FC1]/10 text-[#1A7FC1] hover:bg-[#1A7FC1]/20 text-xs font-medium">Review</button>
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

// ─── Support Dashboard ───
function SupportDashboard({ data, navigate }) {
  const kpis = data.kpis || {};
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard label="Open Tickets" value={kpis.openTickets || 0} icon={Ticket} color="bg-blue-50 text-[#1A7FC1]" />
        <KPICard label="Resolved Today" value={kpis.resolvedToday || 0} icon={CheckCircle} color="bg-green-50 text-green-600" />
        <KPICard label="Total Queue" value={kpis.totalQueue || 0} icon={Clock} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Support Ticket Queue</h3>
          <button onClick={() => navigate('/staff/support-tickets')} className="text-xs text-[#1A7FC1] hover:underline flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>
              <th className="text-left px-4 py-2.5">Ticket ID</th>
              <th className="text-left px-4 py-2.5">Subject</th>
              <th className="text-left px-4 py-2.5">Category</th>
              <th className="text-left px-4 py-2.5">Priority</th>
              <th className="text-left px-4 py-2.5">Status</th>
              <th className="text-left px-4 py-2.5">Action</th>
            </tr></thead>
            <tbody>
              {(data.tickets || []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400"><Ticket className="w-8 h-8 mx-auto text-slate-300 mb-2" />No open tickets</td></tr>
              ) : (data.tickets || []).map((t) => (
                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-xs">#{(t.id || '').slice(0, 8)}</td>
                  <td className="px-4 py-3 text-slate-900">{t.subject}</td>
                  <td className="px-4 py-3 text-slate-600">{t.category}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor[t.priority] || priorityColor.Medium}`}>{t.priority}</span></td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{t.status}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate('/staff/support-tickets')} className="px-3 py-1 rounded-lg bg-[#1A7FC1]/10 text-[#1A7FC1] hover:bg-[#1A7FC1]/20 text-xs font-medium">Respond</button>
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

// ─── Finance Dashboard ───
function FinanceDashboard({ data }) {
  const kpis = data.kpis || {};
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Outstanding" value={`₹${(kpis.totalOutstanding || 0).toLocaleString()}`} icon={CreditCard} color="bg-red-50 text-red-600" />
        <KPICard label="Payments Today" value={`₹${(kpis.paymentsToday || 0).toLocaleString()}`} icon={CheckCircle} color="bg-green-50 text-green-600" />
        <KPICard label="Overdue Invoices" value={kpis.overdueInvoices || 0} icon={AlertTriangle} color="bg-amber-50 text-amber-600" />
        <KPICard label="On Credit Hold" value={kpis.creditHoldDealers || 0} icon={AlertCircle} color="bg-slate-100 text-slate-600" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200"><h3 className="font-semibold text-slate-900">Dealer Ledger Summary</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>
              <th className="text-left px-4 py-2.5">Dealer Name</th>
              <th className="text-left px-4 py-2.5">City</th>
              <th className="text-right px-4 py-2.5">Outstanding</th>
              <th className="text-right px-4 py-2.5">Credit Limit</th>
              <th className="text-right px-4 py-2.5">Overdue</th>
              <th className="text-left px-4 py-2.5">Status</th>
            </tr></thead>
            <tbody>
              {(data.dealers || []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No dealer data</td></tr>
              ) : (data.dealers || []).map((d) => (
                <tr key={d.id} className={`border-t border-slate-100 hover:bg-slate-50/50 ${d.isOverCredit ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                  <td className="px-4 py-3 text-slate-600">{d.city || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">₹{(d.totalOutstanding || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-600">₹{(d.creditLimit || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">{d.overduePOs > 0 ? `${d.overduePOs} PO(s)` : '—'}</td>
                  <td className="px-4 py-3">{d.isOverCredit ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Credit Hold</span> : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">OK</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Regional Manager Dashboard ───
function RegionalManagerDashboard({ data }) {
  const kpis = data.kpis || {};
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Dealers in Region" value={kpis.totalDealers || 0} icon={MapPin} color="bg-blue-50 text-[#1A7FC1]" />
        <KPICard label="Sales This Month" value={kpis.regionSalesMonth || 0} icon={TrendingUp} color="bg-green-50 text-green-600" />
        <KPICard label="Claims Ratio" value={`${kpis.claimsRatio || 0}%`} icon={BarChart3} color="bg-amber-50 text-amber-600" />
        <KPICard label="Outstanding" value={`₹${(kpis.outstandingInRegion || 0).toLocaleString()}`} icon={CreditCard} color="bg-red-50 text-red-600" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200"><h3 className="font-semibold text-slate-900">Dealer Performance — My Region</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>
              <th className="text-left px-4 py-2.5">Dealer</th>
              <th className="text-left px-4 py-2.5">City</th>
              <th className="text-right px-4 py-2.5">Units Sold</th>
              <th className="text-right px-4 py-2.5">Claims</th>
              <th className="text-right px-4 py-2.5">Outstanding</th>
              <th className="text-left px-4 py-2.5">Rating</th>
            </tr></thead>
            <tbody>
              {(data.dealers || []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400"><MapPin className="w-8 h-8 mx-auto text-slate-300 mb-2" />No dealers assigned to your region</td></tr>
              ) : (data.dealers || []).map((d) => (
                <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                  <td className="px-4 py-3 text-slate-600">{d.city || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{d.unitsSold}</td>
                  <td className="px-4 py-3 text-right">{d.claimsCount}</td>
                  <td className="px-4 py-3 text-right">₹{(d.outstanding || 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`font-semibold text-xs ${ratingColor[d.rating] || 'text-slate-600'}`}>{d.rating}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───
export function StaffHome() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStaffRoleDashboard()
      .then((data) => setDashboardData(data))
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#1A7FC1] mx-auto" />
          <p className="mt-3 text-slate-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Could not load dashboard</p>
          <p className="text-sm text-slate-400 mt-1">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-lg bg-[#1A7FC1] text-white text-sm hover:bg-[#166EA8]">Retry</button>
        </div>
      </div>
    );
  }

  const dashType = dashboardData?.dashboardType;
  const staff = dashboardData?.staff || {};

  const dashTitle = {
    claims_executive: 'Claims Executive Dashboard',
    claims_manager: 'Claims Manager Dashboard',
    support: 'Support Executive Dashboard',
    finance: 'Finance Dashboard',
    regional_manager: 'Regional Manager Dashboard',
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{dashTitle[dashType] || 'Staff Dashboard'}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {staff.name && `${staff.name}`}
            {staff.region && ` · ${staff.region}`}
            {staff.department && ` · ${staff.department}`}
          </p>
        </div>
        {staff.employee_id && (
          <span className="hidden sm:inline px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{staff.employee_id}</span>
        )}
      </div>

      {/* Role-based dashboard */}
      {dashType === 'claims_executive' && <ClaimsExecutiveDashboard data={dashboardData} navigate={navigate} />}
      {dashType === 'claims_manager' && <ClaimsManagerDashboard data={dashboardData} navigate={navigate} />}
      {dashType === 'support' && <SupportDashboard data={dashboardData} navigate={navigate} />}
      {dashType === 'finance' && <FinanceDashboard data={dashboardData} />}
      {dashType === 'regional_manager' && <RegionalManagerDashboard data={dashboardData} />}

      {/* Performance summary */}
      {staff.dealer_assignments?.length > 0 && dashType !== 'regional_manager' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900 mb-2">My Assigned Dealers</p>
          <div className="flex flex-wrap gap-2">
            {staff.dealer_assignments.map((d) => (
              <span key={d.id} className="px-3 py-1.5 rounded-lg bg-slate-100 text-sm text-slate-700">
                {d.name} {d.city && <span className="text-xs text-slate-400">({d.city})</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
