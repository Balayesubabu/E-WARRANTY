import { useState, useEffect } from 'react';
import { Package, Search, ArrowUpDown } from 'lucide-react';
import { getDealerInventory } from '../../services/dealerService';
import { toast } from 'sonner';

export function DealerInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('product_name');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    getDealerInventory()
      .then((data) => setInventory(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load inventory'))
      .finally(() => setLoading(false));
  }, []);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = inventory
    .filter((i) => i.product_name.toLowerCase().includes(search.toLowerCase()) || (i.model_number || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const totals = filtered.reduce(
    (acc, i) => ({ purchased: acc.purchased + i.purchased, sold: acc.sold + i.sold, available: acc.available + i.available }),
    { purchased: 0, sold: 0, available: 0 }
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A7FC1]" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Inventory / My Stock</h2>
        <p className="text-sm text-slate-500 mt-1">Track stock purchased from owner and units sold</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Purchased</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totals.purchased}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Sold</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{totals.sold}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Available Stock</p>
          <p className="text-2xl font-bold text-[#1A7FC1] mt-1">{totals.available}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">Stock Details</h3>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 h-9 w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by product or model..." className="bg-transparent outline-none text-sm w-full" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {['product_name', 'model_number', 'purchased', 'sold', 'available'].map((key) => (
                  <th key={key} onClick={() => toggleSort(key)} className="text-left px-4 py-3 select-none cursor-pointer hover:text-slate-700">
                    <span className="flex items-center gap-1">
                      {key === 'product_name' ? 'Product' : key === 'model_number' ? 'Model' : key.charAt(0).toUpperCase() + key.slice(1)}
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  No inventory data. Stock will appear here when the owner creates purchase orders.
                </td></tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.product_name}</td>
                    <td className="px-4 py-3 text-slate-600">{item.model_number || '-'}</td>
                    <td className="px-4 py-3 text-slate-900">{item.purchased}</td>
                    <td className="px-4 py-3 text-green-600">{item.sold}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${item.available <= 5 ? 'text-red-600' : 'text-[#1A7FC1]'}`}>
                        {item.available}
                        {item.available <= 5 && item.available > 0 && <span className="ml-1 text-xs font-normal text-red-500">(Low)</span>}
                      </span>
                    </td>
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
