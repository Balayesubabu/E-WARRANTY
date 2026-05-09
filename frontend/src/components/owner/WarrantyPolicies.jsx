import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Search,
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  Power,
  ShieldCheck,
  FileText,
  PlusCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import {
  getPolicies,
  getProducts,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from "../../services/productManagementService";

const EMPTY_CUSTOM_FIELD = {
  field_name: "",
  field_type: "text",
  required: false,
  options: [],
};

const EMPTY_FORM = {
  product_master_id: "",
  policy_name: "",
  warranty_duration_days: "",
  warranty_duration_label: "",
  start_rule: "FROM_ACTIVATION",
  coverage_type: "BOTH",
  coverage_scope: "FULL_COVERAGE",
  claim_approval_required: true,
  escalation_days: "",
  max_claim_count: "",
  terms_and_conditions: "",
  terms_url: "",
  custom_fields: [],
};

// Must match WarrantyStartRule enum in backend (schema.prisma)
const START_RULES = [
  { value: "FROM_ACTIVATION", label: "From activation" },
  { value: "FROM_INVOICE_DATE", label: "From invoice / purchase date" },
  { value: "FROM_DISPATCH_DATE", label: "From dispatch date" },
  { value: "FROM_MANUFACTURING_DATE", label: "From manufacturing date" },
];

// Must match CoverageType enum in backend (schema.prisma)
const COVERAGE_TYPES = [
  { value: "BOTH", label: "Repair & Replacement" },
  { value: "REPAIR_ONLY", label: "Repair only" },
  { value: "REPLACEMENT_ONLY", label: "Replacement only" },
];

// Must match CoverageScope enum in backend (schema.prisma)
const COVERAGE_SCOPES = [
  { value: "FULL_COVERAGE", label: "Full coverage" },
  { value: "PARTS_ONLY", label: "Parts only" },
  { value: "LABOR_ONLY", label: "Labour only" },
];

export function WarrantyPolicies({ embedded, compactTable, onDataChange } = {}) {
  const [policies, setPolicies] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPolicies();
      setPolicies(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load warranty policies");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = policies.filter(
    (p) =>
      !search ||
      (p.policy_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.product?.product_name || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (p.product?.model_number || "")
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (p) => {
    const cfRaw = p.custom_fields;
    const customFields = Array.isArray(cfRaw)
      ? cfRaw.map((cf) => ({
          field_name: cf.field_name || "",
          field_type: cf.field_type || "text",
          required: cf.required === true,
          options: Array.isArray(cf.options) ? [...cf.options] : [],
        }))
      : [];
    setEditId(p.id);
    setForm({
      product_master_id: p.product_master_id || "",
      policy_name: p.policy_name || "",
      warranty_duration_days: p.warranty_duration_days?.toString() || "",
      warranty_duration_label: p.warranty_duration_label || "",
      start_rule: p.start_rule || "FROM_ACTIVATION",
      coverage_type: p.coverage_type || "BOTH",
      coverage_scope: p.coverage_scope || "FULL_COVERAGE",
      claim_approval_required: p.claim_approval_required !== false,
      escalation_days: p.escalation_days?.toString() || "",
      max_claim_count: p.max_claim_count?.toString() || "",
      terms_and_conditions: p.terms_and_conditions || "",
      terms_url: p.terms_url || "",
      custom_fields: customFields,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.policy_name?.trim()) {
      toast.error("Policy name is required");
      return;
    }
    if (!form.product_master_id) {
      toast.error("Product is required");
      return;
    }
    const days = parseInt(form.warranty_duration_days, 10);
    if (!form.warranty_duration_days || isNaN(days) || days < 1) {
      toast.error("Warranty duration (days) is required and must be at least 1");
      return;
    }

    setSaving(true);
    try {
      const customFieldsPayload = (form.custom_fields || [])
        .filter((cf) => cf.field_name?.trim())
        .map((cf) => ({
          field_name: cf.field_name.trim(),
          field_type: cf.field_type || "text",
          required: cf.required === true,
          options:
            cf.field_type === "select" && Array.isArray(cf.options)
              ? cf.options.filter(Boolean).map((o) => String(o).trim())
              : [],
        }));

      const payload = {
        product_master_id: form.product_master_id,
        policy_name: form.policy_name.trim(),
        warranty_duration_days: days,
        warranty_duration_label:
          form.warranty_duration_label?.trim() || `${days} days`,
        start_rule: form.start_rule,
        coverage_type: form.coverage_type,
        coverage_scope: form.coverage_scope,
        claim_approval_required: form.claim_approval_required,
        escalation_days: form.escalation_days
          ? parseInt(form.escalation_days, 10)
          : null,
        max_claim_count: form.max_claim_count
          ? parseInt(form.max_claim_count, 10)
          : null,
        terms_and_conditions: form.terms_and_conditions?.trim() || null,
        terms_url: form.terms_url?.trim() || null,
        custom_fields: customFieldsPayload,
      };

      if (editId) {
        await updatePolicy(editId, payload);
        toast.success("Warranty policy updated");
      } else {
        await createPolicy(payload);
        toast.success("Warranty policy created");
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      fetchPolicies();
      onDataChange?.();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to save warranty policy"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this warranty policy? This cannot be undone."))
      return;
    try {
      await deletePolicy(id);
      toast.success("Warranty policy deleted");
      fetchPolicies();
      onDataChange?.();
    } catch {
      toast.error("Failed to delete warranty policy");
    }
  };

  const addCustomField = () => {
    setForm((f) => ({
      ...f,
      custom_fields: [...(f.custom_fields || []), { ...EMPTY_CUSTOM_FIELD }],
    }));
  };

  const removeCustomField = (idx) => {
    setForm((f) => ({
      ...f,
      custom_fields: (f.custom_fields || []).filter((_, i) => i !== idx),
    }));
  };

  const updateCustomField = (idx, key, value) => {
    setForm((f) => {
      const cf = [...(f.custom_fields || [])];
      if (!cf[idx]) return f;
      cf[idx] = { ...cf[idx], [key]: value };
      if (key === "field_type" && value !== "select") {
        cf[idx].options = [];
      }
      return { ...f, custom_fields: cf };
    });
  };

  const updateCustomFieldOptions = (idx, optionsStr) => {
    const options = optionsStr
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    setForm((f) => {
      const cf = [...(f.custom_fields || [])];
      if (!cf[idx]) return f;
      cf[idx] = { ...cf[idx], options };
      return { ...f, custom_fields: cf };
    });
  };

  const handleToggle = async (p) => {
    try {
      await updatePolicy(p.id, { is_active: !p.is_active });
      toast[p.is_active ? "warning" : "success"](
        p.is_active ? "Policy deactivated" : "Policy activated"
      );
      fetchPolicies();
      onDataChange?.();
    } catch {
      toast.error("Failed to update policy status");
    }
  };

  const activeCount = policies.filter((p) => p.is_active).length;
  const inactiveCount = policies.length - activeCount;
  const totalBatches = policies.reduce(
    (s, p) => s + (p._count?.warranty_batches || 0),
    0
  );

  return (
    <div className={embedded ? "space-y-4" : "p-4 lg:p-6 space-y-5"}>
      {!embedded && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-800">
                Warranty Policies
              </h1>
              <p className="text-sm text-slate-500">
                Define warranty terms per product (duration, coverage, claims)
              </p>
            </div>
            <Button
              onClick={openCreate}
              className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Policy
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{policies.length}</p>
              <p className="text-xs text-slate-500">Total Policies</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{inactiveCount}</p>
              <p className="text-xs text-slate-500">Inactive</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-[#1A7FC1]">{totalBatches}</p>
              <p className="text-xs text-slate-500">Batches Linked</p>
            </div>
          </div>
        </>
      )}
      {embedded && (
        <div className="flex justify-end mb-2">
          <Button onClick={openCreate} size="sm" className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Policy
          </Button>
        </div>
      )}

      {/* Search */}
      <div className={embedded ? "rounded-lg border border-slate-200 p-4 bg-slate-50/50" : "bg-white rounded-xl border border-slate-200 p-4"}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by policy name or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
          />
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#1A7FC1]" />
              {editId ? "Edit Warranty Policy" : "Add New Warranty Policy"}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditId(null);
              }}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Product *
              </label>
              <select
                value={form.product_master_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, product_master_id: e.target.value }))
                }
                disabled={!!editId}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1] disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Select product</option>
                {products.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.product_name}
                    {pr.model_number ? ` (${pr.model_number})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Warranty Period *
              </label>
              <input
                type="text"
                value={form.policy_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, policy_name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                placeholder="e.g., Standard 1 Year"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Warranty duration (days) *
              </label>
              <input
                type="number"
                min="1"
                value={form.warranty_duration_days}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    warranty_duration_days: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                placeholder="365"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Duration label
              </label>
              <input
                type="text"
                value={form.warranty_duration_label}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    warranty_duration_label: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                placeholder="e.g., 1 Year"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Start rule
              </label>
              <select
                value={form.start_rule}
                onChange={(e) =>
                  setForm((f) => ({ ...f, start_rule: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
              >
                {START_RULES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Coverage type
              </label>
              <select
                value={form.coverage_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, coverage_type: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
              >
                {COVERAGE_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Coverage scope
              </label>
              <select
                value={form.coverage_scope}
                onChange={(e) =>
                  setForm((f) => ({ ...f, coverage_scope: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
              >
                {COVERAGE_SCOPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="claim_approval"
                checked={form.claim_approval_required}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    claim_approval_required: e.target.checked,
                  }))
                }
                className="rounded border-slate-300 text-[#1A7FC1] focus:ring-[#1A7FC1]"
              />
              <label htmlFor="claim_approval" className="text-sm text-slate-600">
                Claim approval required
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Max claims (optional)
              </label>
              <input
                type="number"
                min="0"
                value={form.max_claim_count}
                onChange={(e) =>
                  setForm((f) => ({ ...f, max_claim_count: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                placeholder="Leave empty for unlimited"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Escalation days (optional)
              </label>
              <input
                type="number"
                min="0"
                value={form.escalation_days}
                onChange={(e) =>
                  setForm((f) => ({ ...f, escalation_days: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                placeholder="Days to escalate"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Terms & conditions (optional)
              </label>
              <textarea
                value={form.terms_and_conditions}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    terms_and_conditions: e.target.value,
                  }))
                }
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                placeholder="Short terms or leave empty"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Terms URL (optional)
              </label>
              <input
                type="url"
                value={form.terms_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, terms_url: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1A7FC1]" />
                  Custom Fields
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add fields that customers must fill when registering a warranty (e.g., Serial No, Installation Type). These appear on registration forms.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomField}
                className="border-[#1A7FC1] text-[#1A7FC1] hover:bg-[#1A7FC1]/5"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>

            {(form.custom_fields || []).length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No custom fields added</p>
                <p className="text-xs text-slate-400 mt-1">Click &quot;Add Field&quot; to collect extra details per product</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(form.custom_fields || []).map((cf, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Field label *</label>
                        <input
                          type="text"
                          value={cf.field_name}
                          onChange={(e) => updateCustomField(idx, "field_name", e.target.value)}
                          placeholder="e.g., Serial Number"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                        <select
                          value={cf.field_type}
                          onChange={(e) => updateCustomField(idx, "field_type", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="select">Select (dropdown)</option>
                        </select>
                      </div>
                      {cf.field_type === "select" && (
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Options (comma-separated)</label>
                          <input
                            type="text"
                            value={(cf.options || []).join(", ")}
                            onChange={(e) => updateCustomFieldOptions(idx, e.target.value)}
                            placeholder="e.g., Indoor, Outdoor, Split"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                          />
                        </div>
                      )}
                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cf.required}
                            onChange={(e) => updateCustomField(idx, "required", e.target.checked)}
                            className="rounded border-slate-300 text-[#1A7FC1] focus:ring-[#1A7FC1]"
                          />
                          <span className="text-sm text-slate-600">Required</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center sm:pt-6">
                      <button
                        type="button"
                        onClick={() => removeCustomField(idx)}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                        title="Remove field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {editId ? "Update" : "Create"} Policy
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Policy name</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Duration</th>
                {!compactTable && <th className="text-left px-4 py-3 font-semibold text-slate-600">Coverage</th>}
                {!compactTable && <th className="text-center px-4 py-3 font-semibold text-slate-600">Batches</th>}
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={compactTable ? 5 : 7} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1A7FC1] mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={compactTable ? 5 : 7} className="text-center py-12">
                    <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">No warranty policies found</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Click &quot;Add Policy&quot; to create your first policy
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800">{p.product?.product_name || "—"}</div>
                      {!compactTable && p.product?.model_number && (
                        <div className="text-xs text-slate-500">{p.product.model_number}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{p.policy_name || "—"}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {p.warranty_duration_label || `${p.warranty_duration_days ?? 0} days`}
                    </td>
                    {!compactTable && (
                      <td className="px-4 py-2.5 text-slate-600">{p.coverage_type || "—"}</td>
                    )}
                    {!compactTable && (
                      <td className="px-4 py-2.5 text-center font-medium text-slate-700">{p._count?.warranty_batches ?? 0}</td>
                    )}
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleToggle(p)}
                          className={`w-7 h-7 rounded-md flex items-center justify-center ${
                            p.is_active
                              ? "bg-green-50 hover:bg-green-100"
                              : "bg-slate-100 hover:bg-slate-200"
                          }`}
                          title={p.is_active ? "Deactivate" : "Activate"}
                        >
                          <Power
                            className={`w-3.5 h-3.5 ${
                              p.is_active ? "text-green-600" : "text-slate-400"
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="w-7 h-7 rounded-md bg-red-50 hover:bg-red-100 flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      </div>
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
