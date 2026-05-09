import { useState, useEffect } from 'react';
import { FileText, Plus, Search, X } from 'lucide-react';
import { getDealerSalesEntries, createDealerSalesEntry } from '../../services/dealerService';
import { toast } from 'sonner';

const emptyForm = {
  product_name: '', model_number: '', serial_number: '', customer_name: '',
  customer_phone: '', customer_email: '', invoice_number: '',
  sale_date: new Date().toISOString().slice(0, 10), sale_amount: '', notes: '',
};

export function DealerSalesEntry() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    getDealerSalesEntries()
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load sales'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_name || !form.customer_name || !form.customer_phone) {
      toast.error('Product name, customer name, and phone are required');
      return;
    }
    setSaving(true);
    try {
      await createDealerSalesEntry({ ...form, sale_amount: parseFloat(form.sale_amount) || 0 });
      toast.success('Sale recorded successfully');
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch {
      toast.error('Failed to record sale');
    } finally {
      setSaving(false);
    }
  };

  const filtered = entries.filter((e) =>
    e.product_name.toLowerCase().includes(search.toLowerCase()) ||
    e.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.serial_number || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7FC1]" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sales Entry</h2>
          <p className="text-sm text-slate-500 mt-1">Record product sales to customers. Register warranties from Warranty Registration.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="h-10 px-4 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] flex items-center gap-2 text-sm transition-colors">
          <Plus className="w-4 h-4" /> New Sale
        </button>
      </div>

      {/* New Sale Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Record New Sale</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Product Name *</label>
                  <input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Model Number</label>
                  <input value={form.model_number} onChange={(e) => setForm({ ...form, model_number: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Serial Number</label>
                  <input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Invoice Number</label>
                  <input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Customer Name *</label>
                  <input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Customer Phone *</label>
                  <input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Customer Email</label>
                  <input value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} type="email" className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Sale Date</label>
                  <input value={form.sale_date} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} type="date" className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Sale Amount (₹)</label>
                  <input value={form.sale_amount} onChange={(e) => setForm({ ...form, sale_amount: e.target.value })} type="number" min="0" className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#1A7FC1]" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="h-10 px-4 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="h-10 px-6 rounded-lg bg-[#1A7FC1] text-white hover:bg-[#166EA8] text-sm disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">Sales Records ({filtered.length})</h3>
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
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Serial</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Invoice #</th>
                <th className="text-right px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  No sales recorded yet. Click "New Sale" to start.
                </td></tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-slate-600">{new Date(entry.sale_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium">{entry.product_name}</td>
                    <td className="px-4 py-3 text-slate-700 font-mono text-xs">{entry.serial_number || '-'}</td>
                    <td className="px-4 py-3 text-slate-900">{entry.customer_name}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.customer_phone}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.invoice_number || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">₹{(entry.sale_amount || 0).toLocaleString()}</td>
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
