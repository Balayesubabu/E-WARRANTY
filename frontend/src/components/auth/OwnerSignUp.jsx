import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff,
  Building2, Phone, MapPin, Store, CheckCircle2, ShieldCheck,
} from "lucide-react";
import { Button } from "../ui/button";
import { IconInput } from "../ui/icon-input";
import { Label } from "../ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { PasswordStrengthMeter } from "../common/PasswordStrengthMeter";
import Cookies from "js-cookie";
import { ownerSignup, googleLogin } from "../../services/authorizationService";
import { requestSignupOtp, verifyOtp, checkRegistrationStatus } from "../../services/otpAuthService";
import { getUserDetails, updateUserDetails } from "../../services/userService";
import { toast } from "sonner";
import {
  isValidIndianMobile,
  sanitizeIndianNationalInput,
  sanitizeInternationalPhoneDigits,
  splitPhoneForOwnerForm,
} from "../../utils/indianMobile";

const BRAND = "#1A7FC1";

function isPrimaryPhoneValid(digits, countryCode) {
  if (countryCode === "+91") return isValidIndianMobile(digits);
  const d = String(digits ?? "").replace(/\D/g, "");
  return d.length >= 8 && d.length <= 15;
}

const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "US / Canada (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+81", label: "Japan (+81)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+65", label: "Singapore (+65)" },
  { code: "+86", label: "China (+86)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
];

const STEPS = [
  { num: 1, label: "Verify" },
  { num: 2, label: "OTP" },
  { num: 3, label: "Details" },
];

