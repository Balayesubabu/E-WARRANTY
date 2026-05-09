import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Mail, ArrowRight, Loader2, Lock, Eye, EyeOff, Users } from "lucide-react";
import { toast } from "sonner";
import {
  checkUser,
  ownerLogin,
  staffLogin,
  dealerLogin,
  serviceCenterLogin,
  googleLogin,
} from "../../services/authorizationService";

/** Password sign-in on this page: owner, staff, dealer, service center. Customers use /customer-auth (OTP). */
const BUSINESS_PASSWORD_ROLES = new Set(["owner", "staff", "dealer", "service_center"]);

const filterBusinessRoles = (roles) =>
  Array.isArray(roles) ? roles.filter((r) => BUSINESS_PASSWORD_ROLES.has(r)) : [];

const isBusinessRole = (role) => role != null && BUSINESS_PASSWORD_ROLES.has(role);

/**
 * True if checkUser payload indicates at least one business (password) role.
 * Matches the role logic used in handleSignIn before password login.
 */
const checkUserResponseHasBusinessRole = (data) => {
  if (!data?.exists) return false;
  if (data.multipleRoles && Array.isArray(data.roles) && data.roles.length > 1) {
    return filterBusinessRoles(data.roles).length > 0;
  }
  return isBusinessRole(data.user_type);
};

const FORGOT_PASSWORD_NO_ACCOUNT_MESSAGE = "No account found with this email";

