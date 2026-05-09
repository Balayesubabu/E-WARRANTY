import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { superAdminLogin } from "../../services/authorizationService";

export function SuperAdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const authError = sessionStorage.getItem('authError');
    if (authError) {
      sessionStorage.removeItem('authError');
      toast.error(authError);
    }
  }, []);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      const normalizedUserType = String(user?.user_type ?? "").toLowerCase();
      const normalizedRole = String(user?.role ?? user?.canonical_role?.code ?? "").toUpperCase();
      const isSuperAdmin =
        normalizedUserType === "super_admin" || normalizedRole === "SUPER_ADMIN";

      if (token && isSuperAdmin) {
        navigate("/super-admin", { replace: true });
      }
    } catch {}
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required");
      return;
    }

    setIsLoading(true);
    try {
      await superAdminLogin({ email: email.trim(), password });
      toast.success("Welcome back!");
      navigate("/super-admin", { replace: true });
    } catch (error) {
      const msg = error?.response?.data?.message || "Invalid email or password";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-[#1A7FC1] to-[#0F5F91] pt-14 pb-24 px-6 rounded-b-[2.5rem] shadow-lg">
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <img src="/ewarrantify-logo.png" alt="E-Warrantify" className="h-12 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white">E-Warrantify</h1>
          <p className="text-white/80 mt-1 text-sm">Super Admin Sign In</p>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-center text-slate-600 text-sm">
                Enter your Super Admin credentials.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    placeholder="superadmin@ewarrantyfy.com"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 focus:border-[#1A7FC1]"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
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
                disabled={isLoading || !email.trim() || !password.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#1A7FC1] hover:bg-[#0F5F91] text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 transition-colors"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100">
              {/* <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-[#1A7FC1] hover:opacity-80 font-medium text-sm"
              >
                Back to standard login
              </button> */}
            </div>
          </div>

          <p className="text-center text-slate-400 text-xs mt-6 mb-8">eWarranty v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
