import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { getDealerPurchaseOrders } from '../../services/dealerService';
import { toast } from 'sonner';

const statusBadge = {
  UNPAID: 'bg-red-100 text-red-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  PAID: 'bg-green-100 text-green-700',
};

export function DealerPurchaseHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getDealerPurchaseOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load purchase orders'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    (o.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  const totals = filtered.reduce((acc, o) => ({
    total: acc.total + o.total_amount,
    paid: acc.paid + o.paid_amount,
    pending: acc.pending + o.pending_amount,
  }), { total: 0, paid: 0, pending: 0 });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7FC1]" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Purchase History</h2>
        <p className="text-sm text-slate-500 mt-1">All purchase orders from your owner</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Orders Value</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">₹{totals.total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₹{totals.paid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Pending</p>
          <p className="text-2xl font-bold text-red-600 mt-1">₹{totals.pending.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">Orders ({filtered.length})</h3>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 h-9 w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order number..." className="bg-transparent outline-none text-sm w-full" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Order #</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Items</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-right px-4 py-3">Paid</th>
                <th className="text-right px-4 py-3">Pending</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Due Date</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                  <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  No purchase orders yet
                </td></tr>
              ) : (
                filtered.map((order) => {
                  const expanded = expandedId === order.id;
                  return (
                    <tr key={order.id} className="border-t border-slate-100">
                      <td colSpan={9} className="p-0">
                        <div className="flex items-center hover:bg-slate-50/50 cursor-pointer" onClick={() => setExpandedId(expanded ? null : order.id)}>
                          <div className="px-4 py-3 flex-1 grid grid-cols-9 items-center text-sm">
                            <span className="font-mono font-medium text-slate-900">{order.order_number}</span>
                            <span className="text-slate-600">{new Date(order.order_date).toLocaleDateString()}</span>
                            <span className="text-slate-700">{order.items?.length || 0} items</span>
                            <span className="text-right font-medium text-slate-900">₹{order.total_amount.toLocaleString()}</span>
                            <span className="text-right text-green-600">₹{order.paid_amount.toLocaleString()}</span>
                            <span className="text-right text-red-600">₹{order.pending_amount.toLocaleString()}</span>
                            <span className="text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge[order.payment_status] || ''}`}>{order.payment_status}</span></span>
                            <span className="text-center text-slate-600">{order.due_date ? new Date(order.due_date).toLocaleDateString() : '-'}</span>
                            <span className="text-center">{expanded ? <ChevronUp className="w-4 h-4 inline text-slate-400" /> : <ChevronDown className="w-4 h-4 inline text-slate-400" />}</span>
                          </div>
                        </div>
                        {expanded && order.items && (
                          <div className="px-8 pb-4 bg-slate-50/50">
                            <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                              <thead className="bg-slate-100 text-slate-500">
                                <tr>
                                  <th className="text-left px-3 py-2">Product</th>
                                  <th className="text-left px-3 py-2">Model</th>
                                  <th className="text-right px-3 py-2">Qty</th>
                                  <th className="text-right px-3 py-2">Unit Price</th>
                                  <th className="text-right px-3 py-2">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item) => (
                                  <tr key={item.id} className="border-t border-slate-200">
                                    <td className="px-3 py-2 text-slate-900">{item.product_name}</td>
                                    <td className="px-3 py-2 text-slate-600">{item.model_number || '-'}</td>
                                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                                    <td className="px-3 py-2 text-right">₹{item.unit_price.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right font-medium">₹{item.total_price.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {order.notes && <p className="text-xs text-slate-500 mt-2">Note: {order.notes}</p>}
                          </div>
                        )}
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
  );
}
