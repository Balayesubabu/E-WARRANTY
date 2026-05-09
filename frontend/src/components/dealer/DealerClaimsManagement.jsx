import { useState, useEffect } from 'react';
import { ClipboardList, Search, Eye, Clock } from 'lucide-react';
import { getRegisteredCustomers, getActiveCustomers } from '../../services/dealerService';
import { toast } from 'sonner';

const statusStyles = {
  Submitted: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-green-700',
  InProgress: 'bg-blue-100 text-blue-700',
  Repaired: 'bg-teal-100 text-teal-700',
  Replaced: 'bg-purple-100 text-purple-700',
  Closed: 'bg-slate-100 text-slate-600',
  Rejected: 'bg-red-100 text-red-700',
  Pending: 'bg-amber-100 text-amber-700',
  Active: 'bg-green-100 text-green-700',
};

export function DealerClaimsManagement() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [registered, active] = await Promise.all([getRegisteredCustomers(), getActiveCustomers()]);
        const r = registered?.data?.registered_customers || registered?.data || registered || [];
        const a = active?.data?.active_customers || active?.data || active || [];
        const all = [...(Array.isArray(r) ? r : []), ...(Array.isArray(a) ? a : [])];
        const unique = Array.from(new Map(all.map((c) => [c.id, c])).values());
        setClaims(unique);
      } catch {
        toast.error('Failed to load claims');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getStatus = (c) => {
    const s = c?.WarrantyClaim?.[0]?.status || c?.provider_warranty_code?.warranty_code_status || (c?.is_active ? 'Active' : 'Pending');
    return String(s);
  };

  const statuses = ['All', ...new Set(claims.map(getStatus))];

  const filtered = claims.filter((c) => {
    const s = getStatus(c);
    const q = search.toLowerCase();
    const nameMatch = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(q);
    const productMatch = (c.product_name || '').toLowerCase().includes(q);
    const serialMatch = (c.warranty_code || '').toLowerCase().includes(q);
    const statusMatch = statusFilter === 'All' || s === statusFilter;
    return statusMatch && (nameMatch || productMatch || serialMatch || !q);
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7FC1]" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Customer Warranties</h2>
        <p className="text-sm text-slate-500 mt-1">View all registered customer warranties and their current status</p>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-[#1A7FC1] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {s} {s !== 'All' && `(${claims.filter((c) => getStatus(c) === s).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">Warranties ({filtered.length})</h3>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 h-9 w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent outline-none text-sm w-full" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Serial</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Last Updated</th>
                <th className="text-center px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  No warranty records found
                </td></tr>
              ) : (
                filtered.map((c) => {
                  const status = getStatus(c);
                  return (
                    <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">#{(c.id || '').slice(0, 8)}</td>
                      <td className="px-4 py-3 text-slate-900">{c.first_name || ''} {c.last_name || ''}</td>
                      <td className="px-4 py-3 text-slate-700">{c.product_name || '-'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.warranty_code || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setSelected(c)} className="px-3 h-8 rounded-lg bg-[#1A7FC1]/10 text-[#1A7FC1] hover:bg-[#1A7FC1]/20 text-xs transition-colors">
                          <Eye className="w-3.5 h-3.5 inline mr-1" /> View
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

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg m-4 max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Warranty Details</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-slate-500">Customer</p><p className="font-medium">{selected.first_name} {selected.last_name}</p></div>
                <div><p className="text-slate-500">Product</p><p className="font-medium">{selected.product_name || '-'}</p></div>
                <div><p className="text-slate-500">Serial / Code</p><p className="font-mono">{selected.warranty_code || '-'}</p></div>
                <div><p className="text-slate-500">Status</p><p className="font-medium">{getStatus(selected)}</p></div>
                <div><p className="text-slate-500">Email</p><p>{selected.email || '-'}</p></div>
                <div><p className="text-slate-500">Phone</p><p>{selected.phone_number || selected.contact_number || '-'}</p></div>
                <div><p className="text-slate-500">Registered</p><p>{selected.created_at ? new Date(selected.created_at).toLocaleDateString() : '-'}</p></div>
                <div><p className="text-slate-500">Updated</p><p>{selected.updated_at ? new Date(selected.updated_at).toLocaleDateString() : '-'}</p></div>
              </div>
              {selected.WarrantyClaim?.[0]?.claim_reason && (
                <div><p className="text-slate-500">Claim Reason</p><p className="mt-1 p-3 bg-slate-50 rounded-lg">{selected.WarrantyClaim[0].claim_reason}</p></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
