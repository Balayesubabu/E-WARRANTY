import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileCheck, Share2, CheckCircle2, Loader2, ChevronDown, Package, Shield, AlertCircle, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { getAvailableWarrantyCodes, getDealerAssignedAvailableWarrantyCodes, registerCustomerWarranty } from '../../services/warrantyService';
import { uploadWarrantyImage } from '../../services/dealerService';
import api from '../../utils/api';

export function RegisterProduct() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableCodes, setAvailableCodes] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [providerId, setProviderId] = useState('');
  const [dealerKey, setDealerKey] = useState('');
  const [dealerInfo, setDealerInfo] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [resultData, setResultData] = useState(null);

  const [customerName, setCustomerName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState('');
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [uploadedInvoiceUrl, setUploadedInvoiceUrl] = useState('');

  const [emailError, setEmailError] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState({});

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const franchise = JSON.parse(localStorage.getItem('franchise') || '{}');
      const role = storedUser?.user_type || storedUser?.role || '';
      setUserRole(role);

      if (role === 'dealer') {
        const pid = storedUser?.provider_id || franchise?.provider_id || '';
        setProviderId(pid);
        setDealerKey(storedUser?.dealer_key || '');
        setDealerInfo({
          name: storedUser?.fullname || storedUser?.name || '',
          email: storedUser?.email || '',
        });
      } else if (role === 'owner') {
        const pid = franchise?.provider_id || franchise?.id || '';
        setProviderId(pid);
      }
    } catch (e) {
      console.error('Error loading user info:', e);
    }
  }, []);

  const fetchAvailableCodes = useCallback(async () => {
    if (!providerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = userRole === 'dealer'
        ? await getDealerAssignedAvailableWarrantyCodes()
        : await getAvailableWarrantyCodes(providerId);
      const codes = response?.data?.data?.warranty_codes || response?.data?.warranty_codes || [];
      setAvailableCodes(Array.isArray(codes) ? codes : []);
    } catch (error) {
      console.error('Error fetching available codes:', error);
      toast.error('Failed to load available products');
    } finally {
      setIsLoading(false);
    }
  }, [providerId, userRole]);

  useEffect(() => {
    fetchAvailableCodes();
  }, [fetchAvailableCodes]);

  const productGroups = availableCodes.reduce((groups, code) => {
    const key = code.product_name || 'Unknown Product';
    if (!groups[key]) {
      groups[key] = { product_name: key, codes: [] };
    }
    groups[key].codes.push(code);
    return groups;
  }, {});
  const productGroupsArray = Object.values(productGroups);

  const handleProductSelect = (productName) => {
    const group = productGroups[productName];
    if (group && group.codes.length > 0) {
      setSelectedCode(group.codes[0]);
      setCustomFieldValues({});
    }
  };

  const handleCodeSelect = (codeId) => {
    const code = availableCodes.find(c => c.id === codeId);
    if (code) {
      setSelectedCode(code);
      setCustomFieldValues({});
    }
  };

  const policyCustomFields = selectedCode?.batch?.policy_snapshot?.custom_fields || [];

  const validateEmail = (email) => {
    if (!email) { setEmailError(''); return true; }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleInvoiceChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File must be less than 5MB');
      return;
    }

    setInvoiceFile(file);

    if (file.type.startsWith('image/')) {
      setInvoicePreview(URL.createObjectURL(file));
    } else {
      setInvoicePreview('');
    }

    setIsUploadingInvoice(true);
    try {
      const formData = new FormData();
      formData.append('warranty_images', file);
      const response = await uploadWarrantyImage(formData);
      const urls = response?.data?.urls || response?.data?.image_urls || [];
      if (urls.length > 0) {
        setUploadedInvoiceUrl(urls[0]);
        toast.success('Invoice uploaded successfully');
      } else {
        setUploadedInvoiceUrl('');
        toast.warning('Upload returned no URL. Invoice will be submitted without file.');
      }
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error('Failed to upload invoice file');
      setUploadedInvoiceUrl('');
    } finally {
      setIsUploadingInvoice(false);
    }
  };

  const handleRemoveInvoice = () => {
    setInvoiceFile(null);
    setInvoicePreview('');
    setUploadedInvoiceUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCode) { toast.error('Please select a product'); return; }
    if (!customerName.trim()) { toast.error('Customer first name is required'); return; }
    if (!customerPhone.trim()) { toast.error('Customer phone number is required'); return; }
    if (!customerEmail.trim()) { toast.error('Customer email is required'); return; }
    if (!validateEmail(customerEmail)) return;
    if (!installationDate) { toast.error('Purchase date is required'); return; }

    const today = new Date().toISOString().split('T')[0];
    if (installationDate > today) { toast.error('Purchase date cannot be in the future'); return; }

    for (const cf of policyCustomFields) {
      if (cf.required && !customFieldValues[cf.field_name]?.trim()) {
        toast.error(`${cf.field_name} is required`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        provider_id: providerId,
        warranty_code: selectedCode.warranty_code,
        product_name: selectedCode.product_name,
        product_id: selectedCode.product_id || '',
        serial_number: selectedCode.serial_no || '',
        service_id: selectedCode.service_id || '',
        first_name: customerName.trim(),
        last_name: customerLastName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim(),
        address: customerAddress.trim(),
        invoice_number: invoiceNumber.trim(),
        date_of_installation: installationDate,
        is_active: true,
        vehicle_number: '',
        vehicle_chassis_number: '',
        warranty_image_url: uploadedInvoiceUrl || '',
        custom_value1: '',
        custom_value2: '',
        custom_field_values: Object.keys(customFieldValues).length > 0 ? customFieldValues : null,
      };

      if (userRole === 'dealer') {
        payload.is_dealer = true;
        payload.is_provider = false;
        payload.is_customer = false;
        payload.dealer_key = dealerKey;
        payload.dealer_name = dealerInfo?.name || '';
        payload.dealer_email = dealerInfo?.email || '';
      } else if (userRole === 'owner') {
        payload.is_provider = true;
        payload.is_dealer = false;
        payload.is_customer = false;
      }

      const response = await registerCustomerWarranty(payload);

      const pdfData = response?.data?.finalString;
      if (pdfData) {
        try {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${pdfData}`;
          link.download = `warranty-certificate-${customerName}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch { /* PDF download is optional */ }
      }

      setResultData({
        warrantyCode: selectedCode.warranty_code,
        productName: selectedCode.product_name,
        customerName: `${customerName} ${customerLastName}`.trim(),
        pdfData,
      });
      setShowSuccess(true);
      toast.success('Warranty registered successfully!');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to register warranty';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (resultData?.pdfData) {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${resultData.pdfData}`;
      link.download = `warranty-certificate-${resultData.customerName || 'customer'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Certificate downloaded!');
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    if (userRole === 'dealer') {
      navigate('/dealer');
    } else {
      navigate('/home');
    }
  };

  return (
    <>
      <div className="p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#1A7FC1]" />
              Register Product Warranty
            </h2>
            <p className="text-slate-500 text-sm mt-1">Select a product and register warranty for a customer</p>
          </div>

          {isLoading ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Loader2 className="w-10 h-10 text-[#1A7FC1] animate-spin mx-auto" />
              <p className="mt-4 text-slate-600">Loading available products...</p>
            </div>
          ) : availableCodes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">No available products to register</p>
              <p className="text-slate-400 text-sm">The owner needs to generate warranty codes first.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
              {/* Product Selection */}
              <div>
                <h3 className="text-slate-900 font-medium mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#1A7FC1]" />
                  Select Product
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label>Product *</Label>
                    <div className="relative mt-1">
                      <select
                        value={selectedCode?.product_name || ''}
                        onChange={(e) => handleProductSelect(e.target.value)}
                        className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 pr-10 text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]"
                        required
                      >
                        <option value="">-- Select a product --</option>
                        {productGroupsArray.map((group) => (
                          <option key={group.product_name} value={group.product_name}>
                            {group.product_name} ({group.codes.length} available)
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {selectedCode && productGroups[selectedCode.product_name]?.codes.length > 1 && (
                    <div>
                      <Label>Warranty Code *</Label>
                      <div className="relative mt-1">
                        <select
                          value={selectedCode?.id || ''}
                          onChange={(e) => handleCodeSelect(e.target.value)}
                          className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 pr-10 text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]"
                          required
                        >
                          {productGroups[selectedCode.product_name].codes.map((code) => (
                            <option key={code.id} value={code.id}>
                              {code.warranty_code} — SN: {code.serial_no || 'N/A'}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>

                {selectedCode && (
                  <div className="mt-4 bg-[#1A7FC1]/5 rounded-xl p-4 border border-[#1A7FC1]/15">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-[#1A7FC1] text-xs">Product</p>
                        <p className="text-slate-900 font-medium">{selectedCode.product_name}</p>
                      </div>
                      <div>
                        <p className="text-[#1A7FC1] text-xs">Warranty Code</p>
                        <p className="text-slate-900 font-mono">{selectedCode.warranty_code}</p>
                      </div>
                      <div>
                        <p className="text-[#1A7FC1] text-xs">Serial No.</p>
                        <p className="text-slate-900">{selectedCode.serial_no || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[#1A7FC1] text-xs">Warranty Type</p>
                        <p className="text-slate-900">{selectedCode.warranty_period_readable || `${selectedCode.warranty_days || 0} days`}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dealer Info (auto-populated, read-only) */}
              {userRole === 'dealer' && dealerInfo && (
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-slate-900 font-medium mb-3 text-sm">Dealer (auto-filled)</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <Label>Dealer Name</Label>
                      <Input value={dealerInfo.name} disabled className="h-12 rounded-xl border-slate-200 mt-1 bg-slate-50" />
                    </div>
                    <div>
                      <Label>Dealer Email</Label>
                      <Input value={dealerInfo.email} disabled className="h-12 rounded-xl border-slate-200 mt-1 bg-slate-50" />
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Details */}
              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-slate-900 font-medium mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#1A7FC1]" />
                  Customer Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter first name"
                      className="h-12 rounded-xl border-slate-200 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={customerLastName}
                      onChange={(e) => setCustomerLastName(e.target.value)}
                      placeholder="Enter last name"
                      className="h-12 rounded-xl border-slate-200 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="h-12 rounded-xl border-slate-200 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => { setCustomerEmail(e.target.value); validateEmail(e.target.value); }}
                      placeholder="Enter email address"
                      className={`h-12 rounded-xl border-slate-200 mt-1 ${emailError ? 'border-red-300 focus:ring-red-400' : ''}`}
                      required
                    />
                    {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                  </div>
                  <div>
                    <Label htmlFor="installDate">Purchase / Installation Date *</Label>
                    <Input
                      id="installDate"
                      type="date"
                      value={installationDate}
                      onChange={(e) => setInstallationDate(e.target.value)}
                      className="h-12 rounded-xl border-slate-200 mt-1"
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceNo">Invoice Number</Label>
                    <Input
                      id="invoiceNo"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="INV-2025-001"
                      className="h-12 rounded-xl border-slate-200 mt-1"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Enter customer address"
                      className="h-12 rounded-xl border-slate-200 mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Custom Fields */}
              {policyCustomFields.length > 0 && (
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-slate-900 font-medium mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#1A7FC1]" />
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {policyCustomFields.map((cf, idx) => (
                      <div key={idx}>
                        <Label htmlFor={`cf-${idx}`}>{cf.field_name}{cf.required ? ' *' : ''}</Label>
                        {cf.field_type === 'select' ? (
                          <div className="relative mt-1">
                            <select id={`cf-${idx}`}
                              value={customFieldValues[cf.field_name] || ''}
                              onChange={(e) => setCustomFieldValues(v => ({ ...v, [cf.field_name]: e.target.value }))}
                              className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 pr-10 text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]"
                              required={cf.required}>
                              <option value="">Select...</option>
                              {(Array.isArray(cf.options) ? cf.options : []).map((opt, oi) => (
                                <option key={oi} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        ) : (
                          <Input id={`cf-${idx}`}
                            type={cf.field_type === 'number' ? 'number' : cf.field_type === 'date' ? 'date' : 'text'}
                            value={customFieldValues[cf.field_name] || ''}
                            onChange={(e) => setCustomFieldValues(v => ({ ...v, [cf.field_name]: e.target.value }))}
                            placeholder={cf.field_name}
                            className="h-12 rounded-xl border-slate-200 mt-1"
                            required={cf.required} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoice Upload */}
              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-slate-900 font-medium mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#1A7FC1]" />
                  Invoice Document
                </h3>
                {!invoiceFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl hover:border-[#1A7FC1] hover:bg-[#1A7FC1]/5 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">Click to upload invoice (PDF, JPG, PNG)</p>
                    <p className="text-xs text-slate-400 mt-1">Max 5MB</p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleInvoiceChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {invoicePreview ? (
                      <img src={invoicePreview} alt="Invoice" className="w-16 h-16 rounded-lg object-cover border" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[#1A7FC1]/10 flex items-center justify-center">
                        <FileCheck className="w-6 h-6 text-[#1A7FC1]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 truncate">{invoiceFile.name}</p>
                      <p className="text-xs text-slate-400">{(invoiceFile.size / 1024).toFixed(1)} KB</p>
                      {isUploadingInvoice && <p className="text-xs text-[#1A7FC1]">Uploading...</p>}
                      {uploadedInvoiceUrl && <p className="text-xs text-green-600">Uploaded</p>}
                    </div>
                    <button type="button" onClick={handleRemoveInvoice} className="p-1.5 rounded-lg hover:bg-slate-200">
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting || isUploadingInvoice || !selectedCode}
                className="w-full h-14 bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-xl shadow-sm"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Registering...</>
                ) : (
                  <><FileCheck className="w-5 h-5 mr-2" /> Register Warranty</>
                )}
              </Button>
            </form>
          )}
        </motion.div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-white rounded-3xl p-8 shadow-2xl z-50"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-xl"
              >
                <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2} />
              </motion.div>

              <h2 className="text-slate-900 text-center text-lg font-semibold mb-2">Warranty Registered!</h2>

              <div className="bg-slate-50 rounded-2xl p-6 my-6 space-y-2">
                <p className="text-slate-600 text-center text-sm">Warranty Code</p>
                <p className="text-slate-900 text-center text-xl font-mono tracking-wider">{resultData?.warrantyCode}</p>
                {resultData?.productName && (
                  <p className="text-slate-500 text-center text-sm">{resultData.productName}</p>
                )}
              </div>

              <div className="space-y-3">
                {resultData?.pdfData && (
                  <Button
                    onClick={handleDownloadPdf}
                    className="w-full bg-[#1A7FC1] hover:bg-[#166EA8] text-white h-12 rounded-xl"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Download Certificate
                  </Button>
                )}
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-slate-200"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
