import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Plus, Search, Package, Hash, Calendar, Shield, Loader2, CheckCircle2, ChevronDown, ChevronUp, Copy, FileText, RefreshCw, Settings, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { generateWarrantyCodes, getProviderWarrantyCodes, generateProductId, getWarrantySettings, assignWarrantyCodeDealer, getFranchiseInventoryForWarranty } from '../../services/warrantyCodeService';
import { getDealersByProviderId } from '../../services/warrantyService';
import {
  yearsMonthsToDays,
  yearsMonthsToReadableLabel,
  WARRANTY_DAYS_MIN,
  WARRANTY_DAYS_MAX,
  WARRANTY_YEARS_MAX,
  WARRANTY_MONTHS_MAX,
} from '../../utils/warrantyUtils';
import { getEffectiveRegistrationUrl } from '../../utils/registrationUrl';

export function WarrantyCodeManagement() {
  const navigate = useNavigate();
  const [view, setView] = useState('list'); // list | create
  const [warrantyCodes, setWarrantyCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [settingsConfigured, setSettingsConfigured] = useState(true); // assume true until checked
  const [dealers, setDealers] = useState([]);
  const [selectedDealerByCode, setSelectedDealerByCode] = useState({});
  const [assigningCodeId, setAssigningCodeId] = useState('');

  // Create form state (factory_item_number and franchise_inventory_id come from system when product is selected)
  const [formData, setFormData] = useState({
    product_name: '',
    product_id: '',
    factory_item_number: '',
    franchise_inventory_id: '',
    serial_no: '',
    warranty_code: '',
    warranty_days: 365,
    warranty_period_readable: '1 Year',
    warranty_is_custom: false,
    warranty_custom_years: '1',
    warranty_custom_months: '0',
    serial_no_quantity: 1,
    quantity: 1,
    type: 'Product',
    terms_and_conditions: '',
    terms_and_conditions_link: '',
    is_active: true,
    print_type: 'A4',
  });
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const warrantyPeriods = [
    { label: '6 Months', days: 180, readable: '6 Months' },
    { label: '1 Year', days: 365, readable: '1 Year' },
    { label: '2 Years', days: 730, readable: '2 Years' },
    { label: '3 Years', days: 1095, readable: '3 Years' },
    { label: '5 Years', days: 1825, readable: '5 Years' },
    { label: 'Custom', days: 'custom', readable: null },
  ];

  const fetchWarrantyCodes = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check if warranty settings exist (uses auth token, no ID needed)
      try {
        const settings = await getWarrantySettings();
        setSettingsConfigured(!!getEffectiveRegistrationUrl(settings));
      } catch {
        setSettingsConfigured(false);
      }

      const response = await getProviderWarrantyCodes();
      const codes = response?.data?.warranty_codes || [];
      setWarrantyCodes(Array.isArray(codes) ? codes : []);
    } catch (error) {
      console.error('Error fetching warranty codes:', error);
      toast.error('Failed to load warranty codes');
      setWarrantyCodes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarrantyCodes();
  }, [fetchWarrantyCodes]);

  // Load franchise inventory for "Item Code from system" when on create view
  useEffect(() => {
    if (view !== 'create') return;
    const franchise = JSON.parse(localStorage.getItem('franchise') || '{}');
    const franchiseId = franchise?.id || franchise?.franchise_id;
    if (!franchiseId) {
      setInventoryProducts([]);
      return;
    }
    setInventoryLoading(true);
    getFranchiseInventoryForWarranty(franchiseId)
      .then((list) => setInventoryProducts(Array.isArray(list) ? list : []))
      .catch(() => setInventoryProducts([]))
      .finally(() => setInventoryLoading(false));
  }, [view]);

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const franchise = JSON.parse(localStorage.getItem('franchise') || '{}');
        const providerId = franchise?.provider_id || franchise?.id;
        if (!providerId) return;
        const response = await getDealersByProviderId(providerId);
        const dealerList = response?.data || [];
        setDealers(Array.isArray(dealerList) ? dealerList.filter(d => d.is_active !== false) : []);
      } catch (error) {
        console.error('Error fetching dealers:', error);
        setDealers([]);
      }
    };

    fetchDealers();
  }, []);

  const handleAssignDealer = async (codeId) => {
    const dealerId = selectedDealerByCode[codeId];
    if (!dealerId) {
      toast.error('Please select a dealer');
      return;
    }

    setAssigningCodeId(codeId);
    try {
      await assignWarrantyCodeDealer(codeId, dealerId);
      toast.success('Warranty code assigned to dealer');
      setSelectedDealerByCode(prev => ({ ...prev, [codeId]: '' }));
      await fetchWarrantyCodes();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to assign warranty code';
      toast.error(msg);
    } finally {
      setAssigningCodeId('');
    }
  };

  const handleGenerateProductId = async () => {
    try {
      const response = await generateProductId();
      const pid = response?.data?.product_id;
      if (pid) {
        setFormData(prev => ({ ...prev, product_id: pid }));
        toast.success('Product ID generated');
      }
    } catch (error) {
      toast.error('Failed to generate product ID');
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePeriodChange = (period) => {
    if (period.days === 'custom') {
      setFormData(prev => {
        const y = parseInt(prev.warranty_custom_years, 10) || 1;
        const m = Math.min(WARRANTY_MONTHS_MAX, Math.max(0, parseInt(prev.warranty_custom_months, 10) || 0));
        const totalDays = yearsMonthsToDays(y, m);
        return {
          ...prev,
          warranty_is_custom: true,
          warranty_custom_years: prev.warranty_custom_years || '1',
          warranty_custom_months: prev.warranty_custom_months || '0',
          warranty_days: Math.max(WARRANTY_DAYS_MIN, Math.min(WARRANTY_DAYS_MAX, totalDays)),
          warranty_period_readable: yearsMonthsToReadableLabel(y, m),
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        warranty_is_custom: false,
        warranty_days: period.days,
        warranty_period_readable: period.readable,
      }));
    }
  };

  const handleCustomYearsMonthsChange = (field, value) => {
    setFormData(prev => {
      const num = parseInt(value, 10);
      let y = parseInt(prev.warranty_custom_years, 10) || 0;
      let m = parseInt(prev.warranty_custom_months, 10) || 0;
      if (field === 'years') {
        y = value === '' ? 0 : Math.min(WARRANTY_YEARS_MAX, Math.max(0, isNaN(num) ? 0 : num));
      } else {
        m = value === '' ? 0 : Math.min(WARRANTY_MONTHS_MAX, Math.max(0, isNaN(num) ? 0 : num));
      }
      const totalDays = yearsMonthsToDays(y, m);
      const days = Math.max(WARRANTY_DAYS_MIN, Math.min(WARRANTY_DAYS_MAX, totalDays || 365));
      return {
        ...prev,
        warranty_custom_years: field === 'years' ? (value === '' ? '' : String(y)) : prev.warranty_custom_years,
        warranty_custom_months: field === 'months' ? (value === '' ? '' : String(m)) : prev.warranty_custom_months,
        warranty_days: days,
        warranty_period_readable: yearsMonthsToReadableLabel(y, m),
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.product_name) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.warranty_code) {
      toast.error('Warranty code prefix is required');
      return;
    }
    if (formData.serial_no_quantity < 1) {
      toast.error('Serial number quantity must be at least 1');
      return;
    }
    if (formData.warranty_is_custom) {
      const y = parseInt(formData.warranty_custom_years, 10) || 0;
      const m = parseInt(formData.warranty_custom_months, 10) || 0;
      const totalDays = yearsMonthsToDays(y, m);
      if (totalDays < WARRANTY_DAYS_MIN || totalDays > WARRANTY_DAYS_MAX) {
        toast.error('Warranty period must be at least 1 month (e.g. 0 years 1 month)');
        return;
      }
    }

    setIsGenerating(true);

    try {
      const payload = {
        product_name: formData.product_name,
        product_id: formData.product_id || '',
        service_id: '',
        serial_no: formData.serial_no || '',
        warranty_code: formData.warranty_code,
        warranty_days: formData.warranty_days,
        warranty_period_readable: formData.warranty_period_readable,
        warranty_from: null,
        warranty_to: null,
        serial_no_quantity: formData.serial_no_quantity,
        quantity: formData.quantity,
        type: formData.type,
        other_type: '',
        vehicle_number: '',
        factory_item_number: formData.factory_item_number || '',
        factory_service_number: '',
        franchise_inventory_id: formData.franchise_inventory_id || undefined,
        warranty_registration_url: '',
        warranty_check: false,
        warranty_check_interval: 0,
        warranty_interval_dates: [],
        warranty_reminder_days: [0, 1, 2, 5, 10],
        terms_and_conditions: formData.terms_and_conditions ? [formData.terms_and_conditions] : [],
        terms_and_conditions_link: formData.terms_and_conditions_link,
        is_active: formData.is_active,
        print_type: formData.print_type,
      };

      const response = await generateWarrantyCodes(payload);

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      const generatedCodes = response?.data?.generated_warranty_code || [];
      toast.success(`${generatedCodes.length} warranty code(s) generated successfully!`);

      // Download PDF if available
      const pdfData = response?.data?.data;
      if (pdfData) {
        try {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${pdfData}`;
          link.download = `warranty-codes-${formData.product_name.replace(/\s+/g, '-')}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('QR codes PDF downloaded!');
        } catch {
          // PDF download is optional
        }
      }

      // Reset form and go back to list
      setFormData({
        product_name: '',
        product_id: '',
        factory_item_number: '',
        franchise_inventory_id: '',
        serial_no: '',
        warranty_code: '',
        warranty_days: 365,
        warranty_period_readable: '1 Year',
        serial_no_quantity: 1,
        quantity: 1,
        type: 'Product',
        terms_and_conditions: '',
        terms_and_conditions_link: '',
        is_active: true,
        print_type: 'A4',
      });

      setView('list');
      fetchWarrantyCodes();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to generate warranty codes';
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Group warranty codes by group_id
  const groupedCodes = warrantyCodes.reduce((groups, code) => {
    const key = code.group_id || code.id;
    if (!groups[key]) {
      groups[key] = {
        group_id: key,
        product_name: code.product_name,
        product_id: code.product_id,
        warranty_period_readable: code.warranty_period_readable,
        warranty_days: code.warranty_days,
        status: code.warranty_code_status,
        created_at: code.created_at,
        codes: [],
      };
    }
    groups[key].codes.push(code);
    return groups;
  }, {});

  const groupedCodesArray = Object.values(groupedCodes).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const totalCodes = warrantyCodes.length;
  const activeCodes = warrantyCodes.filter((c) => c.warranty_code_status === 'Active').length;
  const pendingCodes = warrantyCodes.filter((c) => c.warranty_code_status === 'Pending').length;
  const assignedCodes = warrantyCodes.filter((c) => c.assigned_dealer_id).length;
  const availableCodes = warrantyCodes.filter((c) =>
    (c.warranty_code_status === 'Inactive' || !c.warranty_code_status) && !c.assigned_dealer_id
  ).length;
  const normalizedQuery = searchQuery.toLowerCase();

  // Filter by search + operational status
  const filteredGroups = groupedCodesArray.filter(group => {
    const matchesSearch =
      group.product_name?.toLowerCase().includes(normalizedQuery) ||
      group.product_id?.toLowerCase().includes(normalizedQuery) ||
      group.codes.some(c => c.warranty_code?.toLowerCase().includes(normalizedQuery));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && group.codes.some((c) => c.warranty_code_status === 'Active')) ||
      (statusFilter === 'pending' && group.codes.some((c) => c.warranty_code_status === 'Pending')) ||
      (statusFilter === 'assigned' && group.codes.some((c) => c.assigned_dealer_id)) ||
      (statusFilter === 'available' &&
        group.codes.some((c) =>
          (c.warranty_code_status === 'Inactive' || !c.warranty_code_status) && !c.assigned_dealer_id
        ));

    return matchesSearch && matchesStatus;
  });

  // CREATE VIEW
  if (view === 'create') {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Warranty Codes
            </button>
            <h2 className="text-slate-900 mb-1 tracking-tight">Generate Warranty Codes</h2>
            <p className="text-slate-500">Create and assign warranty codes for products and services</p>
          </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
            {/* Product Info */}
            <div>
              <h3 className="text-slate-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-700" />
                Product Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    value={formData.product_name}
                    onChange={(e) => updateField('product_name', e.target.value)}
                    placeholder="e.g., iPhone 15 Pro"
                    className="h-12 rounded-xl border-slate-200 mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="productId">Product ID</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="productId"
                      value={formData.product_id}
                      onChange={(e) => updateField('product_id', e.target.value)}
                      placeholder="Auto-generate or enter manually"
                      className="h-12 rounded-xl border-slate-200"
                    />
                    <Button
                      type="button"
                      onClick={handleGenerateProductId}
                      variant="outline"
                      className="h-12 px-4 rounded-xl"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="selectProduct">Product from inventory (Item Code from system)</Label>
                  <select
                    id="selectProduct"
                    value={formData.franchise_inventory_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) {
                        setFormData((prev) => ({
                          ...prev,
                          franchise_inventory_id: '',
                          factory_item_number: '',
                        }));
                        return;
                      }
                      const product = inventoryProducts.find((p) => p.id === id);
                      if (product) {
                        setFormData((prev) => ({
                          ...prev,
                          franchise_inventory_id: id,
                          factory_item_number: product.product_item_code || '',
                          product_name: product.product_name || prev.product_name,
                        }));
                      }
                    }}
                    className="mt-1 w-full h-12 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A7FC1] bg-white"
                    disabled={inventoryLoading}
                  >
                    <option value="">— No product selected (enter product name manually) —</option>
                    {inventoryProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product_name || 'Unnamed'} ({p.product_item_code || p.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-slate-400 text-xs mt-1">
                    {inventoryLoading ? 'Loading inventory...' : 'Select a product to use its Item Code from the system on labels/PDF'}
                  </p>
                </div>
                <div>
                  <Label htmlFor="type">Product Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => updateField('type', e.target.value)}
                    className="mt-1 w-full h-12 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]"
                  >
                    <option value="Product">Product</option>
                    <option value="Service">Service</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="serialNo">Serial Number Prefix</Label>
                  <Input
                    id="serialNo"
                    value={formData.serial_no}
                    onChange={(e) => updateField('serial_no', e.target.value)}
                    placeholder="e.g., APL (auto-generated if empty)"
                    className="h-12 rounded-xl border-slate-200 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Warranty Code Config */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-700" />
                Warranty Configuration
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="warrantyCode">Warranty Code Prefix *</Label>
                  <Input
                    id="warrantyCode"
                    value={formData.warranty_code}
                    onChange={(e) => updateField('warranty_code', e.target.value)}
                    placeholder="e.g., WR (unique IDs will be appended)"
                    className="h-12 rounded-xl border-slate-200 mt-1"
                    required
                  />
                  <p className="text-slate-400 text-xs mt-1">A random suffix will be added to make each code unique</p>
                </div>
                <div>
                  <Label>Warranty Period *</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {warrantyPeriods.map((period) => (
                      <button
                        key={period.label}
                        type="button"
                        onClick={() => handlePeriodChange(period)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${
                          (period.days === 'custom' && formData.warranty_is_custom) ||
                          (period.days !== 'custom' && formData.warranty_days === period.days)
                            ? 'bg-[#1A7FC1] text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                  {formData.warranty_is_custom && (
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={WARRANTY_YEARS_MAX}
                          value={formData.warranty_custom_years}
                          onChange={(e) => handleCustomYearsMonthsChange('years', e.target.value)}
                          placeholder="Years"
                          className="h-10 w-24 rounded-lg border-slate-200"
                        />
                        <span className="text-xs text-slate-600">Years</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={WARRANTY_MONTHS_MAX}
                          value={formData.warranty_custom_months}
                          onChange={(e) => handleCustomYearsMonthsChange('months', e.target.value)}
                          placeholder="Months"
                          className="h-10 w-24 rounded-lg border-slate-200"
                        />
                        <span className="text-xs text-slate-600">Months</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        = {formData.warranty_period_readable}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="serialQty">Number of Serial Numbers *</Label>
                  <Input
                    id="serialQty"
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.serial_no_quantity}
                    onChange={(e) => updateField('serial_no_quantity', parseInt(e.target.value) || 1)}
                    className="h-12 rounded-xl border-slate-200 mt-1"
                    required
                  />
                  <p className="text-slate-400 text-xs mt-1">How many unique serial numbers to generate</p>
                </div>
                <div>
                  <Label htmlFor="qty">Codes per Serial Number</Label>
                  <Input
                    id="qty"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.quantity}
                    onChange={(e) => updateField('quantity', parseInt(e.target.value) || 1)}
                    className="h-12 rounded-xl border-slate-200 mt-1"
                  />
                  <p className="text-slate-400 text-xs mt-1">Warranty codes per serial number</p>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" />
                Terms & Conditions (Optional)
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="terms">Terms Text</Label>
                  <textarea
                    id="terms"
                    value={formData.terms_and_conditions}
                    onChange={(e) => updateField('terms_and_conditions', e.target.value)}
                    placeholder="Enter warranty terms and conditions..."
                    className="mt-1 w-full px-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A7FC1] resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="termsLink">Terms & Conditions URL</Label>
                  <Input
                    id="termsLink"
                    value={formData.terms_and_conditions_link}
                    onChange={(e) => updateField('terms_and_conditions_link', e.target.value)}
                    placeholder="https://example.com/terms"
                    className="h-12 rounded-xl border-slate-200 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-slate-900 text-sm font-medium mb-2">Generation Summary</p>
              <p className="text-slate-700 text-sm">
                This will generate <strong>{formData.serial_no_quantity * formData.quantity}</strong> warranty code(s)
                ({formData.serial_no_quantity} serial number(s) x {formData.quantity} code(s) each)
                for <strong>{formData.product_name || '(product name)'}</strong> with
                <strong> {formData.warranty_period_readable}</strong> warranty period.
              </p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isGenerating}
              className="w-full h-14 bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-xl shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Warranty Codes...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Generate Warranty Codes
                </>
              )}
            </Button>
          </form>
        </motion.div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-slate-900 mb-1 tracking-tight">Warranty Codes</h2>
            <p className="text-slate-500">Manage generation, assignment, and status of warranty codes</p>
          </div>
          <div className="flex gap-2">
              <Button
                onClick={() => navigate('/warranty-settings')}
                variant="outline"
                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300 rounded-xl h-12 px-4"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => {
                  if (!settingsConfigured) {
                    toast.error('Please configure your Warranty Settings first (Registration URL is required)');
                    navigate('/warranty-settings', { state: { from: 'warranty-codes' } });
                    return;
                  }
                  setView('create');
                }}
                className="bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-xl h-12 px-6"
              >
                <Plus className="w-5 h-5 mr-2" />
                Generate New
              </Button>
            </div>
        </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Settings Warning */}
        {!isLoading && !settingsConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-amber-900 mb-1">Setup Required</h3>
              <p className="text-amber-700 text-sm">
                You need to configure your <strong>Warranty Settings</strong> (Registration URL) before you can generate warranty codes.
              </p>
              <Button
                onClick={() => navigate('/warranty-settings', { state: { from: 'warranty-codes' } })}
                className="mt-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg h-9 px-4 text-sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure Settings
              </Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
            <p className="text-slate-500 text-sm mb-1">Total Codes</p>
            <p className="text-slate-900 text-2xl font-semibold">{totalCodes}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
            <p className="text-slate-500 text-sm mb-1">Registered</p>
            <p className="text-[#1A7FC1] text-2xl font-semibold">{activeCodes}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
            <p className="text-slate-500 text-sm mb-1">Pending</p>
            <p className="text-amber-700 text-2xl font-semibold">{pendingCodes}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
            <p className="text-slate-500 text-sm mb-1">Assigned</p>
            <p className="text-indigo-700 text-2xl font-semibold">{assignedCodes}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
            <p className="text-slate-500 text-sm mb-1">Available</p>
            <p className="text-emerald-700 text-2xl font-semibold">{availableCodes}</p>
          </div>
        </div>

        {/* Search + status filters */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, ID, or warranty code..."
                className="h-12 pl-11 rounded-xl border-slate-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Registered' },
                { id: 'pending', label: 'Pending' },
                { id: 'assigned', label: 'Assigned' },
                { id: 'available', label: 'Available' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatusFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    statusFilter === filter.id
                      ? 'bg-[#1A7FC1] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-slate-600 animate-spin mx-auto" />
            <p className="mt-4 text-slate-600">Loading warranty codes...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredGroups.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">
              {searchQuery || statusFilter !== 'all'
                ? 'No warranty codes match your search/filter'
                : 'No warranty codes yet'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setView('create')}
                className="mt-4 bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Your First Codes
              </Button>
            )}
          </div>
        )}

        {/* Grouped codes list */}
        {!isLoading && filteredGroups.length > 0 && (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <motion.div
                key={group.group_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Group header */}
                <button
                  onClick={() => setExpandedGroup(expandedGroup === group.group_id ? null : group.group_id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-700" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-slate-900">{group.product_name}</h3>
                      <p className="text-slate-500 text-sm">
                        {group.codes.length} code(s) - {group.warranty_period_readable || `${group.warranty_days} days`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      group.codes.some(c => c.warranty_code_status === 'Active')
                        ? 'bg-[#1A7FC1]/15 text-[#1A7FC1]'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {group.codes.filter(c => c.warranty_code_status === 'Active').length} registered
                    </span>
                    {expandedGroup === group.group_id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded codes */}
                <AnimatePresence>
                  {expandedGroup === group.group_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100"
                    >
                      <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
                        {group.codes.map((code) => (
                          <div
                            key={code.id}
                            className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-slate-900 font-mono text-sm truncate">{code.warranty_code}</p>
                                <button
                                  onClick={() => copyToClipboard(code.warranty_code)}
                                  className="text-slate-400 hover:text-[#1A7FC1]"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-slate-500 text-xs">
                                Serial: {code.serial_no || 'N/A'} | Item: {code.factory_item_number || code.product_id || 'N/A'}
                              </p>
                              {code.assigned_dealer?.name && (
                                <p className="text-indigo-700 text-xs mt-1">
                                  Assigned to: {code.assigned_dealer.name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                code.warranty_code_status === 'Active'
                                  ? 'bg-[#1A7FC1]/15 text-[#1A7FC1]'
                                  : (code.warranty_code_status === 'Inactive' && code.assigned_dealer_id)
                                  ? 'bg-[#1A7FC1]/15 text-[#1A7FC1]'
                                  : (code.warranty_code_status === 'Inactive' || !code.warranty_code_status)
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : code.warranty_code_status === 'Pending'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {code.warranty_code_status === 'Active'
                                  ? 'Registered'
                                  : code.warranty_code_status === 'Inactive' && code.assigned_dealer_id
                                  ? 'Assigned'
                                  : (code.warranty_code_status === 'Inactive' || !code.warranty_code_status)
                                  ? 'Available'
                                  : code.warranty_code_status || '—'}
                              </span>

                              {code.warranty_code_status === 'Inactive' && !code.assigned_dealer_id && (
                                <>
                                  <select
                                    value={selectedDealerByCode[code.id] || ''}
                                    onChange={(e) => setSelectedDealerByCode(prev => ({ ...prev, [code.id]: e.target.value }))}
                                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
                                  >
                                    <option value="">Select dealer</option>
                                    {dealers.map((dealer) => (
                                      <option key={dealer.id} value={dealer.id}>
                                        {dealer.name}
                                      </option>
                                    ))}
                                  </select>
                                  <Button
                                    type="button"
                                    onClick={() => handleAssignDealer(code.id)}
                                    disabled={assigningCodeId === code.id}
                                    className="h-8 px-3 text-xs bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-md"
                                  >
                                    {assigningCodeId === code.id ? 'Assigning...' : 'Assign'}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
      </div>
    </div>
  );
}
