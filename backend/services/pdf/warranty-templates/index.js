import { renderClassicCertificate } from "./classic-certificate.js";
import { renderModernCertificate } from "./modern-certificate.js";
import { renderMinimalCertificate } from "./minimal-certificate.js";
import { renderPremiumCertificate } from "./premium-certificate.js";
import { renderDarkModeCertificate } from "./dark-mode-certificate.js";
import { renderClassicPortraitCertificate } from "./classic-portrait-certificate.js";
import { renderGradientHeaderCertificate } from "./gradient-header-certificate.js";
import { renderWatermarkCorporateCertificate } from "./watermark-corporate-certificate.js";
import { renderCompactPrintCertificate } from "./compact-print-certificate.js";
import { renderAutomotiveCertificate } from "./automotive-certificate.js";
import { fetchImage } from "./utils.js";

// Each of the 10 UI templates maps to its own renderer – no collapsing
const TEMPLATES = {
    "classic": renderClassicCertificate,
    "classic-landscape": renderClassicCertificate,
    "classic-portrait": renderClassicPortraitCertificate,
    "minimal": renderMinimalCertificate,
    "minimal-clean": renderMinimalCertificate,
    "modern": renderModernCertificate,
    "modern-card": renderModernCertificate,
    "gradient-header": renderGradientHeaderCertificate,
    "premium": renderPremiumCertificate,
    "premium-gold-seal": renderPremiumCertificate,
    "watermark-corporate": renderWatermarkCorporateCertificate,
    "dark-mode": renderDarkModeCertificate,
    "compact-print": renderCompactPrintCertificate,
    "automotive": renderAutomotiveCertificate,
};

// Map all known IDs (with variants) to the exact template key used in TEMPLATES
const TEMPLATE_MAP = {
    "classic": "classic", "classic-landscape": "classic-landscape", "classic_portrait": "classic-portrait",
    "classic_landscape": "classic-landscape", "classicportrait": "classic-portrait", "classiclandscape": "classic-landscape",
    "minimal": "minimal", "minimal-clean": "minimal-clean", "minimal_clean": "minimal-clean", "minimalclean": "minimal-clean",
    "compact-print": "compact-print", "compact_print": "compact-print", "compactprint": "compact-print",
    "modern": "modern", "modern-card": "modern-card", "modern_card": "modern-card", "moderncard": "modern-card",
    "gradient-header": "gradient-header", "gradient_header": "gradient-header", "gradientheader": "gradient-header",
    "automotive": "automotive",
    "premium": "premium", "premium-gold-seal": "premium-gold-seal", "premium_gold_seal": "premium-gold-seal", "premiumgoldseal": "premium-gold-seal",
    "watermark-corporate": "watermark-corporate", "watermark_corporate": "watermark-corporate", "watermarkcorporate": "watermark-corporate",
    "dark-mode": "dark-mode", "dark_mode": "dark-mode", "darkmode": "dark-mode",
};

function resolveTemplateId(id) {
    if (id == null || id === "") return "classic-landscape";
    const normalized = String(id).toLowerCase().trim().replace(/\s+/g, "-");
    if (TEMPLATE_MAP[normalized]) return TEMPLATE_MAP[normalized];
    if (TEMPLATES[normalized]) return normalized;
    if (normalized.includes("dark")) return "dark-mode";
    if (normalized.includes("portrait")) return "classic-portrait";
    if (normalized.includes("gradient")) return "gradient-header";
    if (normalized.includes("watermark")) return "watermark-corporate";
    if (normalized.includes("compact")) return "compact-print";
    if (normalized.includes("automotive")) return "automotive";
    if (normalized.includes("minimal") || normalized.includes("compact")) return "minimal-clean";
    if (normalized.includes("modern")) return "modern-card";
    if (normalized.includes("premium")) return "premium-gold-seal";
    return "classic-landscape";
}

export async function renderWarrantyCertificate(templateId, data) {
    const resolved = resolveTemplateId(templateId);
    const template = TEMPLATES[resolved] || TEMPLATES["classic-landscape"];
    return template(data);
}

export async function attachCompanyLogo(data) {
    data.companyLogoBuffer = (data.companyLogoUrl && typeof data.companyLogoUrl === "string")
        ? await fetchImage(data.companyLogoUrl)
        : null;
    data.signatureBuffer = (data.signatureImageUrl && typeof data.signatureImageUrl === "string")
        ? await fetchImage(data.signatureImageUrl)
        : null;
    data.qrCodeBuffer = (data.qrCodeImageUrl && typeof data.qrCodeImageUrl === "string")
        ? await fetchImage(data.qrCodeImageUrl)
        : null;
    return data;
}

export { fetchImage, resolveTemplateId };
export const TEMPLATE_IDS = ["classic-landscape", "classic-portrait", "minimal-clean", "modern-card", "gradient-header", "premium-gold-seal", "watermark-corporate", "dark-mode", "compact-print", "automotive"];