export function OwnerSignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = typeof window !== "undefined" ? (localStorage.getItem("token") || Cookies.get("authToken")) : null;
  const isCompleteProfile = location.state?.completeProfile === true && !!token;
  const referral_code = (new URLSearchParams(location.search).get("ref") || "").trim() || undefined;

  const [step, setStep] = useState(isCompleteProfile ? 3 : 1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDraftResume, setIsDraftResume] = useState(false);
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [emailError, setEmailError] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");

  const validateEmail = (value) => {
    if (value && value.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) { setEmailError("Please enter a valid email address"); return false; }
    }
    setEmailError("");
    return true;
  };

  const handleCountryCodeChange = (nextCode) => {
    setCountryCode(nextCode);
    setPhoneNumber((prev) =>
      nextCode === "+91"
        ? sanitizeIndianNationalInput(prev)
        : sanitizeInternationalPhoneDigits(prev)
    );
  };

  const handlePrimaryPhoneChange = (e) => {
    const v = e.target.value;
    setPhoneNumber(
      countryCode === "+91"
        ? sanitizeIndianNationalInput(v)
        : sanitizeInternationalPhoneDigits(v)
    );
  };

  const handleFranchisePhoneChange = (e) => {
    setFranchisePhoneNumber(sanitizeIndianNationalInput(e.target.value));
  };

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [address, setAddress] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  const [franchiseName, setFranchiseName] = useState("");
  const [franchiseAddress, setFranchiseAddress] = useState("");
  const [franchiseCity, setFranchiseCity] = useState("");
  const [franchiseState, setFranchiseState] = useState("");
  const [franchiseCountry, setFranchiseCountry] = useState("India");
  const [franchisePinCode, setFranchisePinCode] = useState("");
  const [franchisePhoneNumber, setFranchisePhoneNumber] = useState("");
  const [franchiseEmail, setFranchiseEmail] = useState("");

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  // Complete-profile mode: skip to step 3 and pre-fill from API
  useEffect(() => {
    if (!isCompleteProfile) return;
    setStep(3);
    if (location.state?.email) setEmail(location.state.email);
    let cancelled = false;
    (async () => {
      try {
        const details = await getUserDetails();
        if (cancelled) return;
        if (details?.fullname) {
          const parts = String(details.fullname).trim().split(/\s+/);
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
        const cn = details?.companyname;
        const isPlaceholderCompany =
          !cn ||
          cn === "My Business" ||
          cn === "N/A" ||
          /'s Business$/.test(String(cn).trim()) ||
          /@/.test(String(cn)); // skip if looks like email or email-derived
        if (cn && !isPlaceholderCompany) setCompanyName(cn);
        let compAddr = details?.company_address;
        if (!compAddr && !details?.personal_address && details?.address) {
          compAddr = details.address;
        }
        if (compAddr && String(compAddr).trim().toLowerCase() !== "to be completed") {
          setCompanyAddress(String(compAddr).trim());
        }
        if (details?.personal_address != null && String(details.personal_address).trim() !== "") {
          setAddress(String(details.personal_address).trim());
        }
        const ph = details?.phone_number ?? details?.phone;
        if (ph && !String(ph).startsWith("temp_")) {
          const allowed = COUNTRY_CODES.map((c) => c.code);
          const { countryCode: cc, nationalDigits } = splitPhoneForOwnerForm(ph, allowed);
          setCountryCode("+91");
          setPhoneNumber(cc === "+91" ? nationalDigits : "");
        }
      } catch (e) {
        if (!cancelled) toast.error(e?.message || "Failed to load profile");
      }
    })();
    return () => { cancelled = true; };
  }, [isCompleteProfile]);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleBtnRef = useRef(null);

  const handleGoogleResponse = useCallback(
    async (response) => {
      if (!response?.credential) return;
      setIsLoading(true);
      try {
        await googleLogin({ idToken: response.credential, role: "owner", referral_code });
        toast.success("Welcome!");
        navigate("/owner", { replace: true });
      } catch (err) {
        const status = err?.response?.status;
        const redirectRole = err?.response?.data?.data?.redirectRole;
        const message = err?.response?.data?.message || "Google sign in failed";

        if (redirectRole === "owner") {
          try {
            await googleLogin({ idToken: response.credential, role: "owner", referral_code });
            toast.success("Welcome!");
            navigate("/owner", { replace: true });
          } catch (e) {
            toast.error(e?.response?.data?.message || "Google sign in failed");
          }
        } else if (redirectRole) {
          const roleLabels = { owner: "Business Owner", staff: "Staff", dealer: "Dealer", customer: "Customer" };
          toast.info(`This account is registered as ${roleLabels[redirectRole] || redirectRole}. Use Login instead.`);
          navigate("/login", { replace: true });
        } else if (status === 404) {
          toast.error("Could not sign in with Google. Please try again or use the form above to register.");
        } else {
          toast.error(message);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || step !== 1) return;
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

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email || !phoneNumber) { toast.error("Please enter both email and phone number"); return; }
    if (!validateEmail(email)) return;
    if (!isPrimaryPhoneValid(phoneNumber, countryCode)) {
      toast.error(
        countryCode === "+91"
          ? "Please enter a valid 10-digit Indian mobile number"
          : "Please enter a valid phone number (8–15 digits)"
      );
      return;
    }
    setIsLoading(true);
    try {
      const regStatus = await checkRegistrationStatus(email.trim());

      if (regStatus.isRegistered) {
        toast.error("An account with this email already exists. Use business login.", {
          action: { label: "Login", onClick: () => navigate("/login") },
        });
        setIsLoading(false);
        return;
      }

      if (regStatus.isDraft) {
        const ccDraft = regStatus.country_code || countryCode;
        const rawPh = regStatus.phone_number || phoneNumber;
        setCountryCode(ccDraft);
        setPhoneNumber(
          ccDraft === "+91"
            ? sanitizeIndianNationalInput(String(rawPh ?? ""))
            : sanitizeInternationalPhoneDigits(String(rawPh ?? ""))
        );
        setIsDraftResume(true);
        toast.success("Welcome back! Your identity was already verified. Complete your registration.");
        setStep(3);
        setIsLoading(false);
        return;
      }

      await requestSignupOtp({ email: email.trim(), phone_number: phoneNumber.trim(), country_code: countryCode });
      toast.success("OTP sent to your email/phone");
      setStep(2);
      setTimer(60);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleOTPPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      pasted.split("").forEach((ch, i) => { if (i < 6) newOtp[i] = ch; });
      setOtp(newOtp);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      e.preventDefault();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) { toast.error("Please enter complete OTP"); return; }
    if (timer <= 0) { toast.error("OTP expired. Please resend."); return; }
    if (!isPrimaryPhoneValid(phoneNumber, countryCode)) {
      toast.error(
        countryCode === "+91"
          ? "Please enter a valid 10-digit Indian mobile number (starts with 6–9)"
          : "Please enter a valid phone number (8–15 digits)"
      );
      return;
    }
    setIsLoading(true);
    try {
      await verifyOtp({ email: email.trim(), phone_number: phoneNumber.trim(), otp: otpCode });
      toast.success("OTP verified successfully!");
      setStep(3);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!isPrimaryPhoneValid(phoneNumber, countryCode)) {
      toast.error(
        countryCode === "+91"
          ? "Please enter a valid 10-digit Indian mobile number (starts with 6–9)"
          : "Please enter a valid phone number (8–15 digits)"
      );
      return;
    }
    setIsLoading(true);
    try {
      await requestSignupOtp({ email: email.trim(), phone_number: phoneNumber.trim(), country_code: countryCode });
      setTimer(60);
      setOtp(["", "", "", "", "", ""]);
      toast.success("OTP resent successfully");
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isCompleteProfile) {
      if (!firstName?.trim() || !lastName?.trim()) { toast.error("First and last name are required"); return; }
      if (!companyName?.trim()) { toast.error("Company name is required"); return; }
      if (!isPrimaryPhoneValid(phoneNumber, "+91")) {
        toast.error("Please enter a valid 10-digit Indian mobile number (starts with 6–9)");
        return;
      }
      setIsLoading(true);
      try {
        const phone = `+91 ${phoneNumber}`.trim();
        const updated = await updateUserDetails({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phone,
          companyname: companyName.trim(),
          company_address: companyAddress.trim(),
          personal_address: address.trim(),
          country_code: "+91",
          gstin: "",
        });
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({ ...user, ...updated, profile_completed: true })
        );
        toast.success("Profile completed successfully.");
        navigate("/owner", { replace: true });
      } catch (error) {
        toast.error(error?.message || "Failed to update profile");
      } finally {
        setIsLoading(false);
      }
      return;
    }
    if (!firstName || !lastName || !password) { toast.error("Please fill in all required fields"); return; }
    if (!companyName) { toast.error("Company name is required"); return; }
    if (!franchiseName || !franchiseCity || !franchiseState) { toast.error("Please fill in franchise details"); return; }
    if (!isPrimaryPhoneValid(phoneNumber, countryCode)) {
      toast.error(
        countryCode === "+91"
          ? "Please enter a valid 10-digit Indian mobile number (starts with 6–9)"
          : "Please enter a valid phone number (8–15 digits)"
      );
      return;
    }
    const fpDigits = franchisePhoneNumber.replace(/\D/g, "");
    if (fpDigits.length > 0 && !isValidIndianMobile(fpDigits)) {
      toast.error("Branch phone must be a valid 10-digit mobile number");
      return;
    }

    setIsLoading(true);
    try {
      await ownerSignup({
        first_name: firstName.trim(), last_name: lastName.trim(), country_code: countryCode,
        email: email.trim(), password, phone_number: phoneNumber.trim(), address: address.trim(),
        company_name: companyName.trim(), company_address: companyAddress.trim(),
        franchise_name: franchiseName.trim(), franchise_address: franchiseAddress.trim(),
        franchise_city: franchiseCity.trim(), franchise_state: franchiseState.trim(),
        franchise_country: franchiseCountry.trim(), franchise_pin_code: franchisePinCode.trim(),
        franchise_phone_number: franchisePhoneNumber.trim() || phoneNumber.trim(),
        franchise_email: franchiseEmail.trim() || email.trim(),
        ...(referral_code ? { referral_code } : {}),
      });
      toast.success("Registration successful! Welcome to eWarranty.");
      navigate("/home");
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full h-11 rounded-xl border border-slate-200 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A7FC1] focus:border-transparent transition-shadow disabled:opacity-50";

  const valuePoints = [
    "Manage warranties in one place",
    "Trusted by businesses",
    "Streamline verification",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Top bar - full width on desktop */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 text-[#1A7FC1] hover:opacity-80 transition-opacity">
            <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-12 w-auto" />
            <span className="font-semibold text-lg">E-Warrantify</span>
          </button>
          <div className="text-slate-600 text-xs sm:text-sm text-right shrink-0 max-w-[min(100%,14rem)] sm:max-w-none">
            <span className="text-slate-500">Already have an account?</span>{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[#1A7FC1] font-semibold hover:underline"
            >
              Login
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: two cards same alignment; mobile: signup only */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        <div className="lg:flex lg:items-stretch lg:justify-center lg:gap-8 lg:min-h-0">
          {/* Left card - desktop only, matches right card height */}
          <aside className="hidden lg:flex lg:w-80 lg:shrink-0">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A7FC1] via-[#166EA8] to-[#0F4E78] p-6 shadow-xl shadow-slate-200/50 w-full flex flex-col">
              <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3 pointer-events-none" aria-hidden />
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/5 pointer-events-none" aria-hidden />
              <div className="relative z-10 space-y-6 flex-1 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Verify identity securely.</h2>
                  <p className="text-white/80 text-xs mt-1">Get started in minutes with secure verification.</p>
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

          {/* Right card - signup form, same row alignment */}
          <main className="flex-1 min-w-0 flex flex-col lg:max-w-[28rem] lg:min-h-0">
      <div className="w-full max-w-md mx-auto lg:max-w-none lg:w-full lg:flex-1 lg:flex lg:flex-col lg:min-h-0 px-0 py-0">
        {/* Step 1: Single white form card - stretches to match left card height on desktop */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8 lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
            <h1 className="text-2xl font-bold text-slate-900">Register Your Business</h1>
            <p className="text-slate-500 text-sm mt-1 mb-3">Create an account to get started</p>

            {/* {!isCompleteProfile && (
              <div className="flex items-center justify-center gap-0 mt-6 mb-6 max-w-xs mx-auto">
                {STEPS.map((s, i) => (
                  <div key={s.num} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        s.num < step ? "bg-[#1A7FC1] text-white" : s.num === step ? "bg-[#1A7FC1] text-white ring-4 ring-[#1A7FC1]/20" : "bg-slate-100 text-slate-400"
                      }`}>
                        {s.num < step ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                      </div>
                      <span className={`text-[10px] mt-1 font-medium ${s.num <= step ? "text-[#1A7FC1]" : "text-slate-400"}`}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-12 h-0.5 mx-1 mb-4 rounded ${s.num < step ? "bg-[#1A7FC1]" : "bg-slate-200"}`} />
                    )}
                  </div>
                ))}
              </div>
            )} */}

            <form onSubmit={handleRequestOTP} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-700 text-sm">Email Address *</Label>
                <IconInput id="email" type="email" icon={Mail} placeholder="you@company.com" value={email}
                  onChange={(e) => { setEmail(e.target.value); validateEmail(e.target.value); }}
                  className={`h-11 rounded-xl ${emailError ? "border-red-400" : "border-slate-200"}`} disabled={isLoading} required />
                {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-slate-700 text-sm">Phone Number *</Label>
                <div className="flex gap-2 items-stretch w-full min-w-0">
                  <Select value={countryCode} onValueChange={handleCountryCodeChange}>
                    <SelectTrigger className="h-11 min-h-11 w-[120px] shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-sm [&[data-size=default]]:h-11">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map(({ code, label }) => (
                        <SelectItem key={code} value={code}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <IconInput id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={countryCode === "+91" ? 10 : 15}
                    icon={Phone} placeholder="9876543210" value={phoneNumber}
                    onChange={handlePrimaryPhoneChange} className="h-11 rounded-xl border-slate-200 flex-1 min-w-0" disabled={isLoading} required />
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#1A7FC1] hover:bg-[#166EA8] text-white h-12 font-semibold rounded-xl" disabled={isLoading}>
                {isLoading ? "Sending OTP..." : "Get Verification Code"}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>

              {GOOGLE_CLIENT_ID && (
                <>
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">OR</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  <div ref={googleBtnRef} className="flex justify-center" />
                </>
              )}
            </form>

            <div className="lg:flex-1 lg:min-h-4" />
            {/* <p className="text-slate-400 text-xs text-center mt-6 leading-relaxed">
              We&apos;ll send a one-time verification code to your email and phone. Make sure you have access to both.
            </p> */}
            <p className="text-slate-400 text-xs text-center mt-4">
              By continuing, you agree to our{" "}
              <Link to={`/terms-of-service?from=${encodeURIComponent(location.pathname)}`} target="_blank" rel="noopener noreferrer" className="text-[#1A7FC1] font-medium hover:underline">Terms of Service</Link>{" "}
              and{" "}
              <Link to={`/privacy-policy?from=${encodeURIComponent(location.pathname)}`} target="_blank" rel="noopener noreferrer" className="text-[#1A7FC1] font-medium hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        )}

        {/* Step 2: OTP - same white card style, stretches to match left card on desktop */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6 lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
              <h1 className="text-2xl font-bold text-slate-900">Verify Your Identity</h1>
              <p className="text-slate-500 text-sm mt-1">We&apos;ve sent a verification code to your email</p>
              <div className="text-center pt-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#1A7FC1]/10 flex items-center justify-center mb-3">
                  <Mail className="w-6 h-6 text-[#1A7FC1]" />
                </div>
                <p className="text-slate-600 text-sm">
                  Enter the 6-digit code sent to<br />
                  <span className="font-medium text-slate-900">{email}</span>
                </p>
              </div>

              <div className="flex gap-2.5 justify-center" onPaste={handleOTPPaste}>
                {otp.map((digit, index) => (
                  <input key={index} ref={(el) => (inputRefs.current[index] = el)}
                    type="text" inputMode="numeric" pattern="[0-9]*" maxLength={1} value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    className="w-11 h-12 text-center border-2 border-slate-200 rounded-xl focus:border-[#1A7FC1] focus:ring-2 focus:ring-[#1A7FC1]/20 focus:outline-none text-slate-900 text-lg font-semibold transition-all"
                    disabled={isLoading} />
                ))}
              </div>

              <Button onClick={handleVerifyOTP} disabled={isLoading || otp.join("").length !== 6}
                className="w-full bg-[#1A7FC1] hover:bg-[#166EA8] text-white h-12 font-semibold rounded-xl">
                {isLoading ? "Verifying..." : "Verify & Continue"}
              </Button>

              <div className="text-center text-sm">
                {timer > 0 ? (
                  <p className="text-slate-500">Resend in <span className="text-[#1A7FC1] font-semibold">{timer}s</span></p>
                ) : (
                  <button onClick={handleResendOTP} className="text-[#1A7FC1] hover:underline font-medium" disabled={isLoading}>
                    {isLoading ? "Resending..." : "Resend OTP"}
                  </button>
                )}
              </div>

              <button type="button" onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors mx-auto text-sm">
                <ArrowLeft className="w-3.5 h-3.5" /> Change email/phone
              </button>
          </div>
        )}

        {/* Step 3: Full Details */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {isCompleteProfile && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 font-medium text-sm">Complete your profile</p>
                  <p className="text-amber-700 text-xs mt-0.5">Your email is from your Google sign-in. Fill in the details below and save.</p>
                </div>
              </div>
            )}
            {!isCompleteProfile && isDraftResume && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-800 font-medium text-sm">Welcome back!</p>
                  <p className="text-green-700 text-xs mt-0.5">Your email and phone were already verified. Just fill in the details below to complete your registration.</p>
                </div>
              </div>
            )}

            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1A7FC1]/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-[#1A7FC1]" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-semibold text-sm">Personal Information</h3>
                    <p className="text-slate-400 text-xs">Your account owner details</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs font-medium">First Name *</Label>
                    <input type="text" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      className={inputClass} disabled={isLoading} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs font-medium">Last Name *</Label>
                    <input type="text" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)}
                      className={inputClass} disabled={isLoading} required />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" value={email} readOnly className={`${inputClass} pl-10 bg-slate-50 text-slate-500`} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs font-medium">Phone</Label>
                    {isCompleteProfile ? (
                      <div className="flex gap-2 w-full">
                        <div
                          className="h-11 min-h-11 w-[130px] shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center justify-center text-sm text-slate-700 font-medium"
                          title="Indian mobile number"
                        >
                          +91
                        </div>
                        <div className="relative flex-1 min-w-0">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel-national"
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={phoneNumber}
                            onChange={(e) => {
                              setCountryCode("+91");
                              setPhoneNumber(sanitizeIndianNationalInput(e.target.value));
                            }}
                            className={`${inputClass} pl-10`}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="tel" value={`${countryCode} ${phoneNumber}`} readOnly className={`${inputClass} pl-10 bg-slate-50 text-slate-500`} />
                      </div>
                    )}
                  </div>
                </div>

                {!isCompleteProfile && (
                <div className="space-y-1.5">
                  <Label className="text-slate-600 text-xs font-medium">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showPassword ? "text" : "password"} placeholder="Create a secure password"
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pl-10 pr-10`} disabled={isLoading} required />
                    <button type="button" onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={password} />
                </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-slate-600 text-xs font-medium">Personal Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Your home or office address" value={address}
                      onChange={(e) => setAddress(e.target.value)} className={`${inputClass} pl-10`} disabled={isLoading} />
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-semibold text-sm">Company Information</h3>
                    <p className="text-slate-400 text-xs">Your business entity details</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-600 text-xs font-medium">Company Name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="e.g. Acme Solutions Pvt Ltd" value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)} className={`${inputClass} pl-10`} disabled={isLoading} required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-600 text-xs font-medium">Company Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Registered company address" value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)} className={`${inputClass} pl-10`} disabled={isLoading} />
                  </div>
                </div>
              </div>
            </div>

            {!isCompleteProfile && (
            <>
            {/* Franchise / Branch Information Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Store className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-semibold text-sm">Branch / Franchise Details</h3>
                    <p className="text-slate-400 text-xs">Your primary branch information</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs font-medium">Branch Name *</Label>
                    <input type="text" placeholder="e.g. Main Branch" value={franchiseName}
                      onChange={(e) => setFranchiseName(e.target.value)} className={inputClass} disabled={isLoading} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs font-medium">Branch Address</Label>
                    <input type="text" placeholder="Branch address" value={franchiseAddress}
                      onChange={(e) => setFranchiseAddress(e.target.value)} className={inputClass} disabled={isLoading} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs font-medium">City *</Label>
                    <input type="text" placeholder="City" value={franchiseCity}
                      onChange={(e) => setFranchiseCity(e.target.value)} className={inputClass} disabled={isLoading} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs font-medium">State *</Label>
                    <input type="text" placeholder="State" value={franchiseState}
                      onChange={(e) => setFranchiseState(e.target.value)} className={inputClass} disabled={isLoading} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs font-medium">Country</Label>
                    <input type="text" placeholder="Country" value={franchiseCountry}
                      onChange={(e) => setFranchiseCountry(e.target.value)} className={inputClass} disabled={isLoading} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs font-medium">PIN Code</Label>
                    <input type="text" placeholder="560001" value={franchisePinCode}
                      onChange={(e) => setFranchisePinCode(e.target.value)} className={inputClass} disabled={isLoading} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs font-medium">Branch Phone <span className="text-slate-400 font-normal">(optional)</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit Indian mobile or leave blank" value={franchisePhoneNumber}
                        onChange={handleFranchisePhoneChange} className={`${inputClass} pl-10`} disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs font-medium">Branch Email <span className="text-slate-400 font-normal">(optional)</span></Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" placeholder="Same as personal if blank" value={franchiseEmail}
                        onChange={(e) => setFranchiseEmail(e.target.value)} className={`${inputClass} pl-10`} disabled={isLoading} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isCompleteProfile ? (
                <button type="button" onClick={() => navigate("/owner")}
                  className="sm:w-auto h-12 px-6 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Back to dashboard
                </button>
              ) : (
                <button type="button" onClick={() => setStep(1)}
                  className="sm:w-auto h-12 px-6 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Start Over
                </button>
              )}
              <Button type="submit"
                className="flex-1 bg-[#1A7FC1] hover:bg-[#166EA8] text-white h-12 font-semibold rounded-xl shadow-lg shadow-[#1A7FC1]/20"
                disabled={isLoading}>
                {isCompleteProfile ? (isLoading ? "Saving..." : "Save profile") : (isLoading ? "Creating Account..." : "Create Business Account")}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </form>
        )}

      </div>
          </main>
        </div>
        {/* Footer below both cards so card heights align */}
        <div className="text-center mt-8 pb-6">
          <p className="text-slate-400 text-xs">
            By creating an account, you agree to our{" "}
            <Link to={`/terms-of-service?from=${encodeURIComponent(location.pathname)}`} target="_blank" rel="noopener noreferrer" className="text-[#1A7FC1] font-medium hover:underline">Terms of Service</Link>{" "}
            and{" "}
            <Link to={`/privacy-policy?from=${encodeURIComponent(location.pathname)}`} target="_blank" rel="noopener noreferrer" className="text-[#1A7FC1] font-medium hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
