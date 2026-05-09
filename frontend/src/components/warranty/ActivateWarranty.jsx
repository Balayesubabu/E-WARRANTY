import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Loader2, AlertCircle, CheckCircle2, Package,
  User, Phone, Mail, MapPin, FileText, Calendar, Upload, X, FileCheck, Share2, LayoutDashboard,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { resolveActivationToken, checkExistingForActivation, sendWarrantyOTP, verifyWarrantyOTP, registerCustomerWarranty } from '../../services/warrantyService';
import { uploadWarrantyImage } from '../../services/dealerService';

const STEPS = { LOADING: 0, INFO: 1, OTP_SEND: 2, OTP_VERIFY: 3, REGISTER: 4, SUCCESS: 5, ERROR: -1 };

export function ActivateWarranty() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEPS.LOADING);
  const [warrantyData, setWarrantyData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [contact, setContact] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', email: '', address: '',
    city: '', state: '', country: '', invoice_number: '', date_of_installation: '',
  });
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState('');
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [uploadedInvoiceUrl, setUploadedInvoiceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    if (!token) {
      setErrorMsg('No activation token provided');
      setStep(STEPS.ERROR);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userType = user?.user_type || user?.role || '';
      if (userType === 'customer' && (user?.email || user?.phone_number)) {
        const prefill = user.email || user.phone_number || '';
        if (prefill) setContact(prefill);
      }
    } catch { /* ignore */ }

    resolveActivationToken(token)
      .then((res) => {
        const d = res?.data;
        if (!d) throw new Error('No data');
        if (d.is_registered) {
          setErrorMsg('This warranty has already been registered.');
          setStep(STEPS.ERROR);
          return;
        }
        if (d.status !== 'Inactive') {
          setErrorMsg(`This warranty code cannot be activated (status: ${d.status}).`);
          setStep(STEPS.ERROR);
          return;
        }
        setWarrantyData(d);
        setStep(STEPS.INFO);
      })
      .catch((err) => {
        setErrorMsg(err?.response?.data?.message || 'Invalid or expired activation link.');
        setStep(STEPS.ERROR);
      });
  }, [token]);

  useEffect(() => {
    if (otpResendTimer <= 0) return;
    const t = setTimeout(() => setOtpResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [otpResendTimer]);

  const handleContinueFromContact = async () => {
    if (!contact.trim()) {
      toast.error('Please enter your phone number or email');
      return;
    }
    setOtpSending(true);
    try {
      const res = await checkExistingForActivation(token, contact.trim());
      const payload = res?.data ?? res;
      const isExisting = payload?.isExistingCustomer === true;
      const profile = payload?.profile;

      if (isExisting && profile) {
        toast.success('We found your account! Your details have been pre-filled.');
        const isEmailContact = contact.includes('@');
        setForm((f) => ({
          ...f,
          first_name: profile.first_name || f.first_name,
          last_name: profile.last_name || f.last_name,
          phone: profile.phone || (isEmailContact ? '' : contact.trim()),
          email: profile.email || (isEmailContact ? contact.trim() : ''),
          address: profile.address || f.address,
          city: profile.city || f.city,
          state: profile.state || f.state,
          country: profile.country || f.country,
          invoice_number: profile.invoice_number || f.invoice_number,
        }));
        setStep(STEPS.REGISTER);
      } else {
        await sendWarrantyOTP(contact.trim(), true);
        toast.success('OTP sent! Check your phone or email.');
        setStep(STEPS.OTP_VERIFY);
        setOtpResendTimer(60);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to continue');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue.trim() || otpValue.length < 4) {
      toast.error('Enter a valid OTP');
      return;
    }
    setOtpVerifying(true);
    try {
      // Pass isActivation=true for QR code activation flow
      await verifyWarrantyOTP(contact.trim(), otpValue.trim(), true);
      toast.success('Identity verified!');
      const isEmail = contact.includes('@');
      setForm((f) => ({
        ...f,
        ...(isEmail ? { email: contact.trim() } : { phone: contact.trim() }),
      }));
      setStep(STEPS.REGISTER);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSendOtp = async () => {
    if (!contact.trim()) return;
    if (otpResendTimer > 0) return;
    setOtpSending(true);
    try {
      await sendWarrantyOTP(contact.trim(), true);
      toast.success('OTP resent! Check your phone or email.');
      setOtpResendTimer(60);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleInvoiceChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be less than 5MB'); return; }
    setInvoiceFile(file);
    setInvoicePreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : '');
    setIsUploadingInvoice(true);
    try {
      const fd = new FormData();
      fd.append('warranty_images', file);
      const res = await uploadWarrantyImage(fd);
      const urls = res?.data?.urls || res?.data?.image_urls || [];
      if (urls.length > 0) { setUploadedInvoiceUrl(urls[0]); toast.success('Invoice uploaded'); }
      else { setUploadedInvoiceUrl(''); }
    } catch { setUploadedInvoiceUrl(''); toast.error('Failed to upload invoice'); }
    finally { setIsUploadingInvoice(false); }
  };

  const handleRemoveInvoice = () => { setInvoiceFile(null); setInvoicePreview(''); setUploadedInvoiceUrl(''); };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim()) { toast.error('First name is required'); return; }
    if (!form.phone.trim() && !form.email.trim()) { toast.error('Phone or email is required'); return; }
    if (!form.date_of_installation) { toast.error('Purchase date is required'); return; }
    const today = new Date().toISOString().split('T')[0];
    if (form.date_of_installation > today) { toast.error('Purchase date cannot be in the future'); return; }

    const policyCustomFields = warrantyData?.custom_fields || [];
    for (const cf of policyCustomFields) {
      if (cf.required && !customFieldValues[cf.field_name]?.trim()) {
        toast.error(`${cf.field_name} is required`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        provider_id: warrantyData.provider_id,
        warranty_code: warrantyData.warranty_code,
        product_name: warrantyData.product_name,
        product_id: warrantyData.product_id || '',
        serial_number: warrantyData.serial_no || '',
        service_id: warrantyData.service_id || '',
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        invoice_number: form.invoice_number.trim(),
        date_of_installation: form.date_of_installation,
        is_active: true,
        vehicle_number: '',
        vehicle_chassis_number: '',
        warranty_image_url: uploadedInvoiceUrl || '',
        custom_value1: '',
        custom_value2: '',
        custom_field_values: Object.keys(customFieldValues).length > 0 ? customFieldValues : null,
        is_customer: true,
        is_provider: false,
        is_dealer: false,
      };

      if (warrantyData.assigned_dealer) {
        payload.dealer_name = warrantyData.assigned_dealer.name;
        payload.dealer_email = warrantyData.assigned_dealer.email;
      }

      const res = await registerCustomerWarranty(payload);
      const pdfData = res?.data?.finalString;
      const hasAccount = res?.data?.has_account || res?.data?.can_access_dashboard;
      const accountCreated = res?.data?.account_created;
      
      if (pdfData) {
        try {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${pdfData}`;
          link.download = `warranty-certificate-${form.first_name}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch {}
      }
      setResultData({ 
        warrantyCode: warrantyData.warranty_code, 
        productName: warrantyData.product_name, 
        pdfData,
        hasAccount,
        accountCreated
      });
      setStep(STEPS.SUCCESS);
      toast.success('Warranty registered successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to register warranty');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!resultData?.pdfData) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${resultData.pdfData}`;
    link.download = `warranty-certificate.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Certificate downloaded!');
  };

  // ── LOADING ──
  if (step === STEPS.LOADING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#1A7FC1] animate-spin mx-auto" />
          <p className="mt-4 text-slate-600">Verifying warranty...</p>
        </div>
      </div>
    );
  }

  // ── ERROR ──
  if (step === STEPS.ERROR) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Unable to Activate</h2>
          <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
          <Button onClick={() => navigate('/')} variant="outline" className="rounded-xl">Go to Home</Button>
        </motion.div>
      </div>
    );
  }

  // ── SUCCESS ──
  if (step === STEPS.SUCCESS) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-lg font-semibold text-slate-900 text-center mb-2">Warranty Activated!</h2>
          <div className="bg-slate-50 rounded-2xl p-5 my-5 space-y-1 text-center">
            <p className="text-slate-500 text-sm">Warranty Code</p>
            <p className="text-xl font-mono text-slate-900 tracking-wider">{resultData?.warrantyCode}</p>
            {resultData?.productName && <p className="text-slate-500 text-sm">{resultData.productName}</p>}
          </div>
          
          {/* Account created notice */}
          {resultData?.hasAccount && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-800 text-center">
                {resultData?.accountCreated 
                  ? "Your account has been created! You can now access your dashboard."
                  : "You can access your dashboard to view all your warranties."}
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            {resultData?.pdfData && (
              <Button onClick={handleDownloadPdf} className="w-full bg-[#1A7FC1] hover:bg-[#166EA8] text-white h-12 rounded-xl">
                <Share2 className="w-5 h-5 mr-2" /> Download Certificate
              </Button>
            )}
            
            {/* Go to Dashboard button - only shown if account exists */}
            {resultData?.hasAccount && (
              <Button 
                onClick={() => navigate('/customer-auth')} 
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-xl"
              >
                <LayoutDashboard className="w-5 h-5 mr-2" /> Go to Dashboard
              </Button>
            )}
            
            <Button onClick={() => navigate('/')} variant="outline" className="w-full h-12 rounded-xl border-slate-200">Done</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── MAIN CONTENT (INFO → OTP → REGISTER) ──
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          {warrantyData?.provider_logo && (
            <img src={warrantyData.provider_logo} alt="" className="h-12 mx-auto mb-3 object-contain" />
          )}
          <h1 className="text-xl font-bold text-slate-900">{warrantyData?.provider_name}</h1>
          <p className="text-slate-500 text-sm mt-1">Product Warranty Activation</p>
        </div>

        {/* Product Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1A7FC1]/10 flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-[#1A7FC1]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-slate-900 font-semibold">{warrantyData?.product_name}</h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-400">Serial No.</span><p className="text-slate-700 font-medium">{warrantyData?.serial_no || 'N/A'}</p></div>
                <div><span className="text-slate-400">Warranty</span><p className="text-slate-700 font-medium">{warrantyData?.warranty_period_readable || `${warrantyData?.warranty_days} days`}</p></div>
                {warrantyData?.assigned_dealer && (
                  <div className="col-span-2"><span className="text-slate-400">Authorized Dealer</span><p className="text-slate-700 font-medium">{warrantyData.assigned_dealer.name}</p></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-2">
          {['Verify', 'OTP', 'Register'].map((label, idx) => {
            const stepIdx = idx + 1;
            const active = (step === STEPS.INFO && idx === 0) || (step === STEPS.OTP_SEND && idx === 0) || (step === STEPS.OTP_VERIFY && idx === 1) || (step === STEPS.REGISTER && idx === 2);
            const done = (step > STEPS.INFO + idx) && step !== STEPS.OTP_SEND;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-green-500 text-white' : active ? 'bg-[#1A7FC1] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : stepIdx}
                </div>
                <span className={`text-xs ${active ? 'text-[#1A7FC1] font-semibold' : 'text-slate-400'}`}>{label}</span>
                {idx < 2 && <div className="w-8 h-px bg-slate-200" />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* STEP: INFO / OTP_SEND */}
          {(step === STEPS.INFO || step === STEPS.OTP_SEND) && (
            <motion.div key="otp-send" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-[#1A7FC1]" />
                <h3 className="text-slate-900 font-semibold">Verify Your Identity</h3>
              </div>
              <p className="text-slate-500 text-sm">Enter your phone number or email. If you&apos;ve registered before, we&apos;ll pre-fill your details and skip OTP.</p>
              <div>
                <Label htmlFor="contact">Phone Number or Email *</Label>
                <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. you@email.com" className="h-12 rounded-xl border-slate-200 mt-1" />
              </div>
              <Button onClick={handleContinueFromContact} disabled={otpSending} className="w-full h-12 bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-xl">
                {otpSending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</> : 'Continue'}
              </Button>
            </motion.div>
          )}

          {/* STEP: OTP_VERIFY */}
          {step === STEPS.OTP_VERIFY && (
            <motion.div key="otp-verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-[#1A7FC1]" />
                <h3 className="text-slate-900 font-semibold">Enter OTP</h3>
              </div>
              <p className="text-slate-500 text-sm">We sent a code to <strong>{contact}</strong></p>
              <div>
                <Label htmlFor="otp">One-Time Password *</Label>
                <Input id="otp" value={otpValue} onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP" maxLength={6} className="h-12 rounded-xl border-slate-200 mt-1 text-center text-lg tracking-[0.3em] font-mono" />
              </div>
              <Button onClick={handleVerifyOtp} disabled={otpVerifying} className="w-full h-12 bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-xl">
                {otpVerifying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : 'Verify OTP'}
              </Button>
              <div className="text-center">
                {otpResendTimer > 0 ? (
                  <p className="text-xs text-slate-400">Resend OTP in {otpResendTimer}s</p>
                ) : (
                  <button onClick={handleSendOtp} disabled={otpSending} className="text-xs text-[#1A7FC1] hover:underline">Resend OTP</button>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP: REGISTER */}
          {step === STEPS.REGISTER && (
            <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-[#1A7FC1]" />
                  <h3 className="text-slate-900 font-semibold">Customer Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fn">First Name *</Label>
                    <Input id="fn" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                      placeholder="First name" className="h-11 rounded-xl border-slate-200 mt-1" required />
                  </div>
                  <div>
                    <Label htmlFor="ln">Last Name</Label>
                    <Input id="ln" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                      placeholder="Last name" className="h-11 rounded-xl border-slate-200 mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="ph">Phone</Label>
                    <Input id="ph" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="Phone number (or use email)" className="h-11 rounded-xl border-slate-200 mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="em">Email</Label>
                    <Input id="em" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="Email address" className="h-11 rounded-xl border-slate-200 mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="instDate">Purchase / Installation Date *</Label>
                    <Input id="instDate" type="date" value={form.date_of_installation}
                      onChange={(e) => setForm((f) => ({ ...f, date_of_installation: e.target.value }))}
                      className="h-11 rounded-xl border-slate-200 mt-1" required max={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <Label htmlFor="inv">Invoice Number</Label>
                    <Input id="inv" value={form.invoice_number} onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))}
                      placeholder="INV-2026-001" className="h-11 rounded-xl border-slate-200 mt-1" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="addr">Address</Label>
                    <Input id="addr" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="Full address" className="h-11 rounded-xl border-slate-200 mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="City" className="h-11 rounded-xl border-slate-200 mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="st">State</Label>
                    <Input id="st" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                      placeholder="State" className="h-11 rounded-xl border-slate-200 mt-1" />
                  </div>
                </div>

                {/* Dynamic Custom Fields */}
                {warrantyData?.custom_fields?.length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <Label className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-[#1A7FC1]" /> Additional Information</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {warrantyData.custom_fields.map((cf, idx) => (
                        <div key={idx}>
                          <Label htmlFor={`cf-${idx}`}>{cf.field_name}{cf.required ? ' *' : ''}</Label>
                          {cf.field_type === 'select' ? (
                            <select id={`cf-${idx}`}
                              value={customFieldValues[cf.field_name] || ''}
                              onChange={(e) => setCustomFieldValues(v => ({ ...v, [cf.field_name]: e.target.value }))}
                              className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1] bg-white mt-1"
                              required={cf.required}>
                              <option value="">Select...</option>
                              {(Array.isArray(cf.options) ? cf.options : []).map((opt, oi) => (
                                <option key={oi} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <Input id={`cf-${idx}`}
                              type={cf.field_type === 'number' ? 'number' : cf.field_type === 'date' ? 'date' : 'text'}
                              value={customFieldValues[cf.field_name] || ''}
                              onChange={(e) => setCustomFieldValues(v => ({ ...v, [cf.field_name]: e.target.value }))}
                              placeholder={cf.field_name}
                              className="h-11 rounded-xl border-slate-200 mt-1"
                              required={cf.required} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Invoice Upload */}
                <div className="border-t border-slate-100 pt-4">
                  <Label className="flex items-center gap-2 mb-3"><Upload className="w-4 h-4 text-[#1A7FC1]" /> Invoice Document (optional)</Label>
                  {!invoiceFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl hover:border-[#1A7FC1] hover:bg-[#1A7FC1]/5 transition-colors cursor-pointer">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <p className="text-xs text-slate-500">Click to upload (PDF, JPG, PNG — max 5MB)</p>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleInvoiceChange} className="hidden" />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      {invoicePreview ? <img src={invoicePreview} alt="" className="w-14 h-14 rounded-lg object-cover border" />
                        : <div className="w-14 h-14 rounded-lg bg-[#1A7FC1]/10 flex items-center justify-center"><FileCheck className="w-5 h-5 text-[#1A7FC1]" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 truncate">{invoiceFile.name}</p>
                        {isUploadingInvoice && <p className="text-xs text-[#1A7FC1]">Uploading...</p>}
                        {uploadedInvoiceUrl && <p className="text-xs text-green-600">Uploaded</p>}
                      </div>
                      <button type="button" onClick={handleRemoveInvoice} className="p-1 rounded-lg hover:bg-slate-200"><X className="w-4 h-4 text-slate-500" /></button>
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={isSubmitting || isUploadingInvoice}
                  className="w-full h-12 bg-[#1A7FC1] hover:bg-[#166EA8] text-white rounded-xl shadow-sm">
                  {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Registering...</> : <><Shield className="w-5 h-5 mr-2" /> Activate Warranty</>}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terms */}
        {warrantyData?.terms_and_conditions?.length > 0 && step !== STEPS.SUCCESS && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h4 className="text-xs font-semibold text-slate-600 mb-2">Terms & Conditions</h4>
            <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
              {warrantyData.terms_and_conditions.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            {warrantyData.terms_and_conditions_link && (
              <a href={warrantyData.terms_and_conditions_link} target="_blank" rel="noreferrer" className="text-xs text-[#1A7FC1] hover:underline mt-2 inline-block">View Full Terms</a>
            )}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 pb-4">Powered by E-Warrantify</p>
      </motion.div>
    </div>
  );
}
