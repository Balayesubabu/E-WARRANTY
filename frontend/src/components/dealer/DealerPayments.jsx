import { useState, useEffect } from 'react';
import { CreditCard, Search, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { getDealerLedger } from '../../services/dealerService';
import { toast } from 'sonner';

const paymentModeBadge = {
  CASH: 'bg-green-100 text-green-700',
  UPI: 'bg-purple-100 text-purple-700',
  NEFT: 'bg-blue-100 text-blue-700',
  CHEQUE: 'bg-amber-100 text-amber-700',
  BANK_TRANSFER: 'bg-teal-100 text-teal-700',
  OTHER: 'bg-slate-100 text-slate-600',
};

export function DealerPayments() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getDealerLedger()
      .then((data) => {
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        setSummary(data.summary || {});
      })
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter((e) =>
    (e.reference_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.notes || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.purchase_order?.order_number || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7FC1]" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Payments & Ledger</h2>
        <p className="text-sm text-slate-500 mt-1">Track payments, invoices, and financial summary</p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Credit Limit</p>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{(summary.creditLimit || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total Invoiced</p>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{(summary.totalInvoiced || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Total Paid</p>
          <p className="text-xl font-bold text-green-600 mt-1">₹{(summary.totalPaid || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Outstanding</p>
          <p className="text-xl font-bold text-red-600 mt-1">₹{(summary.totalOutstanding || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Overdue</p>
          <p className="text-xl font-bold text-orange-600 mt-1">₹{(summary.overdueAmount || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Available Credit</p>
          <p className="text-xl font-bold text-[#1A7FC1] mt-1">₹{(summary.availableCredit || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">Transaction History ({filtered.length})</h3>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 h-9 w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent outline-none text-sm w-full" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Order #</th>
                <th className="text-left px-4 py-3">Reference</th>
                <th className="text-center px-4 py-3">Mode</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  No transactions recorded yet
                </td></tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-600">{new Date(e.transaction_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        {e.transaction_type === 'PAYMENT' ? <ArrowUpRight className="w-3.5 h-3.5 text-green-600" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />}
                        <span className="text-slate-900">{e.transaction_type.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-mono text-xs">{e.purchase_order?.order_number || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{e.reference_number || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${paymentModeBadge[e.payment_mode] || ''}`}>{e.payment_mode.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <span className={e.transaction_type === 'PAYMENT' ? 'text-green-600' : 'text-red-600'}>
                        {e.transaction_type === 'PAYMENT' ? '+' : '-'}₹{e.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{e.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
