import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Box, ShieldCheck, Package, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { getProducts, getPolicies, getBatches } from "../../services/productManagementService";
import { OwnerProductMaster } from "./OwnerProductMaster";
import { WarrantyPolicies } from "./WarrantyPolicies";
import { WarrantyBatches } from "./WarrantyBatches";
import { toast } from "sonner";

const SECTIONS = [
  { id: "products", label: "Products", icon: Box, color: "blue", description: "Define your product catalog" },
  { id: "policies", label: "Warranty Policies", icon: ShieldCheck, color: "amber", description: "Define warranty terms per product" },
  { id: "batches", label: "Warranty Batches", icon: Package, color: "green", description: "Generate and manage warranty batches" },
];

export function WarrantyManagement() {
  const [expandedSection, setExpandedSection] = useState("products");
  const sectionRefs = { products: useRef(null), policies: useRef(null), batches: useRef(null) };
  const [summary, setSummary] = useState({
    products: 0,
    policies: 0,
    batches: 0,
    totalCodes: 0,
  });
  const [loadingSummary, setLoadingSummary] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      const [products, policies, batches] = await Promise.all([
        getProducts(),
        getPolicies(),
        getBatches(),
      ]);
      const prods = Array.isArray(products) ? products : [];
      const pols = Array.isArray(policies) ? policies : [];
      const bats = Array.isArray(batches) ? batches : [];
      const totalCodes = bats.reduce((s, b) => s + (b._count?.codes || 0), 0);
      setSummary({
        products: prods.length,
        policies: pols.length,
        batches: bats.length,
        totalCodes,
      });
    } catch {
      toast.error("Failed to load summary");
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const focusSection = (id) => {
    setExpandedSection(id);
    setTimeout(() => {
      sectionRefs[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const cardColors = {
    products: { bg: "bg-blue-50", icon: "text-[#1A7FC1]", border: "border-blue-100", hover: "hover:border-[#1A7FC1]/50 hover:bg-blue-50/80" },
    policies: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-100", hover: "hover:border-amber-400/50 hover:bg-amber-50/80" },
    batches: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-100", hover: "hover:border-green-400/50 hover:bg-green-50/80" },
    codes: { bg: "bg-slate-100", icon: "text-slate-600", border: "border-slate-200", hover: "" },
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">
          Warranty Management
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage products, policies, and batches in one place
        </p>
      </div>

      {/* Visual flow stepper */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500 font-medium">Workflow:</span>
        {SECTIONS.map((s, i) => (
          <span key={s.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => focusSection(s.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                expandedSection === s.id ? "bg-[#1A7FC1] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
            {i < SECTIONS.length - 1 && <ArrowRight className="w-4 h-4 text-slate-300" />}
          </span>
        ))}
      </div>

      {/* Summary cards - clickable */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => focusSection("products")}
          className={`text-left bg-white rounded-xl border-2 p-4 flex items-center gap-4 transition-all ${cardColors.products.border} ${cardColors.products.hover} ${
            expandedSection === "products" ? "ring-2 ring-[#1A7FC1]/30 border-[#1A7FC1]" : "border-slate-200"
          }`}
        >
          {loadingSummary ? (
            <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
          ) : (
            <div className={`w-10 h-10 rounded-lg ${cardColors.products.bg} flex items-center justify-center`}>
              <Box className={`w-5 h-5 ${cardColors.products.icon}`} />
            </div>
          )}
          <div>
            <p className="text-2xl font-bold text-slate-800">{summary.products}</p>
            <p className="text-xs text-slate-500">Products</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => focusSection("policies")}
          className={`text-left bg-white rounded-xl border-2 p-4 flex items-center gap-4 transition-all ${cardColors.policies.border} ${cardColors.policies.hover} ${
            expandedSection === "policies" ? "ring-2 ring-amber-400/30 border-amber-400" : "border-slate-200"
          }`}
        >
          {loadingSummary ? (
            <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
          ) : (
            <div className={`w-10 h-10 rounded-lg ${cardColors.policies.bg} flex items-center justify-center`}>
              <ShieldCheck className={`w-5 h-5 ${cardColors.policies.icon}`} />
            </div>
          )}
          <div>
            <p className="text-2xl font-bold text-slate-800">{summary.policies}</p>
            <p className="text-xs text-slate-500">Policies</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => focusSection("batches")}
          className={`text-left bg-white rounded-xl border-2 p-4 flex items-center gap-4 transition-all ${cardColors.batches.border} ${cardColors.batches.hover} ${
            expandedSection === "batches" ? "ring-2 ring-green-400/30 border-green-400" : "border-slate-200"
          }`}
        >
          {loadingSummary ? (
            <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
          ) : (
            <div className={`w-10 h-10 rounded-lg ${cardColors.batches.bg} flex items-center justify-center`}>
              <Package className={`w-5 h-5 ${cardColors.batches.icon}`} />
            </div>
          )}
          <div>
            <p className="text-2xl font-bold text-slate-800">{summary.batches}</p>
            <p className="text-xs text-slate-500">Batches</p>
          </div>
        </button>
        <div className="bg-white rounded-xl border-2 border-slate-200 p-4 flex items-center gap-4 cursor-default">
          {loadingSummary ? (
            <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
          ) : (
            <div className={`w-10 h-10 rounded-lg ${cardColors.codes.bg} flex items-center justify-center`}>
              <Package className={`w-5 h-5 ${cardColors.codes.icon}`} />
            </div>
          )}
          <div>
            <p className="text-2xl font-bold text-slate-800">{summary.totalCodes}</p>
            <p className="text-xs text-slate-500">Total Codes</p>
          </div>
        </div>
      </div>

      {/* Accordion sections */}
      {SECTIONS.map((s, idx) => {
        const Icon = s.icon;
        const isExpanded = expandedSection === s.id;
        return (
          <section
            key={s.id}
            ref={sectionRefs[s.id]}
            className={`bg-white rounded-xl border overflow-hidden transition-all ${
              isExpanded ? "border-slate-200 shadow-sm" : "border-slate-200"
            }`}
          >
            <button
              type="button"
              onClick={() => setExpandedSection(isExpanded ? null : s.id)}
              className={`w-full px-4 py-4 flex items-center justify-between gap-4 text-left transition-colors ${
                isExpanded ? "bg-slate-50 border-b border-slate-200" : "bg-white hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  s.color === "blue" ? "bg-blue-50" : s.color === "amber" ? "bg-amber-50" : "bg-green-50"
                }`}>
                  <Icon className={`w-5 h-5 ${
                    s.color === "blue" ? "text-[#1A7FC1]" : s.color === "amber" ? "text-amber-600" : "text-green-600"
                  }`} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-800">
                    {idx + 1}. {s.label}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </button>
            {isExpanded && (
              <div className="p-4 bg-slate-50/30">
                {s.id === "products" && <OwnerProductMaster embedded compactTable onDataChange={fetchSummary} />}
                {s.id === "policies" && <WarrantyPolicies embedded compactTable onDataChange={fetchSummary} />}
                {s.id === "batches" && <WarrantyBatches embedded compactTable onDataChange={fetchSummary} />}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
