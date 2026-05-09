import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowRight, Loader2, ArrowLeft, Smartphone, Mail, CheckCircle, CheckCircle2, User, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import api from "../../utils/api";
import { normalizeIndianMobile, isValidIndianMobile } from "../../utils/indianMobile";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const CONTACT_CONFLICT_FALLBACK =
  "This email or phone number is already registered to another account. Please use a different email or phone number.";

const isContactConflictError = (err) =>
  err?.response?.status === 409 || err?.response?.data?.data?.code === "CONTACT_IN_USE";

const getCustomerAuthErrorMessage = (err, fallback) => {
  if (isContactConflictError(err)) {
    return err?.response?.data?.message || CONTACT_CONFLICT_FALLBACK;
  }
  return err?.response?.data?.message || fallback;
};

export function CustomerAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState("input"); // input | otp | profile
  const [identifier, setIdentifier] = useState(location.state?.email ?? "");
  const [identifierType, setIdentifierType] = useState(location.state?.email ? "email" : null); // email | phone
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isNewUser, setIsNewUser] = useState(false);
  const [userData, setUserData] = useState(null);
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    email: "",
    phone_number: "",
    city: "",
  });
  const otpRefs = useRef([]);
  const googleBtnRef = useRef(null);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Resend cooldown (match backend OTP_REQUEST_COOLDOWN_MS = 60s)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Google login
  const handleGoogleResponse = useCallback(async (response) => {
    if (!response?.credential) return;
    setIsLoading(true);
    try {
      const res = await api.post("/user/google-login", {
        id_token: response.credential,
        role: "customer",
      });
      const token = res.data?.data?.token;
      const user = res.data?.data?.user;
      if (token) {
        Cookies.set("authToken", token, { sameSite: "lax" });
        localStorage.setItem("token", token);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify({ ...user, user_type: "customer" }));
      }
      toast.success("Welcome!");
      navigate("/home");
    } catch (err) {
      toast.error(getCustomerAuthErrorMessage(err, "Google login failed"));
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || step !== "input") return;
    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: 360,
          text: "continue_with",
          shape: "pill",
        });
      }
    };
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }
  }, [step, handleGoogleResponse]);

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      toast.error("Please enter your email or 10-digit mobile number");
      return;
    }

    let payload;
    if (trimmed.includes("@")) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        toast.error("Please enter a valid email address");
        return;
      }
      setIdentifierType("email");
      payload = { email: trimmed };
    } else {
      const ten = normalizeIndianMobile(trimmed);
      if (!isValidIndianMobile(ten)) {
        toast.error("Please enter a correct mobile number or email");
        return;
      }
      setIdentifier(ten);
      setIdentifierType("phone");
      payload = { phone_number: ten };
    }

    setIsLoading(true);
    try {
      const res = await api.post("/customer/auth", payload);
      const data = res.data?.data || {};
      setIsNewUser(data.isNewUser || false);
      setCountdown(Math.floor((data.expiresInMs || 300000) / 1000));
      setResendCooldown(60);
      setStep("otp");
      toast.success(`OTP sent to your ${payload.email ? "email" : "mobile"}`);
    } catch (err) {
      toast.error(getCustomerAuthErrorMessage(err, "Failed to send OTP"));
    } finally {
      setIsLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (idx, val) => {
    if (val.length > 1) val = val.slice(-1);
    if (val && !/^\d$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = text[i] || "";
    setOtp(next);
    const focusIdx = Math.min(text.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      const payload = identifierType === "email"
        ? { email: identifier.trim(), otp: code }
        : { phone_number: identifier.trim(), otp: code };
      const res = await api.post("/customer/verify-auth-otp", payload);
      const data = res.data?.data || {};

      if (data.token) {
        Cookies.set("authToken", data.token, { sameSite: "lax" });
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify({ ...data.user, user_type: "customer" }));
        setUserData(data.user);
      }

      if (!data.profileCompleted) {
        const u = data.user;
        const existingPhone = u?.phone_number && !String(u.phone_number).startsWith("temp_")
          ? u.phone_number
          : "";
        setProfileForm({
          first_name: u?.first_name || "",
          email: identifierType === "email" ? (u?.email || identifier.trim()) : (u?.email || ""),
          phone_number:
            identifierType === "phone"
              ? String(u?.phone_number || identifier.trim() || "").replace(/^temp_.*/, "")
              : existingPhone,
          city: u?.city || "",
        });
        setStep("profile");
        toast.success("Verified! Please complete your profile");
      } else {
        toast.success("Welcome back!");
        navigate("/home");
      }
    } catch (err) {
      toast.error(getCustomerAuthErrorMessage(err, "Invalid OTP"));
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setIsLoading(true);
    try {
      const payload = identifierType === "email"
        ? { email: identifier.trim() }
        : { phone_number: identifier.trim() };
      const res = await api.post("/customer/auth", payload);
      const data = res.data?.data || {};
      setCountdown(Math.floor((data.expiresInMs || 300000) / 1000));
      setResendCooldown(60);
      toast.success("New OTP sent");
    } catch (err) {
      toast.error(getCustomerAuthErrorMessage(err, "Failed to resend OTP"));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Complete profile
  const handleCompleteProfile = async () => {
    if (!profileForm.first_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (identifierType === "email" && profileForm.phone_number.trim()) {
      const ten = normalizeIndianMobile(profileForm.phone_number);
      if (!isValidIndianMobile(ten)) {
        toast.error("Please enter a correct 10-digit Indian mobile number");
        return;
      }
    }
    if (identifierType === "phone" && profileForm.email.trim()) {
      const em = profileForm.email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }
    setIsLoading(true);
    try {
      const payload = {
        first_name: profileForm.first_name.trim(),
        city: profileForm.city.trim() || undefined,
      };
      if (identifierType === "email") {
        const raw = profileForm.phone_number.trim();
        payload.phone_number = raw ? normalizeIndianMobile(raw) || undefined : undefined;
      } else {
        payload.email = profileForm.email.trim() || undefined;
      }
      const res = await api.post("/customer/complete-profile", payload);
      const updated = res.data?.data?.user;
      if (updated) {
        localStorage.setItem("user", JSON.stringify({ ...updated, user_type: "customer" }));
      }
      toast.success("Profile completed! Welcome to E-Warrantify");
      navigate("/home");
    } catch (err) {
      toast.error(getCustomerAuthErrorMessage(err, "Failed to save profile"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipProfile = () => {
    navigate("/home");
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const valuePoints = [
    "Track your product warranties",
    "File claims easily",
    "Simple & secure verification",
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 text-[#1A7FC1] hover:opacity-80 transition-opacity">
            <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-12 w-auto" />
            <span className="font-semibold text-lg">E-Warrantify</span>
          </button>
          {/* <div className="text-slate-400 text-xs">
            Already have an account?{" "}
              <button type="button" onClick={() => navigate("/login")} className="text-[#1A7FC1] font-medium hover:underline">Sign in here</button>
          </div> */}
        </div>
      </div>

      {/* Mobile: compact header; Desktop: two-panel layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
        <div className="lg:flex lg:items-stretch lg:justify-center lg:gap-8 lg:min-h-0">
          {/* Left panel - desktop only (blue gradient with value points) */}
          <aside className="hidden lg:flex lg:w-80 lg:shrink-0">
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#1A7FC1] via-[#166EA8] to-[#0F4E78] p-6 shadow-xl shadow-slate-200/50 w-full flex flex-col">
              <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3 pointer-events-none" aria-hidden />
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/5 pointer-events-none" aria-hidden />
              <div className="relative z-10 space-y-6 flex-1 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Customer sign-in & registration</h2>
                  <p className="text-white/80 text-xs mt-1">
                    Personal accounts use a one-time code (OTP) sent to your mobile or email—no password on this page.
                  </p>
                </div>
                <ul className="space-y-3 flex-1">
                  {valuePoints.map((text) => (
                    <li key={text} className="flex items-start gap-2.5 text-white/95 text-xs">
                      <span className="mt-0.5 rounded-full bg-white/20 p-1 shrink-0 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Right: form card(s) */}
          <main className="flex-1 min-w-0 flex flex-col lg:max-w-md lg:min-h-0">
            <div className="w-full max-w-md mx-auto lg:max-w-none lg:w-full lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8 lg:flex-1 lg:flex lg:flex-col lg:min-h-0">

          {/* ─── Step 1: Input ─── */}
          {step === "input" && (
            <div className="space-y-5">
              <div className="mb-2">
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Welcome to E-Warrantify</h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  Enter your mobile or email—we&apos;ll send a one-time code to sign you in or create your customer account.
                </p>
              </div>
              {/* <p className="text-xs text-slate-500 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                For business owners, staff, dealers, or service centers, use{" "}
                <Link to="/owner-signup" className="text-[#1A7FC1] font-medium hover:underline">
                  business registration
                </Link>
                {" "}or{" "}
                <Link to="/login" className="text-[#1A7FC1] font-medium hover:underline">
                  business login
                </Link>
                .
              </p> */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                   Mobile or Email
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {identifier.includes("@") ? <Mail className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    placeholder="Email or mobile number"
                    inputMode="email"
                    enterKeyHint="done"
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1] transition-colors"
                    autoFocus
                  />
                </div>
                {/* <p className="text-xs text-slate-400 mt-1.5">
                  Indian mobile: 10 digits (starts with 6–9). You can use +91 or a leading 0. We&apos;ll send an OTP to verify.
                </p> */}
              </div>

              <button
                onClick={handleSendOtp}
                disabled={isLoading || !identifier.trim()}
                className="w-full py-3 rounded-xl bg-[#1A7FC1] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#166EA8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Continue
              </button>

              {/* {GOOGLE_CLIENT_ID && (
                <>
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">OR</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  <div ref={googleBtnRef} className="flex justify-center w-full min-w-0" />
                </>
              )} */}

              <p className="text-center text-xs text-slate-400 mt-3">
                By continuing, you agree to our{" "}
                <Link to={`/terms-of-service?from=${encodeURIComponent(location.pathname)}`} target="_blank" rel="noopener noreferrer" className="text-[#1A7FC1] font-medium hover:underline">Terms of Service</Link>{" "}
                and{" "}
                <Link to={`/privacy-policy?from=${encodeURIComponent(location.pathname)}`} target="_blank" rel="noopener noreferrer" className="text-[#1A7FC1] font-medium hover:underline">Privacy Policy</Link>
              </p>
            </div>
          )}

          {/* ─── Step 2: OTP ─── */}
          {step === "otp" && (
            <div className="space-y-5">
              <button onClick={() => { setStep("input"); setOtp(["", "", "", "", "", ""]); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#1A7FC1]/10 flex items-center justify-center mb-3">
                  {identifierType === "email" ? <Mail className="w-5 h-5 text-[#1A7FC1]" /> : <Smartphone className="w-5 h-5 text-[#1A7FC1]" />}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Enter Verification Code</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Sent to <span className="font-medium text-slate-700">{identifier}</span>
                </p>
              </div>

              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 text-center text-lg font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1] transition-colors"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {countdown > 0 && (
                <p className="text-center text-xs text-slate-400">
                  Code expires in <span className="font-medium text-[#1A7FC1]">{formatTime(countdown)}</span>
                </p>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.join("").length !== 6}
                className="w-full py-3 rounded-xl bg-[#1A7FC1] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#166EA8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Verify & Continue
              </button>

              <p className="text-center text-sm text-slate-500">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isLoading}
                  className={`font-medium ${resendCooldown > 0 ? "text-slate-400" : "text-[#1A7FC1] hover:underline"}`}
                >
                  {resendCooldown > 0 ? `Resend in ${formatTime(resendCooldown)}` : "Resend OTP"}
                </button>
              </p>
            </div>
          )}

          {/* ─── Step 3: Profile Completion ─── */}
          {step === "profile" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-3">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Complete Your Profile</h3>
                <p className="text-sm text-slate-500 mt-1">Just a few details to get started</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1]"
                      autoFocus
                    />
                  </div>
                </div>

                {identifierType === "email" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Mobile number <span className="text-slate-400">(optional)</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mb-1">
                      10-digit Indian mobile (6–9…). Optional — for SMS updates and support.
                    </p>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={profileForm.phone_number}
                        onChange={(e) => setProfileForm((p) => ({ ...p, phone_number: e.target.value }))}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1]"
                      />
                    </div>
                  </div>
                )}

                {identifierType === "phone" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Email <span className="text-slate-400">(optional)</span>
                    </label>
                    <p className="text-[11px] text-slate-400 mb-1">
                      You signed in with phone — add your email for receipts and account recovery.
                    </p>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        autoComplete="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">City <span className="text-slate-400">(optional)</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm((p) => ({ ...p, city: e.target.value }))}
                      placeholder="Your city"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/30 focus:border-[#1A7FC1]"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCompleteProfile}
                disabled={isLoading || !profileForm.first_name.trim()}
                className="w-full py-3 rounded-xl bg-[#1A7FC1] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#166EA8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save & Continue
              </button>

              <button
                onClick={handleSkipProfile}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                Skip for now
              </button>
            </div>
          )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
