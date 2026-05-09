import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "../ui/button";
import { IconInput } from "../ui/icon-input";
import { Label } from "../ui/label";
import { PasswordStrengthMeter } from "./PasswordStrengthMeter";
import { toast } from "sonner";
import { changePassword } from "../../services/authorizationService";
import { resetForgotPassword } from "../../services/otpAuthService";
import { AuthPageLayout } from "./AuthPageLayout";

export function ChangePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const flow = location.state?.flow || "forgot-password";
  const userType = location.state?.userType || "customer";
  useEffect(() => {
    const stateEmail = location.state?.email;
    if (typeof stateEmail === "string" && stateEmail.trim()) {
      setEmail(stateEmail);
    }
  }, [location.state]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if ((flow !== "forgot-password" && !email) || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response =
        flow === "forgot-password"
          ? await resetForgotPassword({ new_password: newPassword, userType })
          : await changePassword({ email, newPassword });
      toast.success(response.message);
      navigate("/login");
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Password reset failed";
      toast.error(errorMessage);
      console.log("Error: ", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout headerSubtitle="Choose a new password">
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Reset password</h2>
        <p className="text-sm text-slate-600">
          {flow === "forgot-password"
            ? "Set a new password for your business account."
            : "Enter your email and choose a new password."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="reset-email" className="text-slate-700">
            Email address
          </Label>
          <IconInput
            id="reset-email"
            type="email"
            icon={Mail}
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            className="h-14 rounded-xl border-slate-200"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-slate-700">
            New password
          </Label>
          <div className="relative">
            <IconInput
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              icon={Lock}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="h-14 rounded-xl border-slate-200 pr-12"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <PasswordStrengthMeter password={newPassword} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-slate-700">
            Confirm password
          </Label>
          <div className="relative">
            <IconInput
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              icon={Lock}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="h-14 rounded-xl border-slate-200 pr-12"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#1A7FC1] hover:bg-[#0F5F91] text-white h-12 font-semibold rounded-xl shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Reset password"}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </form>
    </AuthPageLayout>
  );
}
