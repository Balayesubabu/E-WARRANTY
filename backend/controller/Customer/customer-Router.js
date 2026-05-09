import { Router } from "express";
import { registerCustomer } from "./register/index.js";
import { loginCustomer } from "./login/index.js";
import { loginCustomerWithOtp } from "./login-otp/index.js";
import {
  customerAuthEndpoint,
  customerVerifyOtpEndpoint,
  customerCompleteProfileEndpoint,
} from "./passwordless-auth/index.js";
import {
  createCustomerSupportTicket,
  getCustomerSupportTickets,
} from "./support-tickets/index.js";
import { verifyCustomerToken } from "../../middleware/verify-token.js";

const customerRouter = Router();

// Legacy endpoints (kept for backward compatibility)
customerRouter.post("/register", registerCustomer);
customerRouter.post("/login", loginCustomer);
customerRouter.post("/login-otp", loginCustomerWithOtp);

// Passwordless OTP authentication
customerRouter.post("/auth", customerAuthEndpoint);
customerRouter.post("/verify-auth-otp", customerVerifyOtpEndpoint);
customerRouter.post("/complete-profile", verifyCustomerToken, customerCompleteProfileEndpoint);

// Customer support tickets
customerRouter.post("/support-tickets", verifyCustomerToken, createCustomerSupportTicket);
customerRouter.get("/my-support-tickets", verifyCustomerToken, getCustomerSupportTickets);

export default customerRouter;
