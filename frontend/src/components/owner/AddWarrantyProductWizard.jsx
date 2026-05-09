import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  Box,
  ShieldCheck,
  Package,
  ChevronRight,
} from "lucide-react";
import { Button } from "../ui/button";
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
import {
  yearsMonthsToDays,
  yearsMonthsToReadableLabel,
  WARRANTY_DAYS_MIN,
  WARRANTY_DAYS_MAX,
  WARRANTY_YEARS_MAX,
  WARRANTY_MONTHS_MAX,
} from "../../utils/warrantyUtils";

const STEPS = [
  { num: 1, label: "Product", icon: Box },
  { num: 2, label: "Warranty", icon: ShieldCheck },
  { num: 3, label: "Batch", icon: Package },
];

const WARRANTY_DURATIONS = [
  { days: 90, label: "3 Months" },
  { days: 180, label: "6 Months" },
  { days: 365, label: "1 Year" },
  { days: 730, label: "2 Years" },
  { days: 1095, label: "3 Years" },
  { days: "custom", label: "Custom" },
];

export function AddWarrantyProductWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dealers, setDealers] = useState([]);

  const [product, setProduct] = useState({
    product_name: "",
    model_number: "",
    sku_code: "",
    category: "",
    brand: "",
    description: "",
  });

  const [policy, setPolicy] = useState({
    policy_name: "",
    warranty_duration_days: 365,
    warranty_duration_label: "1 Year",
    warranty_is_custom: false,
    warranty_custom_years: "1",
    warranty_custom_months: "0",
    start_rule: "FROM_ACTIVATION",
    coverage_type: "BOTH",
    coverage_scope: "FULL_COVERAGE",
  });

  const [batch, setBatch] = useState({
    batch_name: "",
    serial_prefix: "",
    total_units: 10,
    code_prefix: "WR",
    assigned_dealer_id: "",
  });

  // Ref to track the latest total_units value to avoid React state timing issues
  const totalUnitsRef = useRef(10);

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
    fetchDealers();
  }, [fetchDealers]);

  useEffect(() => {
    const loadDefaultCategory = async () => {
      try {
        const res = await getWarrantySettings();
        const settings = res?.data ?? res;
        const defaultCat = typeof settings?.default_category === "string" ? settings.default_category.trim() : "";
        if (defaultCat) {
          setProduct((p) => ({ ...p, category: defaultCat }));
        }
      } catch { /* ignore */ }
    };
    loadDefaultCategory();
  }, []);

  const updatePolicyDuration = (days, label, isCustom = false) => {
    if (days === "custom") {
      setPolicy((p) => {
        const y = parseInt(p.warranty_custom_years, 10) || 1;
        const m = Math.min(WARRANTY_MONTHS_MAX, Math.max(0, parseInt(p.warranty_custom_months, 10) || 0));
        const totalDays = yearsMonthsToDays(y, m);
        return {
          ...p,
          warranty_is_custom: true,
          warranty_custom_years: p.warranty_custom_years || "1",
          warranty_custom_months: p.warranty_custom_months || "0",
          warranty_duration_days: Math.max(WARRANTY_DAYS_MIN, Math.min(WARRANTY_DAYS_MAX, totalDays)),
          warranty_duration_label: yearsMonthsToReadableLabel(y, m),
        };
      });
    } else {
      setPolicy((p) => ({
        ...p,
        warranty_is_custom: false,
        warranty_duration_days: days,
        warranty_duration_label: label,
      }));
    }
  };

  const handleCustomYearsMonthsChange = (field, value) => {
    setPolicy((p) => {
      const num = parseInt(value, 10);
      let y = parseInt(p.warranty_custom_years, 10) || 0;
      let m = parseInt(p.warranty_custom_months, 10) || 0;
      if (field === "years") {
        y = value === "" ? 0 : Math.min(WARRANTY_YEARS_MAX, Math.max(0, isNaN(num) ? 0 : num));
      } else {
        m = value === "" ? 0 : Math.min(WARRANTY_MONTHS_MAX, Math.max(0, isNaN(num) ? 0 : num));
      }
      const totalDays = yearsMonthsToDays(y, m);
      const days = Math.max(WARRANTY_DAYS_MIN, Math.min(WARRANTY_DAYS_MAX, totalDays || 365));
      return {
        ...p,
        warranty_custom_years: field === "years" ? (value === "" ? "" : String(y)) : p.warranty_custom_years,
        warranty_custom_months: field === "months" ? (value === "" ? "" : String(m)) : p.warranty_custom_months,
        warranty_duration_days: days,
        warranty_duration_label: yearsMonthsToReadableLabel(y, m),
      };
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!product.product_name?.trim()) {
        toast.error("Product name is required");
        return;
      }
    }
    if (step === 2) {
      // if (!policy.policy_name?.trim()) {
      //   toast.error("Policy name is required");
      //   return;
      // }
      if (policy.warranty_is_custom) {
        const y = parseInt(policy.warranty_custom_years, 10) || 0;
        const m = parseInt(policy.warranty_custom_months, 10) || 0;
        const totalDays = yearsMonthsToDays(y, m);
        if (totalDays < WARRANTY_DAYS_MIN || totalDays > WARRANTY_DAYS_MAX) {
          toast.error("Warranty period must be at least 1 month (e.g. 0 years 1 month)");
          return;
        }
      }
    }
    if (step === 3) {
      if (!batch.batch_name?.trim()) {
        toast.error("Batch name is required");
        return;
      }
      // Use ref value to ensure we have the latest total_units (avoids React state timing issues)
      const totalUnits = totalUnitsRef.current;
      if (totalUnits < 1) {
        toast.error("Total units must be at least 1");
        return;
      }
      handleCreate(totalUnits);
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleCreate = async (totalUnits) => {
    // Check coin balance (duration-based: 3mo=1, 6mo=2, 1yr=4 coins per code)
    try {
      const balanceCheck = await checkCoinBalanceForWarranty(
        policy.warranty_duration_days,
        totalUnits,
        policy.warranty_duration_label
      );
      if (!balanceCheck?.allowed) {
        toast.error(
          `Insufficient coins. You need ${balanceCheck.required ?? 0} coins to generate ${totalUnits} warranty codes. Current balance: ${balanceCheck.current ?? 0}.`
        );
        return;
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to check coin balance");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create product
      const productRes = await createProduct(product);
      const productId = productRes?.id;
      if (!productId) throw new Error("Failed to create product");

      // Step 2: Create policy
      const policyPayload = {
        product_master_id: productId,
        policy_name: (policy.policy_name || product.product_name || "Product").trim() + " Standard Warranty",
        warranty_duration_days: policy.warranty_duration_days,
        warranty_duration_label: policy.warranty_duration_label,
        start_rule: policy.start_rule,
        coverage_type: policy.coverage_type,
        coverage_scope: policy.coverage_scope,
        claim_approval_required: true,
      };
      const policyRes = await createPolicy(policyPayload);
      const policyId = policyRes?.id;
      if (!policyId) throw new Error("Failed to create policy");

      // Step 3: Create batch
      const batchPayload = {
        product_master_id: productId,
        warranty_policy_id: policyId,
        batch_name: batch.batch_name.trim(),
        serial_prefix: batch.serial_prefix || "",
        total_units: totalUnits,
        code_prefix: batch.code_prefix || "WR",
        assigned_dealer_id: batch.assigned_dealer_id || null,
      };
      const batchRes = await createBatch(batchPayload);
      const batchId = batchRes?.id;

      // Step 4: Generate warranty codes
      const codePayload = {
        product_name: product.product_name,
        product_id: product.sku_code || "",
        serial_no: batch.serial_prefix || "",
        warranty_code: batch.code_prefix || "WR",
        warranty_days: policy.warranty_duration_days,
        warranty_period_readable: policy.warranty_duration_label,
        serial_no_quantity: totalUnits,
        total_units: totalUnits,
        quantity: 1,
        type: "Product",
        other_type: "",
        vehicle_number: "",
        service_id: "",
        factory_item_number: product.sku_code || "",
        factory_service_number: "",
        warranty_registration_url: "",
        warranty_from: null,
        warranty_to: null,
        warranty_check: false,
        warranty_check_interval: 0,
        warranty_interval_dates: [],
        warranty_reminder_days: [0, 1, 2, 5, 10],
        terms_and_conditions: null,
        terms_and_conditions_link: "",
        is_active: true,
        print_type: "A4",
        batch_id: batchId || null,
        assigned_dealer_id: batch.assigned_dealer_id || null,
      };

      const codeRes = await generateWarrantyCodes(codePayload);
      const pdfData = codeRes?.data?.data;
      if (pdfData) {
        try {
          const link = document.createElement("a");
          link.href = `data:application/pdf;base64,${pdfData}`;
          link.download = `batch-${batch.batch_name.replace(/\s+/g, "-")}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch {
          /* PDF download optional */
        }
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`Product, warranty policy, and ${totalUnits} codes created successfully!`);
      navigate("/owner/warranty-batches");
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create warranty product");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]";

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <button
        onClick={() => (step > 1 ? handleBack() : navigate("/owner/product-master"))}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Add Warranty Product</h1>
        <p className="text-sm text-slate-500">Create product, warranty policy, and batch in one flow</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                  isActive ? "bg-[#1A7FC1] text-white" : isDone ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-5 h-5 mx-1 text-slate-300" />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {/* Step 1: Product */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Product Details</h2>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Product Name *</label>
              <input
                type="text"
                value={product.product_name}
                onChange={(e) => setProduct((p) => ({ ...p, product_name: e.target.value }))}
                placeholder="e.g., LED TV 55 inch"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Model Number</label>
                <input
                  type="text"
                  value={product.model_number}
                  onChange={(e) => setProduct((p) => ({ ...p, model_number: e.target.value }))}
                  placeholder="e.g., TV-55-A1"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">SKU Code</label>
                <input
                  type="text"
                  value={product.sku_code}
                  onChange={(e) => setProduct((p) => ({ ...p, sku_code: e.target.value }))}
                  placeholder="e.g., SKU-TV55"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                <input
                  type="text"
                  value={product.category}
                  onChange={(e) => setProduct((p) => ({ ...p, category: e.target.value }))}
                  placeholder="e.g., Electronics"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Brand</label>
                <input
                  type="text"
                  value={product.brand}
                  onChange={(e) => setProduct((p) => ({ ...p, brand: e.target.value }))}
                  placeholder="e.g., BrandX"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
              <input
                type="text"
                value={product.description}
                onChange={(e) => setProduct((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Step 2: Warranty Policy */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Warranty Policy</h2>
            {/*             {false && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Policy Name *</label>
              <input
                type="text"
                value={policy.policy_name}
                onChange={(e) => setPolicy((p) => ({ ...p, policy_name: e.target.value }))}
                placeholder={`e.g., ${product.product_name || "Product"} Standard Warranty`}
                className={inputClass}
              />
            </div>
            )} */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Warranty Duration</label>
              <div className="flex flex-wrap gap-2">
                {WARRANTY_DURATIONS.map((d) => (
                  <button
                    key={d.days}
                    type="button"
                    onClick={() => updatePolicyDuration(d.days, d.label, d.days === "custom")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      (d.days === "custom" && policy.warranty_is_custom) ||
                      (d.days !== "custom" && policy.warranty_duration_days === d.days)
                        ? "bg-[#1A7FC1] text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {policy.warranty_is_custom && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={WARRANTY_YEARS_MAX}
                      value={policy.warranty_custom_years}
                      onChange={(e) => handleCustomYearsMonthsChange("years", e.target.value)}
                      placeholder="Years"
                      className={`${inputClass} w-24`}
                    />
                    <span className="text-sm text-slate-600">Years</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={WARRANTY_MONTHS_MAX}
                      value={policy.warranty_custom_months}
                      onChange={(e) => handleCustomYearsMonthsChange("months", e.target.value)}
                      placeholder="Months"
                      className={`${inputClass} w-24`}
                    />
                    <span className="text-sm text-slate-600">Months</span>
                  </div>
                  <span className="text-sm text-slate-500">
                    = {policy.warranty_duration_label}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Coverage: {policy.coverage_type?.replace("_", " ")} • Start: {policy.start_rule?.replace(/_/g, " ")}
            </p>
          </div>
        )}

        {/* Step 3: Batch */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Generate Warranty Codes</h2>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Batch Name *</label>
              <input
                type="text"
                value={batch.batch_name}
                onChange={(e) => setBatch((b) => ({ ...b, batch_name: e.target.value }))}
                placeholder="e.g., Batch-FEB-2026"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Number of Codes *</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={batch.total_units}
                  onChange={(e) => {
                    const newCount = Math.max(1, parseInt(e.target.value) || 1);
                    totalUnitsRef.current = newCount;
                    setBatch((b) => ({ ...b, total_units: newCount }));
                  }}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Code Prefix</label>
                <input
                  type="text"
                  value={batch.code_prefix}
                  onChange={(e) => setBatch((b) => ({ ...b, code_prefix: e.target.value }))}
                  placeholder="WR"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Assign to Dealer (optional)</label>
              <select
                value={batch.assigned_dealer_id}
                onChange={(e) => setBatch((b) => ({ ...b, assigned_dealer_id: e.target.value }))}
                className={`${inputClass} bg-white`}
              >
                <option value="">No dealer (assign later)</option>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
              <p className="text-blue-900 text-sm">
                This will create <strong>{product.product_name || "product"}</strong>, add a{" "}
                <strong>{policy.warranty_duration_label}</strong> warranty policy, and generate{" "}
                <strong>{batch.total_units}</strong> warranty codes.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
          className="rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={loading}
          className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-lg"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
          ) : step === 3 ? (
            <><Check className="w-4 h-4 mr-2" /> Create & Generate</>
          ) : (
            <><span>Next</span> <ArrowRight className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
