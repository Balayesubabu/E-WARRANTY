import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Upload, Package, Store, FileText, Loader2, ChevronDown, Shield, CheckCircle2, Hash, X, UserPlus, QrCode, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AnimatedDiv } from '../ui/animated-div';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAllProviderNames, getAvailableWarrantyCodesByDealer, getDealersByProviderId, registerCustomerWarranty, lookupWarrantyCodeForRegistration, lookupByProductSerial } from '../../services/warrantyService';
import { QRScannerModal } from './QRScannerModal';

export function CustomerSelfRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detect if user is logged in as customer/owner (for navigation - guests go to /, logged-in go to /home)
  const isLoggedInCustomer = useCallback(() => {
    try {
      const token = localStorage.getItem('token') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const type = user?.user_type || user?.role || '';
      return !!token && ['customer', 'owner', 'provider'].includes(type);
    } catch { return false; }
  }, []);
  const [showSuccess, setShowSuccess] = useState(false);
  const [resultData, setResultData] = useState(null);

  // Step 1: Provider (company) selection
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isCustomer, setIsCustomer] = useState(true); // Default to customer, will be updated based on role
  const [showManualSelection, setShowManualSelection] = useState(false); // For customers who want manual selection

  // Step 2: Dealer selection
  const [dealers, setDealers] = useState([]);
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);

  // Step 3: Product selection
  const [availableCodes, setAvailableCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);

  // Warranty code lookup (when QR doesn't work)
  const [warrantyCodeInput, setWarrantyCodeInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookedUpData, setLookedUpData] = useState(null);

  // Product + Serial search (fallback when can't scan or read code)
  const [productNameInput, setProductNameInput] = useState('');
  const [serialNumberInput, setSerialNumberInput] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // QR scanner modal
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Customer details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isPhoneLocked, setIsPhoneLocked] = useState(false);
  const [isEmailLocked, setIsEmailLocked] = useState(false);
  const [address, setAddress] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);

  // Pre-fill customer details from localStorage (skip temp_ placeholders so user can enter real phone)
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      // Name: backend stores first_name/last_name (e.g. customer login); some flows use fullname
      if (storedUser?.fullname) {
        const parts = storedUser.fullname.trim().split(/\s+/);
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      } else if (storedUser?.first_name != null || storedUser?.last_name != null) {
        setFirstName(storedUser.first_name ?? '');
        setLastName(storedUser.last_name ?? '');
      }
      const storedPhone = storedUser?.phone_number ?? storedUser?.phone;
      const isRealPhone = storedPhone && typeof storedPhone === 'string' && !storedPhone.startsWith('temp_');
      if (isRealPhone) {
        setPhone(storedPhone);
        setIsPhoneLocked(true);
      }
      const storedEmail = storedUser?.email;
      const isRealEmail = storedEmail && typeof storedEmail === 'string' && !storedEmail.startsWith('temp_');
      if (isRealEmail) {
        setEmail(storedEmail);
        setIsEmailLocked(true);
      }
    } catch { /* ignore */ }
  }, []);

  // Detect user role and set up accordingly
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const franchise = JSON.parse(localStorage.getItem('franchise') || '{}');
      const userType = storedUser?.user_type || storedUser?.role || '';

      // Check if user is owner/provider/staff/dealer - they get full manual selection
      if (userType === 'owner' || userType === 'provider' || userType === 'staff' || userType === 'dealer') {
        setIsCustomer(false);
        setShowManualSelection(true); // Show dropdowns for non-customers
        
        if (userType === 'owner' || userType === 'provider') {
          const pid = franchise?.provider_id || franchise?.id || '';
          if (pid) {
            setSelectedProviderId(pid);
            setIsOwner(true);
            setLoadingProviders(false);
            return;
          }
        }
      } else {
        // Customer - show simplified flow (warranty code lookup only)
        setIsCustomer(true);
        setShowManualSelection(false);
        setLoadingProviders(false);
        return; // Don't fetch providers for customers
      }
    } catch { /* ignore */ }

    // Only fetch providers for non-customer users who need manual selection
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const response = await getAllProviderNames();
        const providerList = response?.data || [];
        setProviders(Array.isArray(providerList) ? providerList : []);
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchProviders();
  }, []);

  // Fetch providers when customer opts for manual selection
  useEffect(() => {
    if (!showManualSelection || !isCustomer || providers.length > 0) return;
    
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const response = await getAllProviderNames();
        const providerList = response?.data || [];
        setProviders(Array.isArray(providerList) ? providerList : []);
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchProviders();
  }, [showManualSelection, isCustomer, providers.length]);

  // Fetch dealers when provider is selected
  useEffect(() => {
    if (!selectedProviderId) {
      setDealers([]);
      setSelectedDealer(null);
      setAvailableCodes([]);
      setSelectedCode(null);
      return;
    }

    const fetchDealers = async () => {
      setLoadingDealers(true);
      setSelectedDealer(null);
      setAvailableCodes([]);
      setSelectedCode(null);
      try {
        const response = await getDealersByProviderId(selectedProviderId);
        const dealerList = response?.data || [];
        setDealers(Array.isArray(dealerList) ? dealerList.filter(d => d.is_active !== false) : []);
      } catch (error) {
        console.error('Error fetching dealers:', error);
        setDealers([]);
      } finally {
        setLoadingDealers(false);
      }
    };
    fetchDealers();
  }, [selectedProviderId]);

  // Fetch available warranty codes when dealer is selected
  useEffect(() => {
    if (!selectedProviderId || !selectedDealer?.id) {
      setAvailableCodes([]);
      setSelectedCode(null);
      return;
    }

    const fetchCodes = async () => {
      setLoadingCodes(true);
      setSelectedCode(null);
      try {
        const response = await getAvailableWarrantyCodesByDealer(selectedProviderId, selectedDealer.id);
        const codes = response?.data?.warranty_codes || [];
        setAvailableCodes(Array.isArray(codes) ? codes : []);
      } catch (error) {
        console.error('Error fetching warranty codes:', error);
        setAvailableCodes([]);
      } finally {
        setLoadingCodes(false);
      }
    };
    fetchCodes();
  }, [selectedProviderId, selectedDealer?.id]);

  // Group available codes by product_name
  const productGroups = availableCodes.reduce((groups, code) => {
    const key = code.product_name || 'Unknown Product';
    if (!groups[key]) {
      groups[key] = { product_name: key, codes: [] };
    }
    groups[key].codes.push(code);
    return groups;
  }, {});
  const productGroupsArray = Object.values(productGroups);

  const handleDealerSelect = (dealerId) => {
    const dealer = dealers.find(d => d.id === dealerId);
    setSelectedDealer(dealer || null);
  };

  const handleProductSelect = (productName) => {
    const group = productGroups[productName];
    if (group && group.codes.length > 0) {
      setSelectedCode(group.codes[0]);
    } else {
      setSelectedCode(null);
    }
  };

  const handleCodeSelect = (codeId) => {
    const code = availableCodes.find(c => c.id === codeId);
    if (code) setSelectedCode(code);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setInvoiceFile(file);
      toast.success('Invoice uploaded');
    }
  };

  const handleLookupCode = async () => {
    const code = warrantyCodeInput.trim();
    if (!code) {
      setLookupError('Please enter your warranty code');
      return;
    }
    setLookupError('');
    setLookupLoading(true);
    try {
      const response = await lookupWarrantyCodeForRegistration(code);
      const data = response?.data;
      if (data) {
        setLookedUpData(data);
        toast.success('Warranty code found! Please fill in your details below.', { duration: 2500 });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Warranty code not found or not eligible for registration';
      setLookupError(msg);
      setLookedUpData(null);
      toast.error(msg);
    } finally {
      setLookupLoading(false);
    }
  };

  const clearLookedUpData = () => {
    setLookedUpData(null);
    setWarrantyCodeInput('');
    setLookupError('');
    setProductNameInput('');
    setSerialNumberInput('');
    setSearchError('');
  };

  const handleSearchByProductSerial = async () => {
    const pn = productNameInput.trim();
    const sn = serialNumberInput.trim();
    if (!pn && !sn) {
      setSearchError('Enter product name or serial number');
      return;
    }
    setSearchError('');
    setSearchLoading(true);
    try {
      const response = await lookupByProductSerial(pn || undefined, sn || undefined);
      const data = response?.data;
      if (data) {
        setLookedUpData(data);
        setLookupError('');
        toast.success('Product found! Please fill in your details below.', { duration: 2500 });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'No matching product found. Check product name and serial number.';
      setSearchError(msg);
      setLookedUpData(null);
      toast.error(msg);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleScanQR = () => {
    setShowQRScanner(true);
  };

  const handleQRScanSuccess = (token) => {
    setShowQRScanner(false);
    navigate(`/activate/${token}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Resolve provider, dealer, and code from either lookedUpData or manual selection
    const providerId = lookedUpData?.provider_id || selectedProviderId;
    const dealer = lookedUpData?.assigned_dealer || selectedDealer;
    const codeData = lookedUpData || selectedCode;

    if (!dealer) {
      toast.error(lookedUpData ? 'Invalid lookup data' : 'Please select a dealer');
      return;
    }
    if (!codeData) {
      toast.error(lookedUpData ? 'Invalid lookup data' : 'Please select a product');
      return;
    }
    if (!firstName || !phone || !purchaseDate) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        provider_id: providerId,
        is_provider: false,
        is_dealer: false,
        is_customer: true,
        dealer_name: dealer.name,
        dealer_email: dealer.email,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        email: email,
        address: address,
        city: '',
        state: '',
        country: '',
        invoice_number: invoiceNumber,
        product_name: codeData.product_name,
        product_id: codeData.product_id || '',
        serial_number: codeData.serial_no || '',
        service_id: codeData.service_id || '',
        warranty_code: codeData.warranty_code,
        date_of_installation: purchaseDate,
        is_active: false, // Pending approval for customer registrations
        vehicle_number: '',
        vehicle_chassis_number: '',
        warranty_image_url: '',
        custom_value1: '',
        custom_value2: '',
      };

      const response = await registerCustomerWarranty(payload);

      setResultData({
        warrantyCode: codeData.warranty_code,
        productName: codeData.product_name,
        dealerName: dealer.name,
      });
      setShowSuccess(true);
      toast.success('Registration request submitted!');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to submit registration';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowSuccess(false);
    navigate(isLoggedInCustomer() ? '/home' : '/');
  };

  const handleBack = () => {
    const from = location.state?.from;
    if (from && from !== '/customer-register') {
      navigate(from);
    } else {
      navigate(isLoggedInCustomer() ? '/home' : '/');
    }
  };

  return (
    <>
      <QRScannerModal
        open={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={handleQRScanSuccess}
      />
      <div className="min-h-screen pb-24 sm:pb-20 bg-slate-50">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1A7FC1] to-[#0F4E78] pt-12 pb-16 px-6 lg:px-8 rounded-b-[2rem] shadow-xl">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div>
              <h2 className="text-white mb-2">Register Your Product</h2>
              <p className="text-blue-100">
                {lookedUpData 
                  ? 'Product found! Fill in your details to complete registration' 
                  : isCustomer 
                    ? 'Scan QR, enter warranty code, or search by product and serial'
                    : 'Enter warranty code or manually select dealer & product'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <AnimatedDiv
          variant="fadeInUp"
          className="max-w-4xl mx-auto px-6 lg:px-8 -mt-8"
        >
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 lg:p-8 shadow-md space-y-6">
            
            {/* Customer flow: Scan QR → Warranty code → Product+Serial */}
            {!lookedUpData && isCustomer && (
              <div className="space-y-8">
                {/* 1. Scan QR Code - Primary action */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 rounded-xl p-6 border border-blue-100/50">
                  <Button
                    type="button"
                    onClick={handleScanQR}
                    className="w-full h-14 bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-xl font-semibold flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <QrCode className="w-5 h-5" strokeWidth={2.5} />
                    Scan QR Code
                  </Button>
                </div>

                {/* OR divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-slate-500 text-sm font-medium">OR</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* 2. Enter Warranty Code */}
                <div>
                  <Label htmlFor="warrantyCode" className="text-slate-800 font-medium">
                    Enter Warranty Code
                  </Label>
                  <div className="flex gap-3 flex-wrap mt-2">
                    <Input
                      id="warrantyCode"
                      value={warrantyCodeInput}
                      onChange={(e) => { setWarrantyCodeInput(e.target.value.toUpperCase()); setLookupError(''); }}
                      placeholder="Example: WR1COH3EON"
                      className="flex-1 min-w-[200px] h-12 rounded-xl border-slate-200 font-mono text-base tracking-wider"
                      disabled={lookupLoading}
                    />
                    <Button
                      type="button"
                      onClick={handleLookupCode}
                      disabled={lookupLoading || !warrantyCodeInput.trim()}
                      className="h-12 px-6 bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-xl font-medium"
                    >
                      {lookupLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : 'Register Product'}
                    </Button>
                  </div>
                  {lookupError && (
                    <p className="text-red-600 text-sm mt-2">{lookupError}</p>
                  )}
                </div>

                {/* 3. Can't scan? Search by product details */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-slate-800 font-medium mb-1">Can&apos;t scan the code?</h4>
                  <p className="text-slate-500 text-sm mb-4">Search using the product name and serial number</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label htmlFor="productName" className="text-slate-600">Product Name</Label>
                      <Input
                        id="productName"
                        value={productNameInput}
                        onChange={(e) => { setProductNameInput(e.target.value); setSearchError(''); }}
                        placeholder="Enter product name"
                        className="h-12 rounded-xl border-slate-200 mt-1"
                        disabled={searchLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="serialNumber" className="text-slate-600">Serial Number</Label>
                      <Input
                        id="serialNumber"
                        value={serialNumberInput}
                        onChange={(e) => { setSerialNumberInput(e.target.value); setSearchError(''); }}
                        placeholder="Enter serial number"
                        className="h-12 rounded-xl border-slate-200 font-mono mt-1"
                        disabled={searchLoading}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleSearchByProductSerial}
                    disabled={searchLoading || (!productNameInput.trim() && !serialNumberInput.trim())}
                    variant="secondary"
                    className="h-12 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                  >
                    {searchLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching...</> : <><Search className="w-4 h-4 mr-2" /> Find Product</>}
                  </Button>
                  {searchError && (
                    <p className="text-red-600 text-sm mt-2">{searchError}</p>
                  )}
                </div>
              </div>
            )}

            {/* Non-customer flow: Warranty code lookup + manual selection */}
            {!lookedUpData && !isCustomer && (
              <div className="rounded-xl p-5 border bg-slate-50 border-slate-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A7FC1] to-[#0F4E78] flex items-center justify-center shadow-lg">
                    <Hash className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-slate-900 text-lg font-semibold text-center mb-2">Quick Lookup by Warranty Code</h3>
                <p className="text-slate-500 text-sm text-center mb-4">Enter warranty code or manually select dealer &amp; product</p>
                <div className="flex gap-3 flex-wrap max-w-md mx-auto">
                  <Input
                    value={warrantyCodeInput}
                    onChange={(e) => { setWarrantyCodeInput(e.target.value.toUpperCase()); setLookupError(''); }}
                    placeholder="e.g. WRMKOT0YMA"
                    className="flex-1 min-w-[180px] h-12 rounded-xl border-slate-200 text-center font-mono text-lg tracking-wider"
                    disabled={lookupLoading}
                  />
                  <Button
                    type="button"
                    onClick={handleLookupCode}
                    disabled={lookupLoading || !warrantyCodeInput.trim()}
                    className="h-12 px-8 bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-xl"
                  >
                    {lookupLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Looking up...</> : 'Lookup'}
                  </Button>
                </div>
                {lookupError && (
                  <p className="text-red-600 text-sm mt-3 text-center">{lookupError}</p>
                )}
              </div>
            )}

            {/* When looked up successfully - show product card and "use different method" */}
            {lookedUpData && (
              <div className="border-b border-slate-100 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0 bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="text-[#1A7FC1] text-xs">Products</p>
                        <p className="text-blue-900 font-medium break-words">{lookedUpData.product_name}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#1A7FC1] text-xs">Warranty Code</p>
                        <p className="text-blue-900 font-mono break-all">{lookedUpData.warranty_code}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#1A7FC1] text-xs">Serial No.</p>
                        <p className="text-blue-900 font-mono break-all">{lookedUpData.serial_no || 'N/A'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#1A7FC1] text-xs">Dealer</p>
                        <p className="text-blue-900 break-words">{lookedUpData.assigned_dealer?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearLookedUpData}
                    className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1 shrink-0"
                  >
                    <X className="w-4 h-4" /> Use different method
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Company Selection (for non-customers only: owner, dealer, staff) */}
            {!lookedUpData && !isOwner && showManualSelection && (
              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-900 flex items-center gap-2">
                    <Store className="w-5 h-5 text-[#1A7FC1]" />
                    Select Company
                  </h3>
                  {isCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowManualSelection(false);
                        setSelectedProviderId('');
                        setSelectedDealer(null);
                        setSelectedCode(null);
                      }}
                      className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
                    >
                      <X className="w-4 h-4" /> Use warranty code instead
                    </button>
                  )}
                </div>
                {loadingProviders ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading companies...
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedProviderId}
                      onChange={(e) => setSelectedProviderId(e.target.value)}
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 pr-10 text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]"
                      required
                    >
                      <option value="">-- Select a company --</option>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.company_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Dealer Selection (manual flow only, require showManualSelection for customers) */}
            {!lookedUpData && selectedProviderId && showManualSelection && (
              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-slate-900 mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#1A7FC1]" />
                  Select Dealer
                </h3>
                {loadingDealers ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading dealers...
                  </div>
                ) : dealers.length === 0 ? (
                  <p className="text-slate-400 text-sm py-2">No dealers found for this company.</p>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedDealer?.id || ''}
                      onChange={(e) => handleDealerSelect(e.target.value)}
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 pr-10 text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]"
                      required
                    >
                      <option value="">-- Select a dealer --</option>
                      {dealers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.city ? `(${d.city})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Product Selection (manual flow only, require showManualSelection) */}
            {!lookedUpData && selectedDealer && showManualSelection && (
              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#1A7FC1]" />
                  Select Product
                </h3>
                {loadingCodes ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading products...
                  </div>
                ) : productGroupsArray.length === 0 ? (
                  <p className="text-slate-400 text-sm py-2">No products available for registration.</p>
                ) : (
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
                )}

                {/* Selected product info */}
                {selectedCode && (
                  <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="text-[#1A7FC1] text-xs">Product</p>
                        <p className="text-blue-900 font-medium break-words">{selectedCode.product_name}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#1A7FC1] text-xs">Warranty Code</p>
                        <p className="text-blue-900 font-mono break-all">{selectedCode.warranty_code}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#1A7FC1] text-xs">Serial No.</p>
                        <p className="text-blue-900 font-mono break-all">{selectedCode.serial_no || 'N/A'}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#1A7FC1] text-xs">Warranty Period</p>
                        <p className="text-blue-900">{selectedCode.warranty_period_readable || `${selectedCode.warranty_days} days`}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Customer Details */}
            {(selectedCode || lookedUpData) && (
              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-slate-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#1A7FC1]" />
                  Your Details
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      className="h-12 rounded-xl border-slate-200 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                      className="h-12 rounded-xl border-slate-200 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="h-12 rounded-xl border-slate-200 mt-1"
                      readOnly={isPhoneLocked}
                      required
                    />
                    {isPhoneLocked && (
                      <p className="text-slate-400 text-xs mt-1">Using phone from your account profile</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="h-12 rounded-xl border-slate-200 mt-1"
                      readOnly={isEmailLocked}
                    />
                    {isEmailLocked && (
                      <p className="text-slate-400 text-xs mt-1">Using email from your account profile</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="purchaseDate">Purchase Date *</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="h-12 rounded-xl border-slate-200 mt-1"
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoiceNo">Invoice Number (Optional)</Label>
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
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your address"
                      className="h-12 rounded-xl border-slate-200 mt-1"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Label htmlFor="invoice">Upload Invoice (Optional)</Label>
                    <div className="mt-1">
                      <label
                        htmlFor="invoice"
                        className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-slate-200 rounded-xl hover:border-cyan-300 transition-colors cursor-pointer"
                      >
                        {invoiceFile ? (
                          <div className="text-center">
                            <FileText className="w-6 h-6 text-cyan-600 mx-auto mb-1" />
                            <p className="text-slate-900 text-sm">{invoiceFile.name}</p>
                            <p className="text-slate-400 text-xs">{(invoiceFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                            <p className="text-slate-600 text-sm">Upload invoice</p>
                            <p className="text-slate-400 text-xs">PDF, JPG or PNG (Max 5MB)</p>
                          </div>
                        )}
                      </label>
                      <input
                        id="invoice"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            {(selectedCode || lookedUpData) && (
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 bg-gradient-to-r from-[#3A9FE1] to-[#1A7FC1] hover:from-[#1A7FC1] hover:to-[#0F4E78] text-white rounded-xl shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Registration Request'
                  )}
                </Button>
                
                <p className="text-slate-500 text-xs text-center mt-3">
                  Your request will be reviewed by the dealer within 24-48 hours
                </p>
              </div>
            )}
          </form>
        </AnimatedDiv>
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

              <h2 className="text-slate-900 text-center mb-2">
                Registration Submitted!
              </h2>
              {/* <p className="text-slate-500 text-center text-sm mb-4">
                Waiting for dealer approval
              </p> */}
              
              <div className="bg-slate-50 rounded-2xl p-6 my-4 space-y-2">
                <div className="text-center">
                  <p className="text-slate-500 text-xs">Product</p>
                  <p className="text-slate-900 font-medium">{resultData?.productName}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs">Warranty Code</p>
                  <p className="text-slate-900 font-mono tracking-wider">{resultData?.warrantyCode}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs">Dealer</p>
                  <p className="text-slate-900">{resultData?.dealerName}</p>
                </div>
              </div>

              {!isLoggedInCustomer() && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-slate-700 text-sm text-center mb-3">
                    Create an account to track your warranties, view certificates, and file claims easily.
                  </p>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowSuccess(false);
                      navigate('/customer-auth', { state: { from: '/customer-register' } });
                    }}
                    variant="outline"
                    className="w-full border-[#1A7FC1] text-[#1A7FC1] hover:bg-[#1A7FC1] hover:text-white h-11 rounded-xl"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Account
                  </Button>
                </div>
              )}

              <Button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-[#3A9FE1] to-[#1A7FC1] hover:from-[#1A7FC1] hover:to-[#0F4E78] text-white h-12 rounded-xl"
              >
                {isLoggedInCustomer() ? 'Go to Dashboard' : 'Done'}
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
