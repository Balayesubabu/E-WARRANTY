import api from "../utils/api";

// export const emailVerification = async ({ email, subject, message }) => {
//     try {
//         const response = await api.post("/emailVerification", {
//             email,
//             subject,
//             message,
//         });
//         return response.data;
//     } catch (error) {
//         throw error.response?.data?.message || error.message || "Email verification failed";
//     }
// }

export const sendOtpEmail = async ({ email }) => {
  try {
    const response = await api.post("/send-otp", {
      to: email,
      // subject: "Password Reset OTP",
    });
    return response.data;
  } catch (error) {
    throw (
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "OTP email sending failed"
    );
  }
};

export const dealerRegistrationEmail = async ({ to, byEmail }) => {
  try {
    const response = await api.post("/dealer-registration", {
      to,
      byEmail,
    });
    return response.data;
  } catch (error) {
    throw (
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Dealer registration email sending failed" 
    );
  }
};