import { useState, useEffect } from "react";
import { Check, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";

const CERTIFICATE_TEMPLATES = [
  { id: "classic-landscape", name: "Classic Landscape", description: "Traditional two-column layout, ideal for desktop viewing" },
  { id: "classic-portrait", name: "Classic Portrait", description: "Vertical format, print-optimized" },
  { id: "minimal-clean", name: "Minimal Clean", description: "Simple single-column, focused content" },
  { id: "modern-card", name: "Modern Card Layout", description: "Clean card-style with modern typography" },
  { id: "gradient-header", name: "Gradient Header", description: "Bold gradient header with professional look" },
  { id: "premium-gold-seal", name: "Premium Gold Seal", description: "Elegant design with validity badge" },
  { id: "watermark-corporate", name: "Watermark Corporate", description: "Corporate branding with subtle watermark" },
  { id: "dark-mode", name: "Dark Mode Certificate", description: "Dark theme for digital display" },
  { id: "compact-print", name: "Compact Print Friendly", description: "Space-efficient for paper saving" },
  { id: "automotive", name: "Automotive Industry Style", description: "Tailored for auto parts and vehicles" },
];

// Map legacy backend values to first template in family
const LEGACY_TO_UI = {
  classic: "classic-landscape",
  modern: "modern-card",
  minimal: "minimal-clean",
  premium: "premium-gold-seal",
};

function toUiValue(value) {
  if (!value) return "classic-landscape";
  const v = value.toString().toLowerCase().trim();
  return LEGACY_TO_UI[v] || (CERTIFICATE_TEMPLATES.some((t) => t.id === v) ? v : "classic-landscape");
}

function TemplateCardSkeleton() {
  return (
    <div className="flex flex-col p-3 rounded-xl border-2 border-slate-200 bg-white">
      <Skeleton className="w-full aspect-[1.4] rounded-lg mb-2" />
      <Skeleton className="h-3 w-3/4 rounded mb-1.5" />
      <Skeleton className="h-2.5 w-full rounded" />
    </div>
  );
}

function CertificateThumbnail({ templateId }) {
  const config = {
    "classic-landscape": { aspect: "aspect-[1.4]", header: "bg-gradient-to-r from-[#1A7FC1] to-[#1565A8] text-white shadow-sm", body: "grid grid-cols-2 gap-0.5 p-1", cards: true },
    "classic-portrait": { aspect: "aspect-[0.75]", header: "bg-slate-800 text-white", body: "p-1 space-y-0.5", cards: false },
    "minimal-clean": { aspect: "aspect-[1.4]", header: "bg-white border-b border-slate-200 text-slate-700 font-medium", body: "p-2 space-y-1", cards: false },
    "modern-card": { aspect: "aspect-[1.4]", header: "bg-gradient-to-br from-[#1A7FC1] to-[#0D5A8A] text-white rounded-t-lg shadow-md", body: "p-1 space-y-0.5", cards: true },
    "gradient-header": { aspect: "aspect-[1.4]", header: "bg-gradient-to-r from-[#1A7FC1] via-[#0F7AB8] to-[#0B5F91] text-white", body: "p-1 space-y-0.5", cards: false },
    "premium-gold-seal": { aspect: "aspect-[1.4]", header: "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-b-2 border-amber-400", body: "p-1 relative", cards: false },
    "watermark-corporate": { aspect: "aspect-[1.4]", header: "bg-slate-700 text-white", body: "p-1 bg-slate-50/80 space-y-0.5", cards: false },
    "dark-mode": { aspect: "aspect-[1.4]", header: "bg-slate-900 text-slate-100", body: "p-1 bg-slate-800 space-y-0.5", cards: false },
    "compact-print": { aspect: "aspect-[1.4]", header: "bg-[#1A7FC1] text-white text-[7px]", body: "p-0.5 space-y-0.5", cards: false },
    "automotive": { aspect: "aspect-[1.4]", header: "bg-slate-900 text-amber-400 font-bold border-b-2 border-amber-500", body: "p-1 bg-slate-100 space-y-0.5", cards: false },
  };
  const c = config[templateId] || config["classic-landscape"];
  const isPremium = templateId === "premium-gold-seal";

  return (
    <div className={`w-full ${c.aspect} rounded-lg overflow-hidden border border-slate-200/80 shadow-md text-[8px] leading-tight bg-white`}>
      <div className={`h-5 flex items-center justify-center font-bold ${c.header}`}>
        {isPremium && <span className="text-amber-200 mr-0.5">◆</span>}
        WARRANTY
      </div>
      <div className={`${c.body} min-h-[2rem]`}>
        {c.cards ? (
          <>
            <div className="h-2 bg-slate-100 rounded shadow-sm" />
            <div className="h-2 bg-slate-100 rounded shadow-sm" />
            <div className="h-2 bg-slate-100 rounded shadow-sm col-span-2" />
          </>
        ) : (
          <>
            <div className="h-1.5 bg-slate-100 rounded" />
            <div className="h-1 bg-slate-50 rounded w-4/5" />
            <div className="h-1 bg-slate-50 rounded w-3/5" />
            {templateId !== "compact-print" && <div className="h-1 bg-slate-50 rounded w-2/3" />}
          </>
        )}
      </div>
    </div>
  );
}

function CertificatePreviewLarge({ templateId }) {
  const isLandscape = templateId === "classic-landscape";
  const isDark = templateId === "dark-mode";
  const isGradient = templateId === "gradient-header";
  const isPremium = templateId === "premium-gold-seal";
  const isModernCard = templateId === "modern-card";
  const isWatermark = templateId === "watermark-corporate";
  const isAutomotive = templateId === "automotive";
  const isCompact = templateId === "compact-print";
  const isReferenceStyle = templateId === "classic-portrait" || isPremium;

  const borderClass = isPremium || isReferenceStyle
    ? "border-2 border-amber-400"
    : isAutomotive
    ? "border-2 border-amber-500"
    : isDark
    ? "border-slate-600"
    : "border-slate-200";

  const hasCornerAccents = isReferenceStyle || isPremium;
  const hasBlueCorners = isGradient || isModernCard;

  const headerStyle = isGradient
    ? "bg-gradient-to-r from-[#1A7FC1] via-[#0F7AB8] to-[#0B5F91] text-white shadow-lg"
    : isPremium
    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
    : isDark
    ? "bg-slate-800 text-slate-100"
    : isModernCard
    ? "bg-gradient-to-br from-[#1A7FC1] to-[#0D5A8A] text-white shadow-md"
    : isAutomotive
    ? "bg-slate-900 text-amber-400 font-bold border-b-2 border-amber-500"
    : "bg-slate-50 border-b border-slate-200 text-slate-800";

  const cardStyle = isDark
    ? "bg-slate-800/90 border-slate-600 shadow-lg rounded-xl"
    : isModernCard
    ? "bg-white/95 border-slate-200 shadow-md rounded-xl"
    : "bg-white border-slate-200 shadow-sm rounded-lg";

  const bodyBg = isDark ? "bg-slate-900" : isWatermark ? "bg-slate-50/95" : "bg-white";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div
      className={`relative w-full max-w-[210mm] mx-auto rounded-2xl shadow-2xl overflow-visible ${borderClass} ${
        isDark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"
      }`}
      style={{ aspectRatio: isLandscape ? "297/210" : "210/297" }}
    >
      {/* Decorative corner accents - amber (reference-style) */}
      {hasCornerAccents && (
        <>
          <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-tr-2xl pointer-events-none">
            <div className="absolute -right-10 -top-10 w-28 h-28 bg-gradient-to-br from-amber-400 to-amber-600 rotate-45" />
            <div className="absolute -right-6 -top-6 w-20 h-20 border-2 border-amber-500/50 rotate-45" />
          </div>
          <div className="absolute bottom-0 left-0 w-20 h-20 overflow-hidden rounded-bl-2xl pointer-events-none">
            <div className="absolute -left-10 -bottom-10 w-28 h-28 bg-gradient-to-tr from-amber-400 to-amber-600 rotate-45" />
            <div className="absolute -left-6 -bottom-6 w-20 h-20 border-2 border-amber-500/50 rotate-45" />
          </div>
        </>
      )}
      {/* Decorative corner accents - blue */}
      {hasBlueCorners && (
        <>
          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-2xl pointer-events-none">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-[#1A7FC1] to-[#0D5A8A] rotate-45 opacity-90" />
          </div>
          <div className="absolute bottom-0 left-0 w-16 h-16 overflow-hidden rounded-bl-2xl pointer-events-none">
            <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-gradient-to-tr from-[#1A7FC1] to-[#0D5A8A] rotate-45 opacity-90" />
          </div>
        </>
      )}

      {isPremium && <div className="h-1 bg-amber-400" />}
      <div className={`relative ${headerStyle} px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xs font-bold shadow-inner">LOGO</div>
          <div>
            <p className="text-xs opacity-90">E-Warrantify</p>
            <p className="font-semibold text-sm">Your Company Name</p>
          </div>
        </div>
        {isPremium && (
          <div className="px-3 py-1.5 rounded-full bg-amber-400/20 border-2 border-amber-400/60 text-amber-200 text-xs font-semibold shadow-sm">
            ✓ Valid Warranty
          </div>
        )}
      </div>
      <div className={`relative px-6 py-5 text-center border-b border-slate-200/50 ${bodyBg}`}>
        <h1 className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
          Warranty Certificate
        </h1>
        <p className={`text-sm mt-1 ${textMuted}`}>This certificate is presented to</p>
        <p className="text-lg font-bold text-slate-900 mt-1">John Doe</p>
        <p className={`text-xs mt-2 ${textMuted}`}>Certificate No. WRR-2024-001234</p>
      </div>
      <div className={`relative px-6 py-5 space-y-4 ${bodyBg}`}>
        <div className={`rounded-xl border p-4 ${cardStyle}`}>
          <h3 className={`text-xs font-semibold uppercase tracking-wider ${textMuted} mb-2`}>Product Information</h3>
          <div className={`grid gap-2 text-sm ${isCompact ? "grid-cols-3" : "grid-cols-2"}`}>
            <p><span className={textMuted}>Product:</span> Sample Product XYZ</p>
            <p><span className={textMuted}>Serial No:</span> SN-2024-001234</p>
            <p className={isCompact ? "col-span-3" : ""}><span className={textMuted}>Warranty Code:</span> WRR-PREVIEW-001</p>
          </div>
        </div>
        <div className={`rounded-xl border p-4 ${cardStyle}`}>
          <h3 className={`text-xs font-semibold uppercase tracking-wider ${textMuted} mb-2`}>Warranty Details</h3>
          <p className="text-sm">Valid from 01/03/2024 to 01/03/2025 · 1 Year Standard Warranty</p>
        </div>
        <div className={`rounded-xl border p-4 ${cardStyle}`}>
          <h3 className={`text-xs font-semibold uppercase tracking-wider ${textMuted} mb-2`}>Owner Information</h3>
          <p className="text-sm">John Doe · +91 98765 43210</p>
        </div>
        <div className="flex justify-center pt-4">
          <div className="text-center">
            <div className={`mx-auto mb-1 w-32 h-0.5 ${isAutomotive ? "bg-amber-600" : "bg-slate-400"}`} />
            <p className={`text-xs ${textMuted}`}>Signature</p>
            <p className="text-sm font-medium mt-2 underline">Authorized Representative</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CertificateTemplateSelector({ value, onChange }) {
  const selected = toUiValue(value);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const handleSelect = (id) => onChange(id);

  const handleSaveSelection = () => {
    onChange(selected);
    toast.success("Selection saved. Click 'Update Settings' below to persist.");
  };

  const selectedTemplate = CERTIFICATE_TEMPLATES.find((t) => t.id === selected);

  return (
    <div className="w-full">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Certificate Design</h2>
        <p className="text-sm text-slate-500 mt-0.5">Choose the layout for warranty certificate PDFs.</p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Left: Full preview - grows to fit full certificate */}
        <div className="flex-1 min-w-0 flex flex-col order-2 lg:order-1">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-3 flex-shrink-0">
            Full preview {selectedTemplate && `— ${selectedTemplate.name}`}
          </p>
          <p className="text-[10px] text-slate-400 mb-2">Click a template on the right to view it here.</p>
          <div className="p-4 lg:p-5 bg-slate-50/80 rounded-xl border border-slate-200">
            {isLoading ? (
              <div className="w-full max-w-[210mm] space-y-4">
                <Skeleton className="w-full h-16 rounded-xl" />
                <Skeleton className="w-full h-24 rounded-xl mx-auto max-w-md" />
                <Skeleton className="w-full h-32 rounded-xl" />
                <Skeleton className="w-full h-24 rounded-xl" />
              </div>
            ) : (
              <div className="flex justify-center">
                <CertificatePreviewLarge templateId={selected} />
              </div>
            )}
          </div>
        </div>

        {/* Right: Template grid */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 flex flex-col order-1 lg:order-2">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-3 flex-shrink-0">Templates</p>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 flex-1 content-start">
              {Array.from({ length: 8 }).map((_, i) => (
                <TemplateCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto overflow-x-hidden pr-2">
              <div className="grid grid-cols-2 gap-3 auto-rows-min pb-2">
                {CERTIFICATE_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelect(t.id)}
                    className={`relative flex flex-col p-2.5 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md hover:border-slate-300 flex-shrink-0 min-h-[120px] ${
                      selected === t.id
                        ? "border-[#1A7FC1] bg-[#1A7FC1]/5 shadow-md ring-2 ring-[#1A7FC1]/25"
                        : "border-slate-200 bg-white hover:bg-slate-50/50"
                    }`}
                  >
                    {selected === t.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1A7FC1] flex items-center justify-center z-10">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                    <div className="mb-2 flex-shrink-0">
                      <CertificateThumbnail templateId={t.id} />
                    </div>
                    <span className="font-medium text-slate-900 text-xs block truncate">{t.name}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 break-words">{t.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-slate-200 flex-shrink-0">
            <Button
              type="button"
              onClick={handleSaveSelection}
              disabled={isLoading}
              className="w-full h-10 bg-[#1A7FC1] hover:bg-[#166EA8] text-white text-sm font-medium"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Selection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { CERTIFICATE_TEMPLATES, toUiValue };
