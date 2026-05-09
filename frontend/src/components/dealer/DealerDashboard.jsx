import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, ShoppingCart, TrendingUp, ShieldCheck, Clock, CreditCard,
  AlertTriangle, ArrowRight, FileText, BarChart3,
} from 'lucide-react';
import { getDealerDashboardStats, getDealerSalesEntries } from '../../services/dealerService';
import { toast } from 'sonner';

export function DealerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, sales] = await Promise.all([
          getDealerDashboardStats(),
          getDealerSalesEntries(),
        ]);
        setStats(s);
        setRecentSales(Array.isArray(sales) ? sales.slice(0, 5) : []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7FC1]" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Stock Purchased', value: stats?.totalPurchased || 0, icon: Package, color: 'bg-blue-50 text-[#1A7FC1]', route: '/dealer/inventory' },
    { label: 'Total Units Sold', value: stats?.totalSold || 0, icon: TrendingUp, color: 'bg-green-50 text-green-600', route: '/dealer/sales-entry' },
    { label: 'Available Stock', value: stats?.availableStock || 0, icon: ShoppingCart, color: 'bg-amber-50 text-amber-600', route: '/dealer/inventory' },
    { label: 'Warranty Registered', value: stats?.totalWarranties || 0, icon: ShieldCheck, color: 'bg-purple-50 text-purple-600', route: '/dealer/register' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals ?? stats?.pendingClaims ?? 0, icon: Clock, color: 'bg-orange-50 text-orange-600', route: '/dealer/approvals' },
    { label: 'Outstanding to Owner', value: String.fromCharCode(8377) + (stats?.totalOutstanding || 0).toLocaleString(), icon: CreditCard, color: 'bg-red-50 text-red-600', route: '/dealer/payments' },
    { label: 'Available Credit', value: String.fromCharCode(8377) + (stats?.availableCredit || 0).toLocaleString(), icon: BarChart3, color: 'bg-teal-50 text-teal-600', route: '/dealer/payments' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-sm text-slate-500 mt-1">Real-time summary of your dealership operations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button key={c.label} onClick={() => navigate(c.route)} className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{c.value}</p>
              <p className="text-xs text-slate-500 mt-1">{c.label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button onClick={() => navigate('/dealer/sales-entry')} className="w-full h-11 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] flex items-center justify-center gap-2 text-sm transition-colors">
              <FileText className="w-4 h-4" /> Record New Sale
            </button>
            <button onClick={() => navigate('/dealer/register')} className="w-full h-11 rounded-lg border border-[#1A7FC1] text-[#1A7FC1] hover:bg-[#1A7FC1]/5 flex items-center justify-center gap-2 text-sm transition-colors">
              <ShieldCheck className="w-4 h-4" /> Register Warranty
            </button>
            <button onClick={() => navigate('/dealer/inventory')} className="w-full h-11 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 text-sm transition-colors">
              <Package className="w-4 h-4" /> View Stock
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Sales</h3>
            <button onClick={() => navigate('/dealer/sales-entry')} className="text-sm text-[#1A7FC1] hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-4 py-2.5">Date</th>
                  <th className="text-left px-4 py-2.5">Product</th>
                  <th className="text-left px-4 py-2.5">Customer</th>
                  <th className="text-right px-4 py-2.5">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No sales recorded yet</td></tr>
                ) : (
                  recentSales.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-600">{new Date(s.sale_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-900">{s.product_name}</td>
                      <td className="px-4 py-3 text-slate-700">{s.customer_name}</td>
                      <td className="px-4 py-3 text-slate-900 text-right font-medium">{String.fromCharCode(8377)}{(s.sale_amount || 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(stats?.totalOutstanding > 0 || (stats?.pendingApprovals ?? stats?.pendingClaims) > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Attention Required</p>
            <ul className="text-sm text-amber-700 mt-1 space-y-1">
              {stats?.totalOutstanding > 0 && <li>You have {String.fromCharCode(8377)}{stats.totalOutstanding.toLocaleString()} outstanding payment to owner.</li>}
              {(stats?.pendingApprovals ?? stats?.pendingClaims) > 0 && <li>{(stats?.pendingApprovals ?? stats?.pendingClaims)} warranty registration{((stats?.pendingApprovals ?? stats?.pendingClaims) !== 1) ? 's' : ''} pending your approval.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
