import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Globe, QrCode, Loader2, CheckCircle2, AlertCircle, Save, Box } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { getWarrantySettings, createWarrantySettings, updateWarrantySettings } from '../../services/warrantyCodeService';
import { CertificateTemplateSelector, toUiValue } from './CertificateTemplateSelector';

export function WarrantySettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  const fromWarrantyBatches = location.state?.from === 'warranty-codes' || location.state?.from === 'warranty-batches';

  const [formData, setFormData] = useState({
    registration_url: '',
    qr_data_to_url: false,
    qr_data: true,
    custom_field1: '',
    custom_field2: '',
    certificate_template: 'classic',
    default_category: '',
    default_category_custom: '',
  });

  const FIXED_CATEGORY_VALUES = ['', 'Electronics', 'Appliances', 'Auto Parts', 'Machinery', 'Furniture', 'Other'];
  const DEFAULT_CATEGORY_OPTIONS = [
    { value: '', label: 'None (select each time)' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Appliances', label: 'Appliances' },
    { value: 'Auto Parts', label: 'Auto Parts' },
    { value: 'Machinery', label: 'Machinery' },
    { value: 'Furniture', label: 'Furniture' },
    { value: 'Other', label: 'Other' },
  ];

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const settings = await getWarrantySettings();

        if (settings && settings.id) {
          setHasExisting(true);
          const savedCategory = (settings.default_category || '').trim();
          const isCustomCategory = savedCategory && !FIXED_CATEGORY_VALUES.includes(savedCategory);
          setFormData({
            registration_url: settings.registration_url || '',
            qr_data_to_url: settings.qr_data_to_url || false,
            qr_data: settings.qr_data !== undefined ? settings.qr_data : true,
            custom_field1: settings.custom_field1 || '',
            custom_field2: settings.custom_field2 || '',
            certificate_template: toUiValue(settings.certificate_template),
            default_category: isCustomCategory ? 'Other' : (savedCategory || ''),
            default_category_custom: isCustomCategory ? savedCategory : '',
          });
        } else if (settings) {
          // No DB row yet: API may still return defaults (e.g. registration_url from FRONTEND_URL)
          setHasExisting(false);
          const savedCategory = (settings.default_category || '').trim();
          const isCustomCategory = savedCategory && !FIXED_CATEGORY_VALUES.includes(savedCategory);
          setFormData({
            registration_url: settings.registration_url || '',
            qr_data_to_url: settings.qr_data_to_url || false,
            qr_data: settings.qr_data !== undefined ? settings.qr_data : true,
            custom_field1: settings.custom_field1 || '',
            custom_field2: settings.custom_field2 || '',
            certificate_template: toUiValue(settings.certificate_template),
            default_category: isCustomCategory ? 'Other' : (savedCategory || ''),
            default_category_custom: isCustomCategory ? savedCategory : '',
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.registration_url.trim()) {
      toast.error('Registration URL is required');
      return;
    }

    try {
      new URL(formData.registration_url);
    } catch {
      toast.error('Please enter a valid URL (e.g., https://example.com/register)');
      return;
    }

    setIsSaving(true);

    try {
      const defaultCategoryToSave =
        formData.default_category === 'Other' && formData.default_category_custom.trim()
          ? formData.default_category_custom.trim()
          : (formData.default_category || '');
      const selectedTemplate = toUiValue(formData.certificate_template) || 'classic-landscape';
      const payload = {
        registration_url: formData.registration_url.trim(),
        qr_data_to_url: formData.qr_data_to_url,
        qr_data: formData.qr_data,
        custom_field1: formData.custom_field1.trim(),
        custom_field2: formData.custom_field2.trim(),
        certificate_template: selectedTemplate,
        default_category: defaultCategoryToSave,
      };

      if (hasExisting) {
        await updateWarrantySettings(payload);
        toast.success('Warranty settings updated successfully!');
      } else {
        await createWarrantySettings(payload);
        setHasExisting(true);
        toast.success('Warranty settings created successfully!');
      }

      if (fromWarrantyBatches) {
        setTimeout(() => navigate('/owner/warranty-batches'), 500);
      }
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to save warranty settings';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const suggestedUrl = `${window.location.origin}/customer-register`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#1A7FC1] animate-spin mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1A7FC1]/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-[#1A7FC1]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">System Settings</h2>
          <p className="text-sm text-slate-500">Configure registration URL and QR code behavior</p>
        </div>
      </div>

      {!hasExisting && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-amber-900 mb-1">Setup Required</h3>
            <p className="text-amber-700 text-xs">
              Configure your warranty settings before generating warranty codes.
              At minimum, set the <strong>Registration URL</strong> — this is the URL embedded in QR codes
              so customers can register their products.
            </p>
          </div>
        </div>
      )}

      {hasExisting && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-green-800 text-sm">
            Your warranty settings are configured. You can update them below.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Registration URL */}
        <div className="bg-white rounded-xl p-5 lg:p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-600" />
            Registration URL
          </h3>
          <p className="text-slate-500 text-xs mb-4">
            This URL will be embedded in QR codes on warranty labels.
            Customers scan the QR code to register their product at this URL.
          </p>

          <div className="space-y-3">
            <div>
              <Label htmlFor="registrationUrl" className="text-xs">Customer Registration URL *</Label>
              <Input
                id="registrationUrl"
                value={formData.registration_url}
                onChange={(e) => updateField('registration_url', e.target.value)}
                placeholder="https://yourdomain.com/customer-register"
                className="h-10 rounded-lg border-slate-200 mt-1 font-mono text-sm"
                required
              />
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-slate-500 text-xs mb-1">Suggested URL (for current app):</p>
              <button
                type="button"
                onClick={() => {
                  updateField('registration_url', suggestedUrl);
                  toast.success('URL applied');
                }}
                className="text-[#1A7FC1] hover:text-[#0F5F91] text-sm font-mono underline break-all text-left"
              >
                {suggestedUrl}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Settings */}
        <div className="bg-white rounded-xl p-5 lg:p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-slate-600" />
            QR Code Settings
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between bg-slate-50 rounded-lg p-3.5 cursor-pointer hover:bg-slate-100 transition-colors">
              <div>
                <p className="text-slate-900 text-sm">Link QR Data to URL</p>
                <p className="text-slate-500 text-xs">QR code will contain the registration URL with warranty data as parameters</p>
              </div>
              <div className="relative ml-3">
                <input
                  type="checkbox"
                  checked={formData.qr_data_to_url}
                  onChange={(e) => updateField('qr_data_to_url', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-checked:bg-[#1A7FC1] rounded-full transition-colors"></div>
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
              </div>
            </label>

            <label className="flex items-center justify-between bg-slate-50 rounded-lg p-3.5 cursor-pointer hover:bg-slate-100 transition-colors">
              <div>
                <p className="text-slate-900 text-sm">Include QR Data</p>
                <p className="text-slate-500 text-xs">Embed warranty data directly in the QR code</p>
              </div>
              <div className="relative ml-3">
                <input
                  type="checkbox"
                  checked={formData.qr_data}
                  onChange={(e) => updateField('qr_data', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-checked:bg-[#1A7FC1] rounded-full transition-colors"></div>
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
              </div>
            </label>
          </div>
        </div>

        {/* Certificate template */}
        <div className="bg-white rounded-xl p-5 lg:p-6 border border-slate-200 shadow-sm">
          <CertificateTemplateSelector
            value={formData.certificate_template}
            onChange={(v) => updateField('certificate_template', v)}
          />
        </div>

        {/* Default Product Category */}
        <div className="bg-white rounded-xl p-5 lg:p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <Box className="w-4 h-4 text-slate-600" />
            Default Product Category
          </h3>
          <p className="text-slate-500 text-xs mb-4">
            When creating products, the category field will be pre-filled with this value. You can still change it per product.
          </p>
          <div className="space-y-3">
            <div>
              <Label htmlFor="defaultCategory" className="text-xs">Default category for Create Product</Label>
              <select
                id="defaultCategory"
                value={formData.default_category}
                onChange={(e) => updateField('default_category', e.target.value)}
                className="mt-1 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
              >
                {DEFAULT_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value || 'none'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {formData.default_category === 'Other' && (
              <div>
                <Label htmlFor="defaultCategoryCustom" className="text-xs">Custom category name</Label>
                <Input
                  id="defaultCategoryCustom"
                  value={formData.default_category_custom}
                  onChange={(e) => updateField('default_category_custom', e.target.value)}
                  placeholder="e.g., Medical Equipment, Sports Gear"
                  className="h-10 rounded-lg border-slate-200 mt-1"
                />
                <p className="text-slate-500 text-xs mt-1">This name will appear when creating products.</p>
              </div>
            )}
          </div>
        </div>

        {/* Custom Fields */}
        <div className="bg-white rounded-xl p-5 lg:p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Custom Fields (Optional)</h3>
          <p className="text-slate-500 text-xs mb-4">
            Add custom metadata to your warranty settings if needed.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customField1" className="text-xs">Custom Field 1</Label>
              <Input
                id="customField1"
                value={formData.custom_field1}
                onChange={(e) => updateField('custom_field1', e.target.value)}
                placeholder="Optional custom value"
                className="h-10 rounded-lg border-slate-200 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="customField2" className="text-xs">Custom Field 2</Label>
              <Input
                id="customField2"
                value={formData.custom_field2}
                onChange={(e) => updateField('custom_field2', e.target.value)}
                placeholder="Optional custom value"
                className="h-10 rounded-lg border-slate-200 mt-1"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSaving}
          className="w-full h-12 bg-[#1A7FC1] hover:bg-[#0F5F91] text-white rounded-xl shadow-sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving Settings...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {hasExisting ? 'Update Settings' : 'Save Settings'}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
