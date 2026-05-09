import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Search, Plus, X, Check, Package, ArrowLeft, FileText, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { getProducts, getPolicies, getBatches, createBatch } from "../../services/productManagementService";
import { generateWarrantyCodes } from "../../services/warrantyCodeService";
import { checkCoinBalanceForWarranty } from "../../services/coinService";
import { getDealersByProviderId } from "../../services/warrantyService";

export function WarrantyBatches({ embedded, compactTable, onDataChange } = {}) {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
  const [expandedId, setExpandedId] = useState(null);
  const [generating, setGenerating] = useState(false);

  const [form, setForm] = useState({
    product_master_id: "",
    warranty_policy_id: "",
    batch_name: "",
    serial_prefix: "",
    total_units: 10,
    code_prefix: "WR",
    assigned_dealer_id: "",
  });

  // Ref to track the latest total_units value to avoid React state timing issues
  const totalUnitsRef = useRef(10);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [batchData, productData] = await Promise.all([getBatches(), getProducts()]);
      setBatches(Array.isArray(batchData) ? batchData : []);
      setProducts(Array.isArray(productData) ? productData : []);

      try {
        const franchise = JSON.parse(localStorage.getItem("franchise") || "{}");
        const providerId = franchise?.provider_id || franchise?.id;
        if (providerId) {
          const res = await getDealersByProviderId(providerId);
          const dl = res?.data || [];
          setDealers(Array.isArray(dl) ? dl.filter((d) => d.is_active !== false) : []);
        }
      } catch { setDealers([]); }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleProductChange = async (productId) => {
    setForm((f) => ({ ...f, product_master_id: productId, warranty_policy_id: "" }));
    if (productId) {
      try {
        const data = await getPolicies(productId);
        setPolicies(Array.isArray(data) ? data : []);
      } catch { setPolicies([]); }
    } else {
      setPolicies([]);
    }
  };

  const selectedProduct = products.find((p) => p.id === form.product_master_id);
  const selectedPolicy = policies.find((p) => p.id === form.warranty_policy_id);

  const handleGenerate = async () => {
    if (!form.product_master_id) { toast.error("Select a product"); return; }
    if (!form.warranty_policy_id) { toast.error("Select a warranty policy"); return; }
    if (!form.batch_name.trim()) { toast.error("Batch name is required"); return; }
    
    // Use ref value to ensure we have the latest total_units (avoids React state timing issues)
    const totalUnits = totalUnitsRef.current;
    if (totalUnits < 1) { toast.error("Total units must be at least 1"); return; }

    // Check coin balance (duration-based: 3mo=1, 6mo=2, 1yr=4 coins per code)
    const warrantyDays = selectedPolicy?.warranty_duration_days || 365;
    const warrantyLabel = selectedPolicy?.warranty_duration_label || "1 Year";
    try {
      const balanceCheck = await checkCoinBalanceForWarranty(warrantyDays, totalUnits, warrantyLabel);
      if (!balanceCheck?.allowed) {
        toast.error(
          `Insufficient ecoins. You need ${balanceCheck.required ?? 0} ecoins to generate ${totalUnits} warranty codes. Current balance: ${balanceCheck.current ?? 0}.`
        );
        return;
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to check coin balance");
      return;
    }

    setGenerating(true);
    try {
      const batchPayload = { ...form, total_units: totalUnits };
      const batchResult = await createBatch(batchPayload);
      const batchId = batchResult?.id;

      const payload = {
        product_name: selectedProduct?.product_name || "",
        product_id: selectedProduct?.sku_code || "",
        serial_no: form.serial_prefix || "",
        warranty_code: form.code_prefix || "WR",
        warranty_days: selectedPolicy?.warranty_duration_days || 365,
        warranty_period_readable: selectedPolicy?.warranty_duration_label || "1 Year",
        serial_no_quantity: totalUnits,
        total_units: totalUnits,
        quantity: 1,
        type: "Product",
        other_type: "",
        vehicle_number: "",
        service_id: "",
        factory_item_number: selectedProduct?.sku_code || "",
        factory_service_number: "",
        warranty_registration_url: "",
        warranty_from: null,
        warranty_to: null,
        warranty_check: false,
        warranty_check_interval: 0,
        warranty_interval_dates: [],
        warranty_reminder_days: [0, 1, 2, 5, 10],
        terms_and_conditions: selectedPolicy?.terms_and_conditions ? [selectedPolicy.terms_and_conditions] : [],
        terms_and_conditions_link: selectedPolicy?.terms_url || "",
        is_active: true,
        print_type: "A4",
        batch_id: batchId || null,
        assigned_dealer_id: form.assigned_dealer_id || null,
      };

      const codeRes = await generateWarrantyCodes(payload);
      const pdfData = codeRes?.data?.data;
      if (pdfData) {
        try {
          const link = document.createElement("a");
          link.href = `data:application/pdf;base64,${pdfData}`;
          link.download = `batch-${form.batch_name.replace(/\s+/g, "-")}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success("QR codes PDF downloaded!");
        } catch { /* PDF download is optional */ }
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`Batch "${form.batch_name}" created with ${totalUnits} warranty codes!`);
      setView("list");
      setForm({ product_master_id: "", warranty_policy_id: "", batch_name: "", serial_prefix: "", total_units: 10, code_prefix: "WR", assigned_dealer_id: "" });
      totalUnitsRef.current = 10;
      fetchData();
      onDataChange?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to generate batch");
    } finally {
      setGenerating(false);
    }
  };

  const filtered = batches.filter((b) =>
    !search ||
    b.batch_name.toLowerCase().includes(search.toLowerCase()) ||
    (b.product?.product_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalCodes = batches.reduce((s, b) => s + (b._count?.codes || 0), 0);

  const statusBadge = (s) => {
    const m = { GENERATED: "bg-blue-50 text-blue-700", PARTIALLY_ASSIGNED: "bg-amber-50 text-amber-700", FULLY_ASSIGNED: "bg-green-50 text-green-700", DEPLETED: "bg-slate-100 text-slate-600" };
    return m[s] || "bg-slate-50 text-slate-600";
  };
  const statusLabel = (s) => {
    const m = { GENERATED: "Generated", PARTIALLY_ASSIGNED: "Partially Assigned", FULLY_ASSIGNED: "Fully Assigned", DEPLETED: "Depleted" };
    return m[s] || s;
  };

  // ── Create View ──
  if (view === "create") {
    return (
      <div className={embedded ? "space-y-4" : "p-4 lg:p-6"}>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <button onClick={() => setView("list")} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
              <ArrowLeft className="w-5 h-5" /> Back to Batches
            </button>
            <h2 className="text-xl font-bold text-slate-800">Generate Warranty Batch</h2>
            <p className="text-sm text-slate-500">Select a product and policy, then generate warranty codes</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            {/* Step 1: Product */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">1. Select Product *</label>
              <select value={form.product_master_id} onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]">
                <option value="">Choose a product from Product Master...</option>
                {products.filter((p) => p.is_active).map((p) => (
                  <option key={p.id} value={p.id}>{p.product_name}{p.model_number ? ` — ${p.model_number}` : ""}{p.sku_code ? ` (${p.sku_code})` : ""}</option>
                ))}
              </select>
              {products.length === 0 && !loading && (
                <p className="text-amber-600 text-xs mt-1">No products found. Create a product in Product Master first.</p>
              )}
            </div>

            {/* Step 2: Policy */}
            {form.product_master_id && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">2. Select Warranty Policy *</label>
                <select value={form.warranty_policy_id} onChange={(e) => setForm((f) => ({ ...f, warranty_policy_id: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]">
                  <option value="">Choose a warranty policy...</option>
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>{p.policy_name} — {p.warranty_duration_label} ({p.coverage_type?.replace("_", " ")})</option>
                  ))}
                </select>
                {policies.length === 0 && (
                  <p className="text-amber-600 text-xs mt-1">No policies found for this product. Create one in Warranty Policies first.</p>
                )}
              </div>
            )}

            {/* Step 3: Batch details */}
            {form.warranty_policy_id && (
              <>
                <div className="border-t border-slate-100 pt-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">3. Batch Details</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Batch Name *</label>
                      <input type="text" value={form.batch_name} onChange={(e) => setForm((f) => ({ ...f, batch_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                        placeholder="e.g., Batch-FEB-2026" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Total Units *</label>
                      <input type="number" min="1" max="1000" value={form.total_units} onChange={(e) => {
                        const newCount = Math.max(1, parseInt(e.target.value) || 1);
                        totalUnitsRef.current = newCount;
                        setForm((f) => ({ ...f, total_units: newCount }));
                      }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Serial Number Prefix</label>
                      <input type="text" value={form.serial_prefix} onChange={(e) => setForm((f) => ({ ...f, serial_prefix: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                        placeholder="e.g., SN (auto if empty)" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Code Prefix</label>
                      <input type="text" value={form.code_prefix} onChange={(e) => setForm((f) => ({ ...f, code_prefix: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                        placeholder="WR" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Assign to Dealer (optional)</label>
                      <select value={form.assigned_dealer_id} onChange={(e) => setForm((f) => ({ ...f, assigned_dealer_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]">
                        <option value="">No dealer (assign later)</option>
                        {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Policy Snapshot Preview */}
                {selectedPolicy && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Policy Snapshot (locked at generation)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div><span className="text-slate-400">Duration:</span> <span className="text-slate-700 font-medium">{selectedPolicy.warranty_duration_label}</span></div>
                      <div><span className="text-slate-400">Start Rule:</span> <span className="text-slate-700 font-medium">{selectedPolicy.start_rule?.replace(/_/g, " ")}</span></div>
                      <div><span className="text-slate-400">Coverage:</span> <span className="text-slate-700 font-medium">{selectedPolicy.coverage_type?.replace(/_/g, " ")}</span></div>
                      <div><span className="text-slate-400">Scope:</span> <span className="text-slate-700 font-medium">{selectedPolicy.coverage_scope?.replace(/_/g, " ")}</span></div>
                    </div>
                  </div>
                )}

                {/* Generation Summary */}
                <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
                  <p className="text-blue-900 text-sm font-medium mb-1">Generation Summary</p>
                  <p className="text-blue-700 text-sm">
                    This will generate <strong>{form.total_units}</strong> warranty codes for{" "}
                    <strong>{selectedProduct?.product_name}</strong> with{" "}
                    <strong>{selectedPolicy?.warranty_duration_label}</strong> warranty.
                    {form.assigned_dealer_id ? ` Assigned to dealer.` : ""}
                  </p>
                </div>

                <Button onClick={handleGenerate} disabled={generating} className="w-full h-12 bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-xl">
                  {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Check className="w-4 h-4 mr-2" /> Generate Batch ({form.total_units} codes)</>}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── List View ──
  return (
    <div className={embedded ? "space-y-4" : "p-4 lg:p-6 space-y-5"}>
      {!embedded && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Warranty Batches</h1>
              <p className="text-sm text-slate-500">Generate and manage warranty code batches</p>
            </div>
            <Button onClick={() => setView("create")} className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white">
              <Plus className="w-4 h-4 mr-2" /> Generate Batch
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{batches.length}</p>
              <p className="text-xs text-slate-500">Total Batches</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-[#1A7FC1]">{totalCodes}</p>
              <p className="text-xs text-slate-500">Total Codes</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{batches.filter((b) => b.assigned_dealer_id).length}</p>
              <p className="text-xs text-slate-500">Assigned to Dealers</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{batches.reduce((s, b) => s + b.total_units, 0)}</p>
              <p className="text-xs text-slate-500">Total Units</p>
            </div>
          </div>
        </>
      )}
      {embedded && (
        <div className="flex justify-end mb-2">
          <Button onClick={() => setView("create")} size="sm" className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white">
            <Plus className="w-4 h-4 mr-2" /> Generate Batch
          </Button>
        </div>
      )}

      {/* Search */}
      <div className={embedded ? "rounded-lg border border-slate-200 p-4 bg-slate-50/50" : "bg-white rounded-xl border border-slate-200 p-4"}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search by batch name or product..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Batch Name</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                {!compactTable && <th className="text-left px-4 py-3 font-semibold text-slate-600">Policy</th>}
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Units</th>
                {!compactTable && <th className="text-center px-4 py-3 font-semibold text-slate-600">Codes</th>}
                {!compactTable && <th className="text-left px-4 py-3 font-semibold text-slate-600">Dealer</th>}
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                {!compactTable && <th className="text-left px-4 py-3 font-semibold text-slate-600">Created</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={compactTable ? 4 : 8} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1A7FC1] mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={compactTable ? 4 : 8} className="text-center py-12">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">No batches found</p>
                  <p className="text-slate-400 text-xs mt-1">Click "Generate Batch" to create your first batch</p>
                </td></tr>
              ) : filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{b.batch_name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{b.product?.product_name || "—"}</td>
                  {!compactTable && (
                    <td className="px-4 py-2.5 text-slate-600 text-xs">{b.policy?.policy_name || "—"}<br /><span className="text-slate-400">{b.policy?.warranty_duration_label}</span></td>
                  )}
                  <td className="px-4 py-2.5 text-center text-slate-800 font-medium">{b.total_units}</td>
                  {!compactTable && <td className="px-4 py-2.5 text-center text-[#1A7FC1] font-medium">{b._count?.codes || 0}</td>}
                  {!compactTable && <td className="px-4 py-2.5 text-slate-600">{b.assigned_dealer?.name || "—"}</td>}
                  <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(b.status)}`}>{statusLabel(b.status)}</span></td>
                  {!compactTable && <td className="px-4 py-2.5 text-slate-500 text-xs">{new Date(b.created_at).toLocaleDateString()}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
