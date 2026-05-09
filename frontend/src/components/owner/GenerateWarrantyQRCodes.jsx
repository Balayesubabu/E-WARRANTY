import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, FileDown, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  createProduct,
  createPolicy,
  createBatch,
} from "../../services/productManagementService";
import { generateWarrantyCodes, getWarrantySettings } from "../../services/warrantyCodeService";
import { getDealersByProviderId } from "../../services/warrantyService";
import { checkCoinBalanceForWarranty } from "../../services/coinService";
import { getCategories } from "../../services/warrantyTemplateService";
import {
  yearsMonthsToDays,
  yearsMonthsToReadableLabel,
  WARRANTY_DAYS_MIN,
  WARRANTY_DAYS_MAX,
  WARRANTY_YEARS_MAX,
  WARRANTY_MONTHS_MAX,
} from "../../utils/warrantyUtils";
import { getEffectiveRegistrationUrl } from "../../utils/registrationUrl";

const WARRANTY_PERIODS = [
  { value: "90", days: 90, label: "3 Months" },
  { value: "180", days: 180, label: "6 Months" },
  { value: "365", days: 365, label: "1 Year" },
  { value: "730", days: 730, label: "2 Years" },
  { value: "1095", days: 1095, label: "3 Years" },
  { value: "custom", days: null, label: "Custom" },
];

const STATIC_CATEGORIES = ["Electronics", "Appliances", "Auto Parts", "Machinery", "Furniture", "Other"];

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1]";

