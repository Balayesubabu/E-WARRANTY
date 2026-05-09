import { useState, useEffect, useCallback } from "react";
import { Box, Loader2, Search, Plus, Edit, Trash2, X, Check, Power } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../../services/productManagementService";
import { getWarrantySettings } from "../../services/warrantyCodeService";

const EMPTY_FORM = { product_name: "", model_number: "", sku_code: "", category: "", brand: "", description: "" };

export function OwnerProductMaster({ embedded, compactTable, onDataChange } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getWarrantySettings();
        const settings = res?.data ?? res;
        setDefaultCategory(typeof settings?.default_category === "string" ? settings.default_category.trim() : "");
      } catch { /* ignore */ }
    };
    load();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter((p) =>
    !search ||
    p.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku_code || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.model_number || "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, category: defaultCategory });
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditId(p.id);
    setForm({
      product_name: p.product_name || "",
      model_number: p.model_number || "",
      sku_code: p.sku_code || "",
      category: p.category || "",
      brand: p.brand || "",
      description: p.description || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.product_name.trim()) { toast.error("Product name is required"); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateProduct(editId, form);
        toast.success("Product updated");
      } else {
        await createProduct(form);
        toast.success("Product created");
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      fetchProducts();
      onDataChange?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      fetchProducts();
      onDataChange?.();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleToggleActive = async (p) => {
    try {
      await updateProduct(p.id, { is_active: !p.is_active });
      toast[p.is_active ? "error" : "success"](`Product ${p.is_active ? "deactivated" : "activated"}`);
      fetchProducts();
      onDataChange?.();
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className={embedded ? "space-y-4" : "p-4 lg:p-6 space-y-5"}>
      {!embedded && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Product Master</h1>
              <p className="text-sm text-slate-500">Manage your product catalog</p>
            </div>
            <Button onClick={openCreate} className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{products.length}</p>
              <p className="text-xs text-slate-500">Total Products</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{products.filter(p => p.is_active).length}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{products.reduce((s, p) => s + (p._count?.warranty_batches || 0), 0)}</p>
              <p className="text-xs text-slate-500">Total Batches</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-[#1A7FC1]">{products.reduce((s, p) => s + (p.warranty_policies?.length || 0), 0)}</p>
              <p className="text-xs text-slate-500">Policies</p>
            </div>
          </div>
        </>
      )}
      {embedded && (
        <div className="flex justify-end mb-2">
          <Button onClick={openCreate} size="sm" className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      )}

      {/* Search */}
      <div className={embedded ? "rounded-lg border border-slate-200 p-4 bg-slate-50/50" : "bg-white rounded-xl border border-slate-200 p-4"}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by product name, model, or SKU..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]" />
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className={embedded ? "rounded-xl border border-slate-200 p-5 shadow-sm bg-white" : "bg-white rounded-xl border border-slate-200 p-5 shadow-sm"}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">{editId ? "Edit Product" : "Add New Product"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Product Name *</label>
              <input type="text" value={form.product_name} onChange={(e) => setForm(f => ({ ...f, product_name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]" placeholder="e.g., iPhone 15 Pro" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Model Number</label>
              <input type="text" value={form.model_number} onChange={(e) => setForm(f => ({ ...f, model_number: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]" placeholder="e.g., A3100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">SKU Code</label>
              <input type="text" value={form.sku_code} onChange={(e) => setForm(f => ({ ...f, sku_code: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]" placeholder="e.g., SKU-IP15PRO" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <input type="text" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]" placeholder="e.g., Electronics" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Brand</label>
              <input type="text" value={form.brand} onChange={(e) => setForm(f => ({ ...f, brand: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]" placeholder="e.g., Apple" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]" placeholder="Brief description..." />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              {editId ? "Update" : "Create"} Product
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={embedded ? "rounded-xl border border-slate-200 overflow-hidden bg-white" : "bg-white rounded-xl border border-slate-200 overflow-hidden"}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Product Name</th>
                {!compactTable && <th className="text-left px-4 py-3 font-semibold text-slate-600">Model</th>}
                {!compactTable && <th className="text-left px-4 py-3 font-semibold text-slate-600">SKU</th>}
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                {!compactTable && <th className="text-left px-4 py-3 font-semibold text-slate-600">Brand</th>}
                {!compactTable && <th className="text-center px-4 py-3 font-semibold text-slate-600">Policies</th>}
                {!compactTable && <th className="text-center px-4 py-3 font-semibold text-slate-600">Batches</th>}
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={compactTable ? 4 : 9} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1A7FC1] mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={compactTable ? 4 : 9} className="text-center py-12">
                  <Box className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">No products found</p>
                  <p className="text-slate-400 text-xs mt-1">Click "Add Product" to create your first product</p>
                </td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{p.product_name}</td>
                  {!compactTable && <td className="px-4 py-2.5 text-slate-600">{p.model_number || "—"}</td>}
                  {!compactTable && <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{p.sku_code || "—"}</td>}
                  <td className="px-4 py-2.5 text-slate-600">{p.category || "—"}</td>
                  {!compactTable && <td className="px-4 py-2.5 text-slate-600">{p.brand || "—"}</td>}
                  {!compactTable && <td className="px-4 py-2.5 text-center text-[#1A7FC1] font-medium">{p.warranty_policies?.length || 0}</td>}
                  {!compactTable && <td className="px-4 py-2.5 text-center text-slate-700 font-medium">{p._count?.warranty_batches || 0}</td>}
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(p)} className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center" title="Edit">
                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <button onClick={() => handleToggleActive(p)} className={`w-7 h-7 rounded-md flex items-center justify-center ${p.is_active ? "bg-amber-50 hover:bg-amber-100" : "bg-green-50 hover:bg-green-100"}`} title={p.is_active ? "Deactivate" : "Activate"}>
                        <Power className={`w-3.5 h-3.5 ${p.is_active ? "text-amber-600" : "text-green-600"}`} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="w-7 h-7 rounded-md bg-red-50 hover:bg-red-100 flex items-center justify-center" title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
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
