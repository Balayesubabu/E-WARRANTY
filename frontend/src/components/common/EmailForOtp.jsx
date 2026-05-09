import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "../ui/button";
import { IconInput } from "../ui/icon-input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { requestForgotPasswordOtp, requestLoginOtp } from "../../services/otpAuthService";
import { AuthPageLayout } from "./AuthPageLayout";

export function EmailForOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [contact, setContact] = useState(() => location.state?.contact ?? "");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (value) => {
    if (value && value.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setEmailError("Please enter a valid email address");
        return;
      }
    }
    setEmailError("");
  };
  const flow = location.state?.flow || "forgot-password";
  const userType = location.state?.userType || "customer";

  const headerSubtitle =
    flow === "login-otp" ? "Sign in with a code" : "Password recovery";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contact) {
      toast.error("Please enter your email or phone number");
      return;
    }

    setIsLoading(true);
    try {
      const isEmail = contact.includes("@");
      const requestOtp =
        flow === "login-otp" ? requestLoginOtp : requestForgotPasswordOtp;
      const response = await requestOtp({
        email: isEmail ? contact : undefined,
        phone_number: !isEmail ? contact : undefined,
        userType,
      });
      toast.success(response?.message || "OTP sent successfully");
      const otpState = {
        email: isEmail ? contact : "",
        phone_number: !isEmail ? contact : "",
        flow,
        userType,
        otpExpiresAt: response?.expiresInMs,
      };
      sessionStorage.setItem("otpState", JSON.stringify(otpState));
      navigate("/otp", { state: otpState });
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "OTP sending failed";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout headerSubtitle={headerSubtitle} showBackLink={false}>
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Verification code</h2>
        <p className="text-sm text-slate-600">
          Enter your registered email or phone. We&apos;ll send a one-time code to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="verification-contact" className="text-slate-700">
            Email or phone
          </Label>
          <IconInput
            id="verification-contact"
            type="text"
            icon={Mail}
            placeholder="Enter your email or phone"
            value={contact}
            onChange={(e) => {
              setContact(e.target.value);
              validateEmail(e.target.value);
            }}
            className={`h-14 rounded-xl ${emailError ? "border-red-400" : "border-slate-200"}`}
            disabled={isLoading}
          />
          {emailError ? (
            <p className="text-red-500 text-xs">{emailError}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="w-full bg-[#1A7FC1] hover:bg-[#0F5F91] text-white h-12 font-semibold rounded-xl shadow-lg"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send verification code"}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </form>

      {/* <p className="text-center text-slate-500 text-sm">
        Remember your password?{" "}
        <Link to="/login" className="text-[#1A7FC1] font-medium hover:opacity-80">
          Sign in
        </Link>
      </p> */}
    </AuthPageLayout>
  );
}
