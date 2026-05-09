import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Building2, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { IconInput } from "../ui/icon-input";
import { Label } from "../ui/label";
import { AnimatedDiv } from "../ui/animated-div";
import { ownerLogin } from "../../services/authorizationService";
import { toast } from "sonner";

export function OwnerLogin() {
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!emailOrPhone || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      // Determine if input is email or phone number
      const isEmail = emailOrPhone.includes("@");
      
      const credentials = {
        ...(isEmail ? { email: emailOrPhone.trim() } : { phone_number: emailOrPhone.trim() }),
        password,
      };

      const response = await ownerLogin(credentials);
      
      toast.success("Login successful! Welcome back, Owner.");
      navigate("/home");
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Invalid email/phone or password";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 max-w-md mx-auto">
      <AnimatedDiv
        variant="fadeInUp"
        className="flex-1 flex flex-col justify-center space-y-8"
      >
        {/* Logo and header */}
        <div className="text-center space-y-4">
          <AnimatedDiv
            variant="scaleIn"
            className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl"
          >
            <Building2 className="w-10 h-10 text-white" strokeWidth={2} />
          </AnimatedDiv>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Business Owner Login</h1>
            <p className="text-slate-600 mt-2">
              Sign in to manage your warranty business
            </p>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700">
              Email / Mobile Number
            </Label>

            <IconInput
              id="email"
              type="text"
              icon={Mail}
              placeholder="Enter your email or mobile"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              className="h-14 rounded-xl border-slate-200"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="password" className="text-slate-700">
              Password
            </Label>

            <IconInput
              id="password"
              type={showPassword ? "text" : "password"}
              icon={Lock}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 rounded-xl border-slate-200 pr-12"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-[50px] -translate-y-1/2 text-slate-500 hover:text-slate-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-6 h-6" />
              ) : (
                <Eye className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Forgot Password */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              className="text-emerald-600 hover:opacity-80 transition-opacity font-medium text-sm"
              onClick={() =>
                navigate("/email-for-otp", {
                  state: { flow: "forgot-password" },
                })
              }
            >
              Forgot Password?
            </button>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white h-14 font-bold rounded-xl shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login as Owner"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </form>

        {/* Sign up link */}
        <div className="text-center space-y-3">
          <div>
            <span className="text-slate-600">Don't have a business account? </span>
            <button
              type="button"
              onClick={() => navigate("/owner-signup")}
              className="text-emerald-600 hover:opacity-80 transition-opacity font-medium"
            >
              Register Business
            </button>
          </div>
          
          {/* Link to customer login */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-slate-500 text-sm">Are you a customer? </span>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[#1A7FC1] hover:opacity-80 transition-opacity font-medium text-sm"
            >
              Customer Login
            </button>
          </div>
        </div>
      </AnimatedDiv>
    </div>
  );
}
