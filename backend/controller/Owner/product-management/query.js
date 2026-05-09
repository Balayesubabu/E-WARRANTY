import { ProductMaster, WarrantyPolicy, WarrantyBatch, ProviderProductWarrantyCode, ProviderWarrantyCustomer, WarrantyClaim, Provider } from "../../../prisma/db-models.js";
import { generatePrefixFromCompanyName } from "../../../services/generate-invoice-no.js";
import { generateNanoId } from "../../../services/generate-nano-id.js";

const getProviderByUserId = async (user_id) => {
  return Provider.findFirst({ where: { user_id } });
};

/**
 * Generate a unique item code (sku_code) for a new product, real-world style: PREFIX-IT-YYMM-NNNNNN
 */
const generateItemCodeForProvider = async (provider_id) => {
  const provider = await Provider.findFirst({
    where: { id: provider_id },
    select: { company_name: true, invoice_prefix: true },
  });
  if (!provider) return null;
  const prefix = (provider.invoice_prefix && provider.invoice_prefix.trim()) || generatePrefixFromCompanyName(provider.company_name || "PRD");
  const yearMonth = (new Date().getMonth() + 1).toString().padStart(2, "0") + new Date().getFullYear().toString().slice(-2);
  const suffix = generateNanoId("Numeric", 6);
  return `${prefix}-IT-${yearMonth}-${suffix}`;
};

// ─── Product Master ───────────────────────────────────────────

const createProduct = async (data) => {
  return ProductMaster.create({ data });
};

const getProducts = async (provider_id) => {
  return ProductMaster.findMany({
    where: { provider_id, is_deleted: false },
    orderBy: { created_at: "desc" },
    include: {
      warranty_policies: {
        where: { is_deleted: false },
        select: { id: true, policy_name: true, warranty_duration_label: true },
      },
      _count: {
        select: { warranty_batches: true },
      },
    },
  });
};

const getProductById = async (id, provider_id) => {
  return ProductMaster.findFirst({
    where: { id, provider_id, is_deleted: false },
    include: {
      warranty_policies: { where: { is_deleted: false } },
      warranty_batches: { orderBy: { created_at: "desc" }, take: 10 },
    },
  });
};

const updateProduct = async (id, data) => {
  return ProductMaster.update({ where: { id }, data });
};

const softDeleteProduct = async (id) => {
  return ProductMaster.update({
    where: { id },
    data: { is_deleted: true, deleted_at: new Date() },
  });
};

const getProductUsageStats = async (productId, providerId) => {
  const batches = await WarrantyBatch.findMany({
    where: { product_master_id: productId, provider_id: providerId },
    select: { id: true },
  });

  const batchIds = batches.map((b) => b.id);

  if (batchIds.length === 0) {
    return {
      totalWarrantyCodes: 0,
      activeWarrantyCodes: 0,
      pendingWarrantyCodes: 0,
      customerRegistrations: 0,
      activeClaims: 0,
      canDelete: true,
    };
  }

  const warrantyCodes = await ProviderProductWarrantyCode.findMany({
    where: { batch_id: { in: batchIds } },
    select: { id: true, warranty_code_status: true },
  });

  const codeIds = warrantyCodes.map((c) => c.id);
  const totalWarrantyCodes = warrantyCodes.length;
  const activeWarrantyCodes = warrantyCodes.filter((c) => c.warranty_code_status === "Active").length;
  const pendingWarrantyCodes = warrantyCodes.filter((c) => c.warranty_code_status === "Pending").length;

  let customerRegistrations = 0;
  let activeClaims = 0;

  if (codeIds.length > 0) {
    customerRegistrations = await ProviderWarrantyCustomer.count({
      where: { provider_warranty_code_id: { in: codeIds } },
    });

    activeClaims = await WarrantyClaim.count({
      where: {
        warranty_code_id: { in: codeIds },
        status: { notIn: ["Closed", "Rejected"] },
      },
    });
  }

  const canDelete = activeWarrantyCodes === 0 && pendingWarrantyCodes === 0 && customerRegistrations === 0 && activeClaims === 0;

  return {
    totalWarrantyCodes,
    activeWarrantyCodes,
    pendingWarrantyCodes,
    customerRegistrations,
    activeClaims,
    canDelete,
  };
};

// ─── Warranty Policies ────────────────────────────────────────

const createPolicy = async (data) => {
  return WarrantyPolicy.create({ data });
};

const getPolicies = async (provider_id) => {
  return WarrantyPolicy.findMany({
    where: { provider_id, is_deleted: false },
    orderBy: { created_at: "desc" },
    include: {
      product: { select: { id: true, product_name: true, model_number: true } },
      _count: { select: { warranty_batches: true } },
    },
  });
};

const getPoliciesByProduct = async (provider_id, product_master_id) => {
  return WarrantyPolicy.findMany({
    where: { provider_id, product_master_id, is_deleted: false, is_active: true },
    orderBy: { created_at: "desc" },
  });
};

const getPolicyById = async (id, provider_id) => {
  return WarrantyPolicy.findFirst({
    where: { id, provider_id, is_deleted: false },
    include: { product: true },
  });
};

const updatePolicy = async (id, data) => {
  return WarrantyPolicy.update({ where: { id }, data });
};

const softDeletePolicy = async (id) => {
  return WarrantyPolicy.update({
    where: { id },
    data: { is_deleted: true, deleted_at: new Date() },
  });
};

// ─── Warranty Batches ─────────────────────────────────────────

const createBatch = async (data) => {
  return WarrantyBatch.create({ data });
};

const getBatches = async (provider_id) => {
  return WarrantyBatch.findMany({
    where: { provider_id },
    orderBy: { created_at: "desc" },
    include: {
      product: { select: { id: true, product_name: true, model_number: true } },
      policy: { select: { id: true, policy_name: true, warranty_duration_label: true, coverage_type: true } },
      assigned_dealer: { select: { id: true, name: true } },
      _count: { select: { codes: true } },
    },
  });
};

const getBatchById = async (id, provider_id) => {
  return WarrantyBatch.findFirst({
    where: { id, provider_id },
    include: {
      product: true,
      policy: true,
      assigned_dealer: { select: { id: true, name: true } },
      codes: { take: 50, orderBy: { created_at: "desc" } },
    },
  });
};

const updateBatchStatus = async (id, status) => {
  return WarrantyBatch.update({ where: { id }, data: { status } });
};

export {
  getProviderByUserId,
  generateItemCodeForProvider,
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  softDeleteProduct,
  getProductUsageStats,
  createPolicy,
  getPolicies,
  getPoliciesByProduct,
  getPolicyById,
  updatePolicy,
  softDeletePolicy,
  createBatch,
  getBatches,
  getBatchById,
  updateBatchStatus,
};
