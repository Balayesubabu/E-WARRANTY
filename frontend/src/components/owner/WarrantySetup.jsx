/**
 * WarrantySetup - Add Product / Generate Warranty QR Codes
 * Uses the new GenerateWarrantyQRCodes component (two-column form + templates).
 * Legacy accordion implementation is preserved below (commented) for reference.
 */

import GenerateWarrantyQRCodes from './GenerateWarrantyQRCodes';

export function WarrantySetup() {
  return <GenerateWarrantyQRCodes />;
}

/* =============================================================================
   LEGACY IMPLEMENTATION (commented - previous accordion-based flow)
   =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  Box,
  ShieldCheck,
  Package,
  ChevronDown,
  ChevronUp,
  FileDown,
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import {
  createProduct,
  createPolicy,
  createBatch,
} from '../../services/productManagementService';
import { generateWarrantyCodes } from '../../services/warrantyCodeService';
import { getDealersByProviderId } from '../../services/warrantyService';
import { getCategories } from '../../services/warrantyTemplateService';

const WARRANTY_DURATIONS = [
  { days: 90, label: '3 Months' },
  { days: 180, label: '6 Months' },
  { days: 365, label: '1 Year' },
  { days: 730, label: '2 Years' },
  { days: 1095, label: '3 Years' },
];

const inputClass =
  'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]';

export function WarrantySetupLegacy() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [expandedSection, setExpandedSection] = useState({ category: true, product: true, policy: true, batch: true });

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [product, setProduct] = useState({
    product_name: '',
    model_number: '',
    sku_code: '',
    category: '',
    brand: '',
    description: '',
  });
  const [policy, setPolicy] = useState({
    policy_name: '',
    warranty_duration_days: 365,
    warranty_duration_label: '1 Year',
    start_rule: 'FROM_ACTIVATION',
    coverage_type: 'BOTH',
    coverage_scope: 'FULL_COVERAGE',
  });
  const [batch, setBatch] = useState({
    batch_name: '',
    serial_prefix: '',
    total_units: 10,
    code_prefix: 'WR',
    assigned_dealer_id: '',
  });

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
      const franchise = JSON.parse(localStorage.getItem('franchise') || '{}');
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

  const handleCategoryChange = (e) => {
    const id = e.target.value;
    setSelectedCategoryId(id);
    const cat = categories.find((c) => c.id === id);
    setProduct((p) => ({ ...p, category: cat?.name || '' }));
  };

  const updatePolicyDuration = (days, label) => {
    setPolicy((p) => ({ ...p, warranty_duration_days: days, warranty_duration_label: label }));
  };

  const toggleSection = (key) => {
    setExpandedSection((s) => ({ ...s, [key]: !s[key] }));
  };

  const handleCreate = async () => {
    if (!product.product_name?.trim()) {
      toast.error('Product name is required');
      return;
    }
    // if (!policy.policy_name?.trim()) {
    //   toast.error('Policy name is required');
    //   return;
    // }
    if (!batch.batch_name?.trim()) {
      toast.error('Batch name is required');
      return;
    }
    if (batch.total_units < 1) {
      toast.error('Total units must be at least 1');
      return;
    }

    setLoading(true);
    try {
      const productRes = await createProduct(product);
      const productId = productRes?.id;
      if (!productId) throw new Error('Failed to create product');

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
      if (!policyId) throw new Error('Failed to create policy');

      const batchPayload = {
        product_master_id: productId,
        warranty_policy_id: policyId,
        batch_name: batch.batch_name.trim(),
        serial_prefix: batch.serial_prefix || '',
        total_units: batch.total_units,
        code_prefix: batch.code_prefix || 'WR',
        assigned_dealer_id: batch.assigned_dealer_id || null,
      };
      const batchRes = await createBatch(batchPayload);
      const batchId = batchRes?.id;

      const codePayload = {
        product_name: product.product_name,
        product_id: product.sku_code || '',
        serial_no: batch.serial_prefix || '',
        warranty_code: batch.code_prefix || 'WR',
        warranty_days: policy.warranty_duration_days,
        warranty_period_readable: policy.warranty_duration_label,
        serial_no_quantity: batch.total_units,
        total_units: batch.total_units,
        quantity: 1,
        type: 'Product',
        other_type: '',
        vehicle_number: '',
        service_id: '',
        factory_item_number: product.sku_code || '',
        factory_service_number: '',
        warranty_registration_url: '',
        warranty_from: null,
        warranty_to: null,
        warranty_check: false,
        warranty_check_interval: 0,
        warranty_interval_dates: [],
        warranty_reminder_days: [0, 1, 2, 5, 10],
        terms_and_conditions: null,
        terms_and_conditions_link: '',
        is_active: true,
        print_type: 'A4',
        batch_id: batchId || null,
        assigned_dealer_id: batch.assigned_dealer_id || null,
      };

      const codeRes = await generateWarrantyCodes(codePayload);
      const pdfData = codeRes?.data?.data;
      if (pdfData) {
        try {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${pdfData}`;
          link.download = `warranty-batch-${batch.batch_name.replace(/\s+/g, '-')}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('QR codes PDF downloaded!');
        } catch {
        }
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`Product, policy, and ${batch.total_units} warranty codes created successfully!`);
      navigate('/owner/warranty-batches');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create warranty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Register Product & Create Warranty Batch</h1>
        <p className="text-sm text-slate-500">Complete all sections below, then create and download QR codes</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('category')} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-[#1A7FC1]" />
              <h2 className="font-semibold text-slate-800">Category</h2>
            </div>
            {expandedSection.category ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          {expandedSection.category && (
            <div className="px-6 pb-6 pt-0">
              <label className="block text-sm font-medium text-slate-600 mb-2">Select Category</label>
              <select value={selectedCategoryId} onChange={handleCategoryChange} className={`${inputClass} bg-white`}>
                <option value="">Choose a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {!categories.length && <p className="text-xs text-slate-500 mt-1">Categories load from warranty setup. Run seed if empty.</p>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('product')} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-[#1A7FC1]" />
              <h2 className="font-semibold text-slate-800">1. Register Product</h2>
            </div>
            {expandedSection.product ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          {expandedSection.product && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Product Name *</label>
                <input type="text" value={product.product_name} onChange={(e) => setProduct((p) => ({ ...p, product_name: e.target.value }))} placeholder="e.g., LED TV 55 inch" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Model Number</label>
                  <input type="text" value={product.model_number} onChange={(e) => setProduct((p) => ({ ...p, model_number: e.target.value }))} placeholder="e.g., TV-55-A1" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">SKU Code</label>
                  <input type="text" value={product.sku_code} onChange={(e) => setProduct((p) => ({ ...p, sku_code: e.target.value }))} placeholder="e.g., SKU-TV55" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                  <input type="text" value={product.category} onChange={(e) => setProduct((p) => ({ ...p, category: e.target.value }))} placeholder="e.g., Electronics" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Brand</label>
                  <input type="text" value={product.brand} onChange={(e) => setProduct((p) => ({ ...p, brand: e.target.value }))} placeholder="e.g., BrandX" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                <input type="text" value={product.description} onChange={(e) => setProduct((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description" className={inputClass} />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('policy')} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#1A7FC1]" />
              <h2 className="font-semibold text-slate-800">2. Create Policy</h2>
            </div>
            {expandedSection.policy ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          {expandedSection.policy && (
            <div className="px-6 pb-6 space-y-4">
              {false && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Policy Name *</label>
                <input type="text" value={policy.policy_name} onChange={(e) => setPolicy((p) => ({ ...p, policy_name: e.target.value }))} placeholder={`e.g., ${product.product_name || 'Product'} Standard Warranty`} className={inputClass} />
              </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Warranty Duration</label>
                <div className="flex flex-wrap gap-2">
                  {WARRANTY_DURATIONS.map((d) => (
                    <button key={d.days} type="button" onClick={() => updatePolicyDuration(d.days, d.label)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${policy.warranty_duration_days === d.days ? 'bg-[#1A7FC1] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-500">Coverage: {policy.coverage_type?.replace('_', ' ')} • Start: {policy.start_rule?.replace(/_/g, ' ')}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button type="button" onClick={() => toggleSection('batch')} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#1A7FC1]" />
              <h2 className="font-semibold text-slate-800">3. Warranty Batch</h2>
            </div>
            {expandedSection.batch ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          {expandedSection.batch && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Batch Name *</label>
                <input type="text" value={batch.batch_name} onChange={(e) => setBatch((b) => ({ ...b, batch_name: e.target.value }))} placeholder="e.g., Batch-FEB-2026" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Number of Codes *</label>
                  <input type="number" min="1" max="1000" value={batch.total_units} onChange={(e) => setBatch((b) => ({ ...b, total_units: parseInt(e.target.value) || 1 }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Code Prefix</label>
                  <input type="text" value={batch.code_prefix} onChange={(e) => setBatch((b) => ({ ...b, code_prefix: e.target.value }))} placeholder="WR" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Assign to Dealer (optional)</label>
                <select value={batch.assigned_dealer_id} onChange={(e) => setBatch((b) => ({ ...b, assigned_dealer_id: e.target.value }))} className={`${inputClass} bg-white`}>
                  <option value="">No dealer (assign later)</option>
                  {dealers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="bg-blue-50 rounded-lg border border-blue-100 p-4">
                <p className="text-blue-900 text-sm">This will create the product, policy, and generate <strong>{batch.total_units}</strong> warranty codes. QR code PDF will download automatically.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleCreate} disabled={loading} className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-lg">
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
          ) : (
            <><FileDown className="w-4 h-4 mr-2" /> Create & Download QR Codes</>
          )}
        </Button>
      </div>
    </div>
  );
}

============================================================================= */
