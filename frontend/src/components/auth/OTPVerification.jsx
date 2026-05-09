import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import {
  loginWithOtp,
  requestForgotPasswordOtp,
  requestLoginOtp,
  verifyForgotPasswordOtp,
  verifyOtp,
} from "../../services/otpAuthService";
import { AuthPageLayout } from "../common/AuthPageLayout";

export function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedOtpState = (() => {
    try {
      const raw = sessionStorage.getItem("otpState");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  })();
  const email = location.state?.email || storedOtpState.email || "";
  const phoneNumber = location.state?.phone_number || storedOtpState.phone_number || "";
  const flow = location.state?.flow || storedOtpState.flow || "verify-otp";
  const userType = location.state?.userType || storedOtpState.userType || "customer";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  const headerSubtitle =
    flow === "login-otp"
      ? "Sign in with a code"
      : flow === "forgot-password"
        ? "Password recovery"
        : "Verification";

  useEffect(() => {
    if (!email && !phoneNumber) {
      toast.error("Email or phone number is missing. Please request OTP again.");
      navigate("/login");
      return;
    }
  }, [email, phoneNumber, navigate]);

  useEffect(() => {
    const expiresInMs =
      location.state?.expiresInMs ??
      location.state?.otpExpiresAt ??
      storedOtpState.otpExpiresAt;
    if (typeof expiresInMs === "number" && expiresInMs > 0) {
      setTimer(Math.ceil(expiresInMs / 1000));
    }
  }, [location.state]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter complete OTP");
      return;
    }

    if (timer <= 0) {
      toast.error("OTP expired. Please resend.");
      return;
    }

    setIsVerifying(true);
    try {
      if (flow === "login-otp") {
        await loginWithOtp({
          email: email || undefined,
          phone_number: phoneNumber || undefined,
          otp: otpCode,
          userType,
        });
      } else if (flow === "forgot-password") {
        await verifyForgotPasswordOtp({
          email: email || undefined,
          phone_number: phoneNumber || undefined,
          otp: otpCode,
          userType,
        });
      } else {
        await verifyOtp({
          email: email || undefined,
          phone_number: phoneNumber || undefined,
          otp: otpCode,
        });
      }
      toast.success("Verification successful!");
      if (flow === "login-otp") {
        navigate("/home");
      } else if (flow === "forgot-password") {
        navigate("/change-password", { state: { email, phone_number: phoneNumber, flow, userType } });
      } else {
        navigate("/signup", { state: { email, phone_number: phoneNumber } });
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "OTP verification failed";
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const requestOtp = flow === "login-otp" ? requestLoginOtp : requestForgotPasswordOtp;
      const response = await requestOtp({
        email: email || undefined,
        phone_number: phoneNumber || undefined,
        userType,
      });
      const expiresInMs = response?.expiresInMs;
      const nextTimer =
        typeof expiresInMs === "number" && expiresInMs > 0
          ? Math.ceil(expiresInMs / 1000)
          : 60;
      setTimer(nextTimer);
      setOtp(["", "", "", "", "", ""]);
      toast.success("OTP resent successfully");
      inputRefs.current[0]?.focus();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "OTP sending failed";
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthPageLayout headerSubtitle={headerSubtitle}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        <div className="space-y-2 text-center">
          <h2 className="text-lg font-semibold text-slate-900">Enter your code</h2>
          <p className="text-sm text-slate-600">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-slate-900">{email || phoneNumber}</span>
          </p>
        </div>

        <div className="flex gap-2 sm:gap-3 justify-center">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg border-2 border-slate-200 rounded-xl focus:border-[#1A7FC1] focus:outline-none focus:ring-2 focus:ring-[#1A7FC1]/20 text-slate-900"
            />
          ))}
        </div>

        <Button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying || otp.join("").length !== 6 || (!email && !phoneNumber)}
          className="w-full h-12 bg-[#1A7FC1] hover:bg-[#0F5F91] text-white font-semibold rounded-xl shadow-lg"
        >
          {isVerifying ? "Verifying..." : "Verify code"}
        </Button>

        <div className="text-center">
          {timer > 0 ? (
            <p className="text-slate-500 text-sm">
              Resend code in <span className="text-[#1A7FC1] font-medium">{timer}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-[#1A7FC1] hover:opacity-80 text-sm font-medium"
              disabled={isResending}
            >
              {isResending ? "Resending..." : "Resend code"}
            </button>
          )}
        </div>
      </motion.div>
    </AuthPageLayout>
  );
}