export default function GenerateWarrantyQRCodes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [settingsDefaultCategory, setSettingsDefaultCategory] = useState("");

  const [form, setForm] = useState({
    category: "",
    product_name: "",
    model_number: "",
    warranty_period: "365",
    warranty_custom_years: "1",
    warranty_custom_months: "0",
    policy_name: "",
    batch_name: "",
    qr_count: 10,
    code_prefix: "WR",
    serial_prefix: "",
    assigned_dealer_id: "",
  });
  const [customFields, setCustomFields] = useState([]); // [{ key: "", value: "" }]
  const [standardFormVisible, setStandardFormVisible] = useState(true);
  
  // Ref to track the latest qr_count value to avoid React state timing issues
  const qrCountRef = useRef(form.qr_count);

  const baseCategoryOptions =
    categories.length > 0
      ? categories.map((c) => ({ value: c.name, label: c.name }))
      : STATIC_CATEGORIES.map((c) => ({ value: c, label: c }));
  const hasCustomDefault =
    settingsDefaultCategory &&
    !baseCategoryOptions.some((o) => o.value === settingsDefaultCategory);
  const categoryOptions = hasCustomDefault
    ? [...baseCategoryOptions, { value: settingsDefaultCategory, label: settingsDefaultCategory }]
    : baseCategoryOptions;

  const fetchCategories = useCallback(async () => {
    try {
      const list = await getCategories();
      setCategories(Array.isArray(list) ? list : []);
    } catch {
      setCategories([]);
    }
  }, []);

  const fetchDealers = useCallback(async () => {
    try {
      const franchise = JSON.parse(localStorage.getItem("franchise") || "{}");
      const providerId = franchise?.provider_id || franchise?.id;
      if (providerId) {
        const res = await getDealersByProviderId(providerId);
        const dl = res?.data || res || [];
        setDealers(Array.isArray(dl) ? dl.filter((d) => d.is_active !== false) : []);
      }
    } catch {
      setDealers([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchDealers();
  }, [fetchCategories, fetchDealers]);

  // Pre-fill category from System Settings default (includes custom "Other" name)
  useEffect(() => {
    const loadDefaultCategory = async () => {
      try {
        const res = await getWarrantySettings();
        const settings = res?.data ?? res;
        const defaultCat = typeof settings?.default_category === "string" ? settings.default_category.trim() : "";
        if (defaultCat) {
          setSettingsDefaultCategory(defaultCat);
          setForm((f) => ({ ...f, category: defaultCat }));
        }
      } catch {
        // ignore - use empty category
      }
    };
    loadDefaultCategory();
  }, []);

  const getWarrantyDuration = () => {
    if (form.warranty_period === "custom") {
      const y = parseInt(form.warranty_custom_years, 10) || 0;
      const m = parseInt(form.warranty_custom_months, 10) || 0;
      const days = Math.max(WARRANTY_DAYS_MIN, Math.min(WARRANTY_DAYS_MAX, yearsMonthsToDays(y, m) || 365));
      return { days, label: yearsMonthsToReadableLabel(y, m) };
    }
    const p = WARRANTY_PERIODS.find((w) => w.value === form.warranty_period && w.days != null);
    return p ? { days: p.days, label: p.label } : { days: 365, label: "1 Year" };
  };

  const handleSubmit = async () => {
    // Check warranty settings (Registration URL) before creating product/policy/batch
    try {
      const res = await getWarrantySettings();
      const settings = res?.data ?? res;
      if (!getEffectiveRegistrationUrl(settings)) {
        toast.error(
          "Registration URL is not available. Set FRONTEND_URL on the server (production) or configure System Settings → Registration URL."
        );
        return;
      }
    } catch {
      toast.error(
        "Registration URL is not available. Set FRONTEND_URL on the server (production) or configure System Settings → Registration URL."
      );
      return;
    }

    const useCustomOnly = !standardFormVisible;
    let productName, policyName, batchName;

    if (useCustomOnly) {
      const validCustomFields = customFields.filter((f) => f.key?.trim() && f.value?.trim());
      if (validCustomFields.length === 0) {
        toast.error("Add at least one custom field with name and value");
        return;
      }
      const ts = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
      productName = `Custom Product ${ts}`;
      policyName = "Custom Policy";
      batchName = `Custom Batch ${ts}`;
    } else {
      if (!form.product_name?.trim()) {
        toast.error("Product name is required");
        return;
      }
      // if (!form.policy_name?.trim()) {
      //   toast.error("Policy name is required");
      //   return;
      // }
      productName = form.product_name.trim();
      policyName = form.policy_name?.trim() || (form.product_name || "Product") + " Standard Warranty";
    }

    if (!form.batch_name?.trim()) {
      toast.error("Batch name is required");
      return;
    }
    batchName = form.batch_name.trim();

    const { days, label } = getWarrantyDuration();
    if (form.warranty_period === "custom") {
      const y = parseInt(form.warranty_custom_years, 10) || 0;
      const m = parseInt(form.warranty_custom_months, 10) || 0;
      const totalDays = yearsMonthsToDays(y, m);
      if (totalDays < WARRANTY_DAYS_MIN || totalDays > WARRANTY_DAYS_MAX) {
        toast.error("Warranty period must be at least 1 month (e.g. 0 years 1 month)");
        return;
      }
    }

    // Use ref value to ensure we have the latest qr_count (avoids React state timing issues)
    const qrCount = qrCountRef.current;
    if (qrCount < 1) {
      toast.error("Number of QR codes must be at least 1");
      return;
    }

    // Check coin balance BEFORE creating product/policy/batch (duration-based: 3mo=1, 6mo=2, 1yr=4 coins)
    try {
      const balanceCheck = await checkCoinBalanceForWarranty(days, qrCount, label);
      if (!balanceCheck?.allowed) {
        toast.error(
          `Insufficient ecoins. You need ${balanceCheck.required ?? 0} ecoins to generate ${qrCount} warranty codes. Current balance: ${balanceCheck.current ?? 0}.`
        );
        return;
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to check coin balance");
      return;
    }

    setLoading(true);
    const product = {
      product_name: productName,
      model_number: useCustomOnly ? "" : (form.model_number || ""),
      sku_code: "",
      category: useCustomOnly ? "" : (form.category || ""),
      brand: "",
      description: "",
    };

    try {
      const productRes = await createProduct(product);
      const productId = productRes?.id;
      if (!productId) throw new Error("Failed to create product");
      const systemItemCode = productRes?.sku_code || "";

      const customFieldsObj = customFields
        .filter((f) => f.key?.trim())
        .reduce((acc, f) => ({ ...acc, [f.key.trim()]: f.value?.trim() || "" }), {});
      const customFieldsArr = Object.keys(customFieldsObj).length
        ? Object.entries(customFieldsObj).map(([k, v]) => ({ key: k, value: v }))
        : null;

      const policyRes = await createPolicy({
        product_master_id: productId,
        policy_name: policyName,
        warranty_duration_days: days,
        warranty_duration_label: label,
        start_rule: "FROM_ACTIVATION",
        coverage_type: "BOTH",
        coverage_scope: "FULL_COVERAGE",
        claim_approval_required: true,
        custom_fields: customFieldsArr,
      });
      const policyId = policyRes?.id;
      if (!policyId) throw new Error("Failed to create policy");

      const batchRes = await createBatch({
        product_master_id: productId,
        warranty_policy_id: policyId,
        batch_name: batchName,
        serial_prefix: form.serial_prefix || "",
        total_units: qrCount,
        code_prefix: form.code_prefix || "WR",
        assigned_dealer_id: form.assigned_dealer_id || null,
      });
      const batchId = batchRes?.id;

      const codeRes = await generateWarrantyCodes({
        product_name: product.product_name,
        product_id: systemItemCode || "",
        serial_no: form.serial_prefix || "",
        warranty_code: form.code_prefix || "WR",
        warranty_days: days,
        warranty_period_readable: label,
        serial_no_quantity: qrCount,
        qr_count: qrCount,
        total_units: qrCount,
        quantity: 1,
        type: "Product",
        other_type: "",
        vehicle_number: "",
        service_id: "",
        factory_item_number: systemItemCode || "",
        factory_service_number: "",
        warranty_registration_url: "",
        warranty_from: null,
        warranty_to: null,
        warranty_check: false,
        warranty_check_interval: 0,
        warranty_interval_dates: [],
        warranty_reminder_days: [0, 1, 2, 5, 10],
        terms_and_conditions: [],
        terms_and_conditions_link: "",
        is_active: true,
        print_type: "A4",
        batch_id: batchId || null,
        assigned_dealer_id: form.assigned_dealer_id || null,
        ...(customFieldsArr && customFieldsArr.length > 0
          ? { custom_fields: customFieldsArr }
          : {}),
      });

      const pdfData = codeRes?.data?.data;
      if (pdfData) {
        try {
          const link = document.createElement("a");
          link.href = `data:application/pdf;base64,${pdfData}`;
          link.download = `warranty-batch-${batchName.replace(/\s+/g, "-")}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success("QR codes PDF downloaded!");
        } catch {}
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`Product, policy, and ${qrCount} warranty codes created!`);
      navigate("/owner/warranty-management");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800 mb-2 text-center">
          Add Product
        </h1>
        <p className="text-sm text-slate-500 mb-6 text-center">
          Create product, warranty policy, batch, and generate QR codes.
        </p>

        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 space-y-4">
          {/* Standard form – dismissable with X */}
          {standardFormVisible && (
            <div className="relative p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
              {/* <button
                type="button"
                onClick={() => setStandardFormVisible(false)}
                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                aria-label="Close form"
              >
                <X className="w-5 h-5" />
              </button> */}
              <h3 className="text-sm font-semibold text-slate-700 pr-8">Product & Policy Details</h3>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={form.product_name}
                  onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
                  placeholder="e.g., LED TV 55 inch"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Model Number</label>
                <input
                  type="text"
                  value={form.model_number}
                  onChange={(e) => setForm((f) => ({ ...f, model_number: e.target.value }))}
                  placeholder="e.g., TV-55-A1"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Warranty Period</label>
                <select
                  value={form.warranty_period}
                  onChange={(e) => setForm((f) => ({ ...f, warranty_period: e.target.value }))}
                  className={inputClass}
                >
                  {WARRANTY_PERIODS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                {form.warranty_period === "custom" && (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={WARRANTY_YEARS_MAX}
                        value={form.warranty_custom_years}
                        onChange={(e) => {
                          const v = e.target.value;
                          const y = v === "" ? 0 : Math.min(WARRANTY_YEARS_MAX, Math.max(0, parseInt(v, 10) || 0));
                          setForm((f) => ({ ...f, warranty_custom_years: v === "" ? "" : String(y) }));
                        }}
                        placeholder="Years"
                        className={`${inputClass} w-24`}
                      />
                      <span className="text-xs text-slate-600">Years</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={WARRANTY_MONTHS_MAX}
                        value={form.warranty_custom_months}
                        onChange={(e) => {
                          const v = e.target.value;
                          const m = v === "" ? 0 : Math.min(WARRANTY_MONTHS_MAX, Math.max(0, parseInt(v, 10) || 0));
                          setForm((f) => ({ ...f, warranty_custom_months: v === "" ? "" : String(m) }));
                        }}
                        placeholder="Months"
                        className={`${inputClass} w-24`}
                      />
                      <span className="text-xs text-slate-600">Months</span>
                    </div>
                    {/* <span className="text-xs text-slate-500">
                      = {yearsMonthsToReadableLabel(
                        parseInt(form.warranty_custom_years, 10) || 0,
                        parseInt(form.warranty_custom_months, 10) || 0
                      )}
                    </span> */}
                  </div>
                )}
              </div>
              {/*               {false && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Policy Name *</label>
                <input
                  type="text"
                  value={form.policy_name}
                  onChange={(e) => setForm((f) => ({ ...f, policy_name: e.target.value }))}
                  placeholder={`e.g., ${form.product_name || "Product"} Standard Warranty`}
                  className={inputClass}
                />
              </div>
              )} */}
            </div>
          )}

          {!standardFormVisible && (
            <button
              type="button"
              onClick={() => setStandardFormVisible(true)}
              className="text-sm text-[#1A7FC1] hover:text-[#166EA8] font-medium"
            >
              ↑ Show product & policy form again
            </button>
          )}

          {/* Custom Fields – always visible, primary when standard form is hidden */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">
              Custom Fields {!standardFormVisible && <span className="text-slate-500 font-normal">(add your own fields below)</span>}
            </h3>
            <p className="text-xs text-slate-500">
              {standardFormVisible
                ? "Optional key-value pairs (e.g. Warranty Type, Region). Editable."
                : "Add your custom field names and values. At least one field is required."}
            </p>
            {customFields.map((f, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={f.key}
                  onChange={(e) =>
                    setCustomFields((prev) => {
                      const next = [...prev];
                      next[i] = { ...next[i], key: e.target.value };
                      return next;
                    })
                  }
                  placeholder="Field name"
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="text"
                  value={f.value}
                  onChange={(e) =>
                    setCustomFields((prev) => {
                      const next = [...prev];
                      next[i] = { ...next[i], value: e.target.value };
                      return next;
                    })
                  }
                  placeholder="Value"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => setCustomFields((prev) => prev.filter((_, idx) => idx !== i))}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setCustomFields((prev) => [...prev, { key: "", value: "" }])}
              className="flex items-center gap-2 text-sm text-[#1A7FC1] hover:text-[#166EA8] font-medium"
            >
              <Plus className="w-4 h-4" />
              Add custom field
            </button>
          </div>

          {/* Batch & QR Codes + Assign to Dealer – always visible, same for every product */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Batch & QR Codes + Assign to Dealer</h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Batch Name *</label>
              <input
                type="text"
                value={form.batch_name}
                onChange={(e) => setForm((f) => ({ ...f, batch_name: e.target.value }))}
                placeholder="e.g., Batch-FEB-2026"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Number of QR Codes *</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={form.qr_count}
                onChange={(e) => {
                  const newCount = Math.max(1, parseInt(e.target.value) || 1);
                  qrCountRef.current = newCount;
                  setForm((f) => ({ ...f, qr_count: newCount }));
                }}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Code Prefix</label>
                <input
                  type="text"
                  value={form.code_prefix}
                  onChange={(e) => setForm((f) => ({ ...f, code_prefix: e.target.value }))}
                  placeholder="WR"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Serial Prefix</label>
                <input
                  type="text"
                  value={form.serial_prefix}
                  onChange={(e) => setForm((f) => ({ ...f, serial_prefix: e.target.value }))}
                  placeholder="e.g., SN (serial is system-generated)"
                  className={inputClass}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">Item code is generated by the system when the product is created (e.g. PREFIX-IT-YYMM-XXXXXX).</p>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Assign to Dealer</label>
              <select
                value={form.assigned_dealer_id}
                onChange={(e) => setForm((f) => ({ ...f, assigned_dealer_id: e.target.value }))}
                className={inputClass}
              >
                <option value="">No dealer (assign later)</option>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#1A7FC1] hover:bg-[#166EA8] text-white font-medium text-sm mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileDown className="w-5 h-5" />
                 Generate QR Codes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
