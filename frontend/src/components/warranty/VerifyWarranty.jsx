import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Shield, Mail, Phone, Loader2, CheckCircle2,
  XCircle, ArrowRight, RefreshCw, KeyRound, Package, Building2,
  Calendar, Clock, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { verifyByWarrantyCode, sendWarrantyOTP, verifyWarrantyOTP } from '../../services/warrantyService';



export function VerifyWarranty() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();


  // Verify by code (primary)
  const [mode, setMode] = useState('code'); // code | contact
  const [codeInput, setCodeInput] = useState('');
  const [codeResult, setCodeResult] = useState(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');

  // Verify by contact (secondary OTP flow)
  const [step, setStep] = useState('contact'); // contact | otp
  const [contact, setContact] = useState('');
  const [contactType, setContactType] = useState(null);
  const [maskedContact, setMaskedContact] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');

  const otpRefs = useRef([]);

  const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isPhone = (value) => /^\d{10,15}$/.test(value.replace(/[\s\-+()]/g, ''));

  // Auto-verify from URL params (?code= or ?productId=)
  useEffect(() => {
    const urlCode = searchParams.get('code') || searchParams.get('productId');
    if (urlCode?.trim()) {
      setCodeInput(urlCode.trim());
      setMode('code');
      setCodeResult(null);
      setCodeError('');
      setCodeLoading(true);
      verifyByWarrantyCode(urlCode.trim())
        .then((res) => {
          const data = res?.data || res;
          setCodeResult(data);
          toast.success('Warranty verified');
        })
        .catch((err) => {
          const msg = err?.response?.data?.message || 'Warranty code not found. Please check and try again.';
          setCodeError(msg);
        })
        .finally(() => setCodeLoading(false));
    }
  }, [searchParams]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleVerifyCode = async (codeToVerify) => {
    const c = (codeToVerify ?? codeInput).trim();
    if (!c) {
      setCodeError('Please enter a warranty code');
      return;
    }
    setCodeError('');
    setCodeResult(null);
    setCodeLoading(true);
    try {
      const res = await verifyByWarrantyCode(c);
      const data = res?.data || res;
      setCodeResult(data);
      toast.success('Warranty verified');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Warranty code not found. Please check and try again.';
      setCodeError(msg);
      setCodeResult(null);
    } finally {
      setCodeLoading(false);
    }
  };

  const resetCodeView = () => {
    setCodeResult(null);
    setCodeError('');
    setCodeInput('');
  };

  const detectContactType = (value) => {
    const cleaned = value.trim();
    if (isEmail(cleaned)) return 'email';
    if (isPhone(cleaned)) return 'phone';
    return null;
  };

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const cleaned = contact.trim();
    if (!cleaned) {
      setError('Please enter your email or phone number');
      return;
    }
    const type = detectContactType(cleaned);
    if (!type) {
      setError('Please enter a valid email address or phone number');
      return;
    }
    setContactType(type);
    setLoading(true);
    try {
      const response = await sendWarrantyOTP(cleaned);
      setMaskedContact(response?.data?.masked_contact || cleaned);
      setStep('otp');
      setResendTimer(60);
      toast.success(`OTP sent to your ${type === 'email' ? 'email' : 'phone'}`);
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('no warranty found') || msg.toLowerCase().includes('not found')) {
        setError('No warranty found for this contact');
      } else {
        setError(msg || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').split('').slice(0, 6);
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await verifyWarrantyOTP(contact.trim(), otpString);
      const details = response?.data?.customer_details;
      if (details) {
        toast.success('Verified successfully!');
        navigate('/warranty-details', { state: { customerDetails: details } });
      } else {
        setError('Verification failed');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || '';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
        setError('Invalid or expired OTP. Please try again.');
      } else {
        setError(msg || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setError('');
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    try {
      const response = await sendWarrantyOTP(contact.trim());
      setMaskedContact(response?.data?.masked_contact || contact.trim());
      setResendTimer(60);
      toast.success('OTP resent successfully');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to resend OTP.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-gradient-to-br from-[#0F4E78] via-[#1A7FC1] to-[#3A9FE1] pt-12 pb-8 px-6 rounded-b-[2rem] shadow-xl">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => (codeResult ? resetCodeView() : navigate(-1))}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Verify Warranty</h1>
              <p className="text-cyan-100 text-sm">Check warranty validity by code</p>
            </div>
          </div>

          {/* Tabs */}
          {!codeResult && (
            <div className="flex gap-2 mt-6 p-1 bg-white/10 rounded-xl">
              <button
                onClick={() => { setMode('code'); setCodeError(''); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'code' ? 'bg-white text-[#1A7FC1]' : 'text-white/80 hover:text-white'}`}
              >
                By Code
              </button>
              {/* <button
                onClick={() => { setMode('contact'); setStep('contact'); setCodeError(''); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'contact' ? 'bg-white text-[#1A7FC1]' : 'text-white/80 hover:text-white'}`}
              >
                By Contact
              </button> */}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-4">
        <AnimatePresence mode="wait">
          {/* -------- Verify by Code (primary) -------- */}
          {mode === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              {!codeResult ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#1A7FC1]/10 flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-[#1A7FC1]" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800">Enter warranty code</h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Enter the warranty code from your product or certificate
                    </p>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleVerifyCode(); }} className="space-y-4">
                    <div className="relative">
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={codeInput}
                        onChange={(e) => { setCodeInput(e.target.value); setCodeError(''); }}
                        placeholder="Warranty code"
                        className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1A7FC1] focus:border-transparent"
                        autoFocus
                      />
                    </div>

                    {codeError && (
                      <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                        <XCircle className="w-4 h-4 shrink-0" />
                        {codeError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={codeLoading || !codeInput.trim()}
                      className="w-full h-14 rounded-xl bg-gradient-to-r from-[#1A7FC1] to-[#3A9FE1] hover:from-[#166EA8] hover:to-[#1A7FC1] text-white font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {codeLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <><Shield className="w-5 h-5" /> Verify</>}
                    </button>
                  </form>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                    <CheckCircle2 className="w-10 h-10 text-green-600 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-green-800">Valid Warranty</h3>
                      <p className="text-green-700 text-sm">This warranty code is authentic</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                      <Package className="w-5 h-5 text-[#1A7FC1] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-slate-400 text-xs">Product</p>
                        <p className="text-slate-800 font-medium">{codeResult.product_name || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                      <span className="text-slate-400 text-xs font-mono">{codeResult.warranty_code}</span>
                    </div>
                    {codeResult.provider_name && (
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                        <Building2 className="w-5 h-5 text-[#1A7FC1] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-400 text-xs">Provider</p>
                          <p className="text-slate-800 font-medium">{codeResult.provider_name}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> Valid from</p>
                        <p className="text-slate-800 text-sm font-medium">{formatDate(codeResult.warranty_from)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Valid until</p>
                        <p className={`text-sm font-medium ${codeResult.is_expired ? 'text-red-600' : 'text-slate-800'}`}>{formatDate(codeResult.warranty_to)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${codeResult.is_expired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {codeResult.is_expired ? 'Expired' : codeResult.days_left != null ? `${codeResult.days_left} days left` : 'Active'}
                      </span>
                      {codeResult.is_registered && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Registered</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={resetCodeView}
                    className="w-full h-12 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Verify another code
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* -------- Verify by Contact (OTP flow) -------- */}
          {mode === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              {step === 'contact' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#1A7FC1]/10 flex items-center justify-center mb-4">
                      <KeyRound className="w-8 h-8 text-[#1A7FC1]" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800">Verify by contact</h2>
                    <p className="text-slate-500 text-sm mt-1">Enter email or phone used during warranty registration</p>
                  </div>

                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {contact && isEmail(contact.trim()) ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                      </div>
                      <input
                        type="text"
                        value={contact}
                        onChange={(e) => { setContact(e.target.value); setError(''); }}
                        placeholder="Email or Phone Number"
                        className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1] focus:border-transparent"
                        autoFocus
                      />
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                        <XCircle className="w-4 h-4 shrink-0" />
                        {error}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading || !contact.trim()}
                      className="w-full h-14 rounded-xl bg-gradient-to-r from-[#1A7FC1] to-[#3A9FE1] hover:from-[#166EA8] hover:to-[#1A7FC1] text-white font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending OTP...</> : <><span>Send OTP</span><ArrowRight className="w-5 h-5" /></>}
                    </button>
                  </form>
                  <p className="text-slate-400 text-xs text-center mt-4">We'll send a 6-digit code to confirm your identity</p>
                </>
              )}

              {step === 'otp' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#1A7FC1]/10 flex items-center justify-center mb-4">
                      {contactType === 'email' ? <Mail className="w-8 h-8 text-[#1A7FC1]" /> : <Phone className="w-8 h-8 text-[#1A7FC1]" />}
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800">Enter Verification Code</h2>
                    <p className="text-slate-500 text-sm mt-1">OTP sent to <span className="font-medium text-slate-700">{maskedContact}</span></p>
                  </div>

                  <form onSubmit={handleVerifyOTP} className="space-y-5">
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={i === 0 ? 6 : 1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 border-slate-200 text-slate-900 focus:outline-none focus:border-[#1A7FC1] focus:ring-2 focus:ring-[#1A7FC1]/20"
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                        <XCircle className="w-4 h-4 shrink-0" />
                        {error}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading || otp.join('').length !== 6}
                      className="w-full h-14 rounded-xl bg-gradient-to-r from-[#1A7FC1] to-[#3A9FE1] hover:from-[#166EA8] hover:to-[#1A7FC1] text-white font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <><CheckCircle2 className="w-5 h-5" /> Verify OTP</>}
                    </button>
                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        onClick={() => { setStep('contact'); setError(''); setOtp(['', '', '', '', '', '']); }}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        Change {contactType === 'email' ? 'email' : 'number'}
                      </button>
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={resendTimer > 0 || loading}
                        className={`flex items-center gap-1 ${resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-[#1A7FC1] hover:text-[#166EA8]'}`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </form>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-blue-700 text-xs text-center">
                      {contactType === 'email' ? 'Check your inbox and spam folder' : 'You should receive the OTP via SMS shortly'}
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
