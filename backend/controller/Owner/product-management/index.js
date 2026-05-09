import { StatusCodes } from "http-status-codes";
import { logger, returnError, returnResponse } from "../../../services/logger.js";
import {
  getProviderByUserId,
  generateItemCodeForProvider,
  createProduct, getProducts, getProductById, updateProduct, softDeleteProduct, getProductUsageStats,
  createPolicy, getPolicies, getPoliciesByProduct, getPolicyById, updatePolicy, softDeletePolicy,
  createBatch, getBatches, getBatchById, updateBatchStatus,
} from "./query.js";

const withProvider = (handler) => async (req, res) => {
  try {
    const provider = await getProviderByUserId(req.user_id);
    if (!provider) return returnError(res, StatusCodes.NOT_FOUND, "Provider not found");
    return await handler(req, res, provider.id);
  } catch (error) {
    logger.error(`Product management error: ${error.message}`);
    return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

// ─── Product Master ───────────────────────────────────────────

export const createProductEndpoint = withProvider(async (req, res, providerId) => {
  const { product_name, model_number, sku_code, category, brand, description } = req.body;
  if (!product_name) return returnError(res, StatusCodes.BAD_REQUEST, "Product name is required");

  const hasSku = sku_code != null && String(sku_code).trim() !== "";
  let finalSkuCode = hasSku ? String(sku_code).trim() : null;
  if (!finalSkuCode) {
    const generated = await generateItemCodeForProvider(providerId);
    finalSkuCode = generated || null;
  }

  const product = await createProduct({
    provider_id: providerId,
    product_name,
    model_number: model_number || null,
    sku_code: finalSkuCode,
    category: category || null,
    brand: brand || null,
    description: description || null,
  });
  return returnResponse(res, StatusCodes.CREATED, "Product created", product);
});

export const getProductsEndpoint = withProvider(async (req, res, providerId) => {
  const products = await getProducts(providerId);
  return returnResponse(res, StatusCodes.OK, "Products fetched", products);
});

export const getProductByIdEndpoint = withProvider(async (req, res, providerId) => {
  const product = await getProductById(req.params.id, providerId);
  if (!product) return returnError(res, StatusCodes.NOT_FOUND, "Product not found");
  return returnResponse(res, StatusCodes.OK, "Product fetched", product);
});

export const updateProductEndpoint = withProvider(async (req, res, providerId) => {
  const existing = await getProductById(req.params.id, providerId);
  if (!existing) return returnError(res, StatusCodes.NOT_FOUND, "Product not found");

  const { product_name, model_number, sku_code, category, brand, description, is_active } = req.body;
  const updated = await updateProduct(req.params.id, {
    ...(product_name !== undefined && { product_name }),
    ...(model_number !== undefined && { model_number }),
    ...(sku_code !== undefined && { sku_code }),
    ...(category !== undefined && { category }),
    ...(brand !== undefined && { brand }),
    ...(description !== undefined && { description }),
    ...(is_active !== undefined && { is_active }),
  });
  return returnResponse(res, StatusCodes.OK, "Product updated", updated);
});

export const getProductStatsEndpoint = withProvider(async (req, res, providerId) => {
  const product = await getProductById(req.params.id, providerId);
  if (!product) return returnError(res, StatusCodes.NOT_FOUND, "Product not found");

  const stats = await getProductUsageStats(req.params.id, providerId);
  return returnResponse(res, StatusCodes.OK, "Product stats fetched", {
    product: {
      id: product.id,
      product_name: product.product_name,
      is_active: product.is_active,
    },
    ...stats,
  });
});

export const deleteProductEndpoint = withProvider(async (req, res, providerId) => {
  const existing = await getProductById(req.params.id, providerId);
  if (!existing) return returnError(res, StatusCodes.NOT_FOUND, "Product not found");

  const stats = await getProductUsageStats(req.params.id, providerId);
  
  if (!stats.canDelete) {
    return returnError(res, StatusCodes.CONFLICT, "Cannot delete product with active warranties or registrations", {
      reason: "PRODUCT_IN_USE",
      stats: {
        activeWarrantyCodes: stats.activeWarrantyCodes,
        pendingWarrantyCodes: stats.pendingWarrantyCodes,
        customerRegistrations: stats.customerRegistrations,
        activeClaims: stats.activeClaims,
      },
    });
  }

  await softDeleteProduct(req.params.id);
  return returnResponse(res, StatusCodes.OK, "Product deleted");
});

// ─── Warranty Policies ────────────────────────────────────────

export const createPolicyEndpoint = withProvider(async (req, res, providerId) => {
  const {
    product_master_id, policy_name, warranty_duration_days, warranty_duration_label,
    start_rule, coverage_type, coverage_scope, claim_approval_required,
    escalation_days, max_claim_count, terms_and_conditions, terms_url, custom_fields,
  } = req.body;

  if (!product_master_id) return returnError(res, StatusCodes.BAD_REQUEST, "Product is required");
  if (!policy_name) return returnError(res, StatusCodes.BAD_REQUEST, "Policy name is required");
  if (!warranty_duration_days) return returnError(res, StatusCodes.BAD_REQUEST, "Warranty duration is required");

  const policy = await createPolicy({
    provider_id: providerId,
    product_master_id,
    policy_name,
    warranty_duration_days: parseInt(warranty_duration_days),
    warranty_duration_label: warranty_duration_label || `${warranty_duration_days} days`,
    start_rule: start_rule || "FROM_ACTIVATION",
    coverage_type: coverage_type || "BOTH",
    coverage_scope: coverage_scope || "FULL_COVERAGE",
    claim_approval_required: claim_approval_required !== false,
    escalation_days: escalation_days ? parseInt(escalation_days) : null,
    max_claim_count: max_claim_count ? parseInt(max_claim_count) : null,
    terms_and_conditions: terms_and_conditions || null,
    terms_url: terms_url || null,
    custom_fields: Array.isArray(custom_fields) ? custom_fields : null,
  });
  return returnResponse(res, StatusCodes.CREATED, "Warranty policy created", policy);
});

export const getPoliciesEndpoint = withProvider(async (req, res, providerId) => {
  const { product_id } = req.query;
  if (product_id) {
    const policies = await getPoliciesByProduct(providerId, product_id);
    return returnResponse(res, StatusCodes.OK, "Policies fetched", policies);
  }
  const policies = await getPolicies(providerId);
  return returnResponse(res, StatusCodes.OK, "Policies fetched", policies);
});

export const getPolicyByIdEndpoint = withProvider(async (req, res, providerId) => {
  const policy = await getPolicyById(req.params.id, providerId);
  if (!policy) return returnError(res, StatusCodes.NOT_FOUND, "Policy not found");
  return returnResponse(res, StatusCodes.OK, "Policy fetched", policy);
});

export const updatePolicyEndpoint = withProvider(async (req, res, providerId) => {
  const existing = await getPolicyById(req.params.id, providerId);
  if (!existing) return returnError(res, StatusCodes.NOT_FOUND, "Policy not found");

  const allowedFields = [
    "policy_name", "warranty_duration_days", "warranty_duration_label",
    "start_rule", "coverage_type", "coverage_scope", "claim_approval_required",
    "escalation_days", "max_claim_count", "terms_and_conditions", "terms_url", "is_active",
    "custom_fields",
  ];
  const updateData = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updateData[field] = req.body[field];
  }
  if (updateData.warranty_duration_days) updateData.warranty_duration_days = parseInt(updateData.warranty_duration_days);
  if (updateData.escalation_days) updateData.escalation_days = parseInt(updateData.escalation_days);
  if (updateData.max_claim_count) updateData.max_claim_count = parseInt(updateData.max_claim_count);

  const updated = await updatePolicy(req.params.id, updateData);
  return returnResponse(res, StatusCodes.OK, "Policy updated", updated);
});

export const deletePolicyEndpoint = withProvider(async (req, res, providerId) => {
  const existing = await getPolicyById(req.params.id, providerId);
  if (!existing) return returnError(res, StatusCodes.NOT_FOUND, "Policy not found");
  await softDeletePolicy(req.params.id);
  return returnResponse(res, StatusCodes.OK, "Policy deleted");
});

// ─── Warranty Batches ─────────────────────────────────────────

export const createBatchEndpoint = withProvider(async (req, res, providerId) => {
  const {
    product_master_id, warranty_policy_id, batch_name,
    serial_prefix, total_units, code_prefix, assigned_dealer_id,
  } = req.body;

  if (!product_master_id) return returnError(res, StatusCodes.BAD_REQUEST, "Product is required");
  if (!warranty_policy_id) return returnError(res, StatusCodes.BAD_REQUEST, "Warranty policy is required");
  if (!batch_name) return returnError(res, StatusCodes.BAD_REQUEST, "Batch name is required");
  if (!total_units || total_units < 1) return returnError(res, StatusCodes.BAD_REQUEST, "Total units must be at least 1");

  const product = await getProductById(product_master_id, providerId);
  if (!product) return returnError(res, StatusCodes.NOT_FOUND, "Product not found");
  if (product.is_active === false) {
    return returnError(res, StatusCodes.BAD_REQUEST, "Cannot create warranty codes for an inactive product. Please activate the product first.");
  }

  const policy = await getPolicyById(warranty_policy_id, providerId);
  if (!policy) return returnError(res, StatusCodes.NOT_FOUND, "Warranty policy not found");

  const policySnapshot = {
    policy_name: policy.policy_name,
    warranty_duration_days: policy.warranty_duration_days,
    warranty_duration_label: policy.warranty_duration_label,
    start_rule: policy.start_rule,
    coverage_type: policy.coverage_type,
    coverage_scope: policy.coverage_scope,
    claim_approval_required: policy.claim_approval_required,
    max_claim_count: policy.max_claim_count,
    terms_and_conditions: policy.terms_and_conditions,
    terms_url: policy.terms_url,
    custom_fields: policy.custom_fields || [],
  };

  const batch = await createBatch({
    provider_id: providerId,
    product_master_id,
    warranty_policy_id,
    batch_name,
    serial_prefix: serial_prefix || "",
    total_units: parseInt(total_units),
    code_prefix: code_prefix || "WR",
    assigned_dealer_id: assigned_dealer_id || null,
    policy_snapshot: policySnapshot,
  });

  return returnResponse(res, StatusCodes.CREATED, "Batch created", batch);
});

export const getBatchesEndpoint = withProvider(async (req, res, providerId) => {
  const batches = await getBatches(providerId);
  return returnResponse(res, StatusCodes.OK, "Batches fetched", batches);
});

export const getBatchByIdEndpoint = withProvider(async (req, res, providerId) => {
  const batch = await getBatchById(req.params.id, providerId);
  if (!batch) return returnError(res, StatusCodes.NOT_FOUND, "Batch not found");
  return returnResponse(res, StatusCodes.OK, "Batch fetched", batch);
});
