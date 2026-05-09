import { Router } from "express";
import { providerSignUp } from "./provider-sign-up/index.js";
import { providerLogIn } from "./provider-password-log-in/index.js";
import { providerOTPLogIn } from "./provider-otp-log-in/index.js";
import { generateOTPEndpoint } from "./generate-otp/index.js";
import { verifyOTPEndpoint } from "./verify-otp/index.js";
import { changePasswordEndpoint } from "./change-password/index.js";
import { forgotPasswordSendOTPEndpoint } from "./forgot-password-send-otp/index.js";
import { forgotPasswordVerifyOTPEndpoint } from "./forgot-password-verify-otp/index.js";
import { forgotResetPasswordEndpoint } from "./forgot-reset-password/index.js";
import { verifyToken, verifyLoginToken, verifyCustomerToken } from "../../middleware/verify-token.js";
import { generateApiKeyEndpoint } from "./generate-api-key/index.js";
import { getApiKeyEndpoint } from "./get-api-key/index.js";
import { updateApiKeyEndpoint } from "./update-api-key/index.js";
import { getUserDetailsEndpoint } from "./get-user/index.js";
import { updateUserDetailsEndpoint } from "./update-user-details/index.js";
import { updateEmailEndpoint } from "./update-email/index.js";
import { googleLoginEndpoint } from "./google-login/index.js";
import { checkRegistrationStatusEndpoint } from "./check-registration-status/index.js";
import { checkUserEndpoint } from "./check-user/index.js";
import { unifiedSendOtpEndpoint, unifiedVerifyOtpEndpoint } from "./unified-auth/index.js";
import { selectRoleEndpoint } from "./select-role/index.js";

const userRouter = Router();

userRouter.post("/provider-sign-up", providerSignUp);
userRouter.post("/provider-log-in", providerLogIn);
userRouter.post("/provider-otp-log-in", providerOTPLogIn);
userRouter.post("/generate-otp", generateOTPEndpoint);
userRouter.post("/verify-otp", verifyOTPEndpoint);
userRouter.post("/google-login", googleLoginEndpoint);
userRouter.post("/check-registration-status", checkRegistrationStatusEndpoint);
userRouter.post("/check-user", checkUserEndpoint);
userRouter.post("/unified-send-otp", unifiedSendOtpEndpoint);
userRouter.post("/unified-verify-otp", unifiedVerifyOtpEndpoint);
// Multi-role authentication: allows user to explicitly select their role when multiple roles exist
userRouter.post("/select-role", selectRoleEndpoint);
userRouter.post("/change-password", verifyCustomerToken, changePasswordEndpoint);
userRouter.post("/forgot-password-send-otp", forgotPasswordSendOTPEndpoint);
userRouter.post("/forgot-password-verify-otp", forgotPasswordVerifyOTPEndpoint);
userRouter.post("/forgot-reset-password", verifyLoginToken, forgotResetPasswordEndpoint);
userRouter.post("/generate-api-key", verifyToken, generateApiKeyEndpoint);
userRouter.post("/get-api-key", verifyToken, getApiKeyEndpoint);
userRouter.post("/update-api-key", verifyToken, updateApiKeyEndpoint);

// New endpoints for user profile management
userRouter.get("/get-user", verifyCustomerToken, getUserDetailsEndpoint);
userRouter.put("/update-user-details", verifyCustomerToken, updateUserDetailsEndpoint);
userRouter.put("/update-email", verifyCustomerToken, updateEmailEndpoint);

export default userRouter;