/** Shown when password/API rejects owner, staff, dealer, or service center credentials. */
const BUSINESS_LOGIN_FAILED_MESSAGE =
  "Invalid email or password. This page is only for business accounts: owner, staff, dealer, or service center.";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  // Steps: contact | select_role | not_found — business password only; customers use /customer-auth
  const [step, setStep] = useState("contact");
  const [contact, setContact] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const googleBtnRef = useRef(null);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Strip deprecated `?role=...` param so users always see plain `/login`.
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    if (params.has("role")) {
      params.delete("role");
      const rest = params.toString();
      navigate(rest ? `/login?${rest}` : "/login", { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    const authError = sessionStorage.getItem('authError');
    if (authError) {
      sessionStorage.removeItem('authError');
      toast.error(authError);
    }
  }, []);

  const handleGoogleResponse = useCallback(
    async (response) => {
      if (!response?.credential) return;
      const role = "owner";
      setIsLoading(true);
      try {
        await googleLogin({ idToken: response.credential, role });
        toast.success("Welcome!");
        if (role === "owner") {
          navigate("/owner", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
      } catch (err) {
        const status = err?.response?.status;
        const redirectRole = err?.response?.data?.data?.redirectRole;
        const message = err?.response?.data?.message || "Google login failed";

        if (redirectRole === "owner") {
          try {
            await googleLogin({ idToken: response.credential, role: "owner" });
            toast.success("Welcome!");
            navigate("/owner", { replace: true });
          } catch (e) {
            toast.error(e?.response?.data?.message || "Google login failed");
          }
        } else if (redirectRole) {
          const roleLabels = { owner: "Business Owner", staff: "Staff", dealer: "Dealer" };
          toast.info(`Redirecting to ${roleLabels[redirectRole] || redirectRole} login...`);
          navigate("/login", { replace: true });
        } else if (role === "owner" && status === 404) {
          toast.error("No business account found. Please register as Owner first, then sign in with Google.");
          setTimeout(() => navigate("/owner-signup", { replace: true }), 1500);
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
    if (!GOOGLE_CLIENT_ID || step !== "contact") return;
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

  const notifyCustomerWrongPortal = useCallback(
    (email) => {
      toast.error("This email is a personal customer account.", {
        description: "Customers sign in with a one-time code sent to email or mobile—not a password here.",
        duration: 9000,
        action: {
          label: "Customer sign-in",
          onClick: () => navigate("/customer-auth", { state: { email } }),
        },
      });
    },
    [navigate]
  );

  /** Password login for business roles only. Returns true on success. */
  const submitBusinessPasswordLogin = async (role, trimmedContact, pwd) => {
    if (!isBusinessRole(role)) {
      toast.error("This sign-in page is for business accounts only.");
      return false;
    }
    const isEmail = trimmedContact.includes("@");
    try {
      if (role === "owner") {
        await ownerLogin({
          ...(isEmail ? { email: trimmedContact } : { phone_number: trimmedContact }),
          password: pwd,
        });
        toast.success("Welcome back!");
        navigate("/owner", { replace: true });
      } else if (role === "staff") {
        await staffLogin({
          ...(isEmail ? { email: trimmedContact } : { phone: trimmedContact }),
          password: pwd,
        });
        toast.success("Welcome back!");
        navigate("/staff", { replace: true });
      } else if (role === "dealer") {
        await dealerLogin({
          ...(isEmail ? { email: trimmedContact } : { phone: trimmedContact }),
          password: pwd,
        });
        toast.success("Welcome back!");
        navigate("/dealer", { replace: true });
      } else if (role === "service_center") {
        await serviceCenterLogin({
          ...(isEmail ? { email: trimmedContact } : { phone: trimmedContact }),
          password: pwd,
        });
        toast.success("Welcome back!");
        navigate("/service-center", { replace: true });
      }
      return true;
    } catch (error) {
      const status = error?.response?.status;
      const raw = error?.response?.data?.message;
      const serverMsg =
        typeof raw === "string" && raw.trim().length > 0 && raw.length < 240 ? raw.trim() : null;
      if (status === 401 || status === 403) {
        toast.error(serverMsg || BUSINESS_LOGIN_FAILED_MESSAGE);
      } else if (status === 404) {
        toast.error(serverMsg || "No business account found for these credentials.");
      } else {
        toast.error(serverMsg || "Sign in failed. Please try again.");
      }
      return false;
    }
  };

  const mapForgotPasswordUserType = (data) => {
    if (data?.multipleRoles && data.roles?.length > 1) {
      const biz = filterBusinessRoles(data.roles);
      if (biz.length === 0) return "customer";
      if (biz.includes("staff")) return "staff";
      if (biz.includes("dealer")) return "dealer";
      if (biz.includes("service_center")) return "service_center";
      if (biz.includes("owner")) return "owner";
      return "customer";
    }
    if (data?.user_type === "staff") return "staff";
    if (data?.user_type === "dealer") return "dealer";
    if (data?.user_type === "service_center") return "service_center";
    if (data?.user_type === "owner") return "owner";
    return "customer";
  };

  const handleForgotPassword = async () => {
    const trimmed = contact.trim();
    if (!trimmed) {
      toast.error("Please enter your email first");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    try {
      const data = await checkUser(trimmed);
      if (!data?.exists) {
        toast.error(FORGOT_PASSWORD_NO_ACCOUNT_MESSAGE);
        return;
      }
      if (!checkUserResponseHasBusinessRole(data)) {
        toast.error(FORGOT_PASSWORD_NO_ACCOUNT_MESSAGE);
        return;
      }
      const userType = mapForgotPasswordUserType(data);
      navigate("/email-for-otp", {
        state: { flow: "forgot-password", userType, contact: trimmed },
      });
    } catch (error) {
      const msg = error?.response?.data?.message || "Could not verify account";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    const trimmed = contact.trim();
    if (!trimmed) {
      toast.error("Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const data = await checkUser(trimmed);

      if (!data?.exists) {
        setStep("not_found");
        return;
      }

      if (data.multipleRoles && data.roles?.length > 1) {
        const businessOnly = filterBusinessRoles(data.roles);
        if (businessOnly.length === 0) {
          notifyCustomerWrongPortal(trimmed);
          return;
        }
        if (businessOnly.length === 1) {
          if (!password.trim()) {
            toast.error("Please enter your password");
            return;
          }
          await submitBusinessPasswordLogin(businessOnly[0], trimmed, password);
          return;
        }
        setAvailableRoles(businessOnly);
        setSelectedRole(businessOnly[0]);
        setStep("select_role");
        toast.info("Multiple business roles found. Choose one and enter your password.");
        return;
      }

      const userType = data.user_type;

      if (userType === "customer" || !isBusinessRole(userType)) {
        notifyCustomerWrongPortal(trimmed);
        return;
      }

      if (!password.trim()) {
        toast.error("Please enter your password");
        return;
      }

      await submitBusinessPasswordLogin(userType, trimmed, password);
    } catch (error) {
      const msg = error?.response?.data?.message || "Sign in failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToContact = () => {
    setStep("contact");
    setAvailableRoles([]);
    setSelectedRole(null);
    setPassword("");
  };

  // Handle role selection for multi-role users
  // This enables context-aware authentication in real-world SaaS scenarios
  const handleRoleSelect = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    if (!isBusinessRole(selectedRole)) {
      notifyCustomerWrongPortal(contact.trim());
      return;
    }

    if (!password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      await submitBusinessPasswordLogin(selectedRole, contact.trim(), password);
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to proceed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const roleLabels = {
    owner: "Business Owner",
    staff: "Staff",
    dealer: "Dealer",
    service_center: "Service Center",
    customer: "Customer",
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 shrink-0">
        {/* <div className="max-w-md mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-end gap-3">
          <Link
            to="/customer-auth"
            state={contact.trim() ? { email: contact.trim() } : undefined}
            className="text-sm font-medium text-[#1A7FC1] hover:underline"
          >
            Customer sign-in (code)
          </Link>
          <span className="text-slate-300" aria-hidden>
            |
          </span>
          <Link to="/owner-signup" className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">
            Register business
          </Link>
        </div> */}
      </div>
      <div className="bg-gradient-to-br from-[#1A7FC1] to-[#0F5F91] pt-14 pb-24 px-6 rounded-b-[2.5rem] shadow-lg">
        <div className="max-w-md mx-auto text-center">
          <Link
            to="/landing"
            aria-label="Go to landing page"
            className="inline-flex flex-col items-center justify-center gap-2.5 mb-2 rounded-xl px-2 py-1 hover:opacity-95 transition-opacity focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
          >
            <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-12 w-auto" />
            <h1 className="text-2xl font-bold text-white">E-Warrantify</h1>
          </Link>
          <p className="text-white/80 mt-1 text-sm">
            {step === "contact"
              ? ""
              : step === "not_found"
                ? "No account found"
                : step === "select_role"
                  ? "Select your business role"
                  : "Sign in"}
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
            {step === "contact" && (
              <form onSubmit={handleSignIn} className="space-y-5">
                <p className="text-center text-slate-600 text-sm">
                  For <span className="font-medium text-slate-800">owners, staff, dealers, and service centers</span> only.
                </p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                     Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={contact}
                      onChange={(e) => setContact(e.target.value.toLowerCase())}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                      autoFocus
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password <span className="text-slate-400 font-normal"></span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#1A7FC1] hover:bg-[#0F5F91] text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="w-full text-center text-[#1A7FC1] font-medium text-sm hover:opacity-80 disabled:opacity-50"
                >
                  Forgot Password?
                </button>

                {/* <p className="text-center text-xs text-slate-500 pt-1">
                  Personal warranty customer?{" "}
                  <Link
                    to="/customer-auth"
                    state={contact.trim() ? { email: contact.trim() } : undefined}
                    className="text-[#1A7FC1] font-medium hover:underline"
                  >
                    Sign in with email or mobile code
                  </Link>
                </p> */}

                {GOOGLE_CLIENT_ID && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-xs text-slate-400">or</span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                    <p className="text-center text-sm font-medium text-slate-700">
                      Continue with Google (Business Owner)
                    </p>
                    <div ref={googleBtnRef} className="flex justify-center" />
                    <p className="text-center text-xs text-slate-500">
                      Google sign-in is available only for Business Owner on this page.
                    </p>
                  </>
                )}

                {/* <div className="text-center pt-2 border-t border-slate-100">
                  <span className="text-slate-500 text-sm">Don&apos;t have an account? </span>
                  <button
                    type="button"
                    onClick={() => navigate("/register-account")}
                    className="text-[#1A7FC1] hover:opacity-80 font-medium text-sm"
                  >
                    Create an account
                  </button>
                </div> */}
              </form>
            )}

            {step === "not_found" && (
              <div className="space-y-5 text-center">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-slate-700 font-medium">No account found</p>
                  <p className="text-slate-500 text-sm mt-1">
                    No business or customer account uses{" "}
                    <span className="font-medium text-slate-700">{contact}</span>.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/customer-auth", { state: { email: contact.trim() || undefined } })
                    }
                    className="w-full py-3 bg-[#1A7FC1] hover:bg-[#0F5F91] text-white font-semibold rounded-xl shadow-md transition-colors"
                  >
                    Customer sign-in or register (code)
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/owner-signup", { state: { email: contact.trim() || undefined } })}
                    className="w-full py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 font-semibold text-sm hover:bg-amber-100 transition-colors"
                  >
                    Register your business
                  </button>
                  <button
                    type="button"
                    onClick={resetToContact}
                    className="w-full text-slate-500 text-sm hover:text-slate-700"
                  >
                    Try a different email
                  </button>
                </div>
              </div>
            )}

            {step === "select_role" && (
              <form onSubmit={handleRoleSelect} className="space-y-5">
                <div className="text-center">
                  <Users className="w-10 h-10 text-[#1A7FC1] mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Multiple business roles for</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{contact}</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-sm text-blue-800 text-center">
                    Choose your role and enter your password
                  </p>
                </div>

                <div className="space-y-3">
                  {availableRoles.map((role) => (
                    <label
                      key={role}
                      className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedRole === role
                          ? "border-[#1A7FC1] bg-[#1A7FC1]/5"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={selectedRole === role}
                        onChange={() => setSelectedRole(role)}
                        className="w-4 h-4 text-[#1A7FC1] focus:ring-[#1A7FC1]"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{roleLabels[role] || role}</p>
                        <p className="text-xs text-slate-500">
                          {role === "owner" && "Manage your business dashboard"}
                          {role === "staff" && "Access staff portal"}
                          {role === "dealer" && "Access dealer portal"}
                          {role === "service_center" && "Access service center portal"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {selectedRole && isBusinessRole(selectedRole) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password-role"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !selectedRole}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#1A7FC1] hover:bg-[#0F5F91] text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continue as {roleLabels[selectedRole] || selectedRole}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetToContact}
                  className="w-full text-center text-slate-500 text-sm hover:text-slate-700"
                >
                  Use a different email or phone
                </button>
              </form>
            )}

          </div>

          <p className="text-center text-slate-400 text-xs mt-6 mb-8">eWarranty v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
