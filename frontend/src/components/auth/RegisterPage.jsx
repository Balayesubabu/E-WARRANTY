import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Users } from "lucide-react";
// import { toast } from "sonner";
// import { googleLogin } from "../../services/authorizationService";

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  // --- Google sign-up (commented out) ---
  // const [googleRole, setGoogleRole] = useState("customer");
  // const [isLoading, setIsLoading] = useState(false);
  // const googleBtnRef = useRef(null);
  // const googleRoleRef = useRef("customer");
  // const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  // useEffect(() => {
  //   googleRoleRef.current = googleRole;
  // }, [googleRole]);
  // const handleGoogleResponse = useCallback(
  //   async (response) => {
  //     if (!response?.credential) return;
  //     const role = googleRoleRef.current;
  //     setIsLoading(true);
  //     try {
  //       await googleLogin({ idToken: response.credential, role });
  //       toast.success("Welcome!");
  //       if (role === "owner") {
  //         navigate("/owner", { replace: true });
  //       } else {
  //         navigate("/home", { replace: true });
  //       }
  //     } catch (err) {
  //       const status = err?.response?.status;
  //       const redirectRole = err?.response?.data?.data?.redirectRole;
  //       const message = err?.response?.data?.message || "Google sign up failed";
  //       if (redirectRole === "owner") {
  //         try {
  //           await googleLogin({ idToken: response.credential, role: "owner" });
  //           toast.success("Welcome!");
  //           navigate("/owner", { replace: true });
  //         } catch (e) {
  //           toast.error(e?.response?.data?.message || "Google sign up failed");
  //         }
  //       } else if (redirectRole) {
  //         const roleLabels = { owner: "Business Owner", staff: "Staff", dealer: "Dealer" };
  //         toast.info(`This account is already registered as ${roleLabels[redirectRole] || redirectRole}. Use Login instead.`);
  //         navigate("/login", { replace: true });
  //       } else if (role === "owner" && status === 404) {
  //         toast.error("No business account found. Register as Owner first using the form above, then you can use Google to sign in later.");
  //       } else {
  //         toast.error(message);
  //       }
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   },
  //   [navigate]
  // );
  // useEffect(() => {
  //   if (!GOOGLE_CLIENT_ID) return;
  //   const initGoogle = () => {
  //     if (!window.google?.accounts?.id) return;
  //     window.google.accounts.id.initialize({
  //       client_id: GOOGLE_CLIENT_ID,
  //       callback: handleGoogleResponse,
  //     });
  //     if (googleBtnRef.current) {
  //       googleBtnRef.current.innerHTML = "";
  //       window.google.accounts.id.renderButton(googleBtnRef.current, {
  //         type: "standard",
  //         theme: "outline",
  //         size: "large",
  //         width: 360,
  //         text: "continue_with",
  //         shape: "pill",
  //       });
  //     }
  //   };
  //   if (window.google?.accounts?.id) {
  //     initGoogle();
  //   } else {
  //     const script = document.createElement("script");
  //     script.src = "https://accounts.google.com/gsi/client";
  //     script.async = true;
  //     script.defer = true;
  //     script.onload = initGoogle;
  //     document.head.appendChild(script);
  //   }
  // }, [handleGoogleResponse]);
  // --- end Google sign-up ---

  const handleRegisterAsOwner = () => {
    navigate("/owner-signup", { state: { email: email.trim() || undefined } });
  };

  const handleRegisterAsCustomer = () => {
    navigate("/customer-auth", { state: { email: email.trim() || undefined } });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-[#1A7FC1] to-[#0F5F91] pt-14 pb-24 px-6 rounded-b-[2.5rem] shadow-lg">
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-12 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white">E-Warrantify</h1>
          <p className="text-white/80 mt-1 text-sm">Create your account</p>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
            <p className="text-center text-sm font-medium text-slate-700">
              Choose how you want to register
            </p>

            <div>
              {/* <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label> */}
              {/* <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                />
              </div> */}
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleRegisterAsOwner}
                className="w-full flex items-center gap-3 py-3 px-4 bg-[#1A7FC1] hover:bg-[#0F5F91] text-white font-semibold rounded-xl shadow-md transition-colors text-left"
              >
                <Building2 className="w-5 h-5 shrink-0" />
                <span>Register as Owner</span>
              </button>
              <button
                type="button"
                onClick={handleRegisterAsCustomer}
                className="w-full flex items-center gap-3 py-3 px-4 border-2 border-[#1A7FC1] text-[#1A7FC1] hover:bg-[#1A7FC1]/5 font-semibold rounded-xl transition-colors text-left"
              >
                <Users className="w-5 h-5 shrink-0" />
                <span>Register as Customer</span>
              </button>
            </div>

            {/* Google sign-up UI (commented out)
            {GOOGLE_CLIENT_ID && (
              <>
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400">or</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <p className="text-center text-sm font-medium text-slate-700">Continue with Google as</p>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setGoogleRole("customer")}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${googleRole === "customer" ? "bg-[#1A7FC1] text-white" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleRole("owner")}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${googleRole === "owner" ? "bg-[#1A7FC1] text-white" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    Business Owner
                  </button>
                </div>
                <div ref={googleBtnRef} className="flex justify-center" />
                {isLoading && (
                  <div className="flex justify-center">
                    <Loader2 className="w-5 h-5 text-[#1A7FC1] animate-spin" />
                  </div>
                )}
              </>
            )}
            */}

            <div className="pt-4 border-t border-slate-100 text-center">
              <span className="text-slate-500 text-sm">Already have an account? </span>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-[#1A7FC1] hover:opacity-80 font-medium text-sm"
              >
                Login
              </button>
            </div>
          </div>

          <p className="text-center text-slate-400 text-xs mt-6 mb-8">eWarranty v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
