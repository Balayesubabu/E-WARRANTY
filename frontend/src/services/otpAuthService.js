import api from "../utils/api";
import Cookies from "js-cookie";

/**
 * Check if an email has a draft registration (OTP verified but signup incomplete)
 */
export const checkRegistrationStatus = async (email) => {
  try {
    const response = await api.post("/user/check-registration-status", { email });
    return response.data?.data || { isDraft: false, isRegistered: false, status: "new" };
  } catch (error) {
    return { isDraft: false, isRegistered: false, status: "new" };
  }
};

export const requestLoginOtp = async ({ email, phone_number }) => {
  try {
    const response = await api.post("/user/generate-otp", {
      email,
      phone_number,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Request OTP for new user signup flow
 * This will create a new user if they don't exist
 */
export const requestSignupOtp = async ({ email, phone_number, country_code }) => {
  try {
    const response = await api.post("/user/generate-otp", {
      email,
      phone_number,
      country_code,
      is_registered: false,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Request forgot password OTP - supports customer, staff, and dealer
 * @param {Object} params - { email, phone_number, userType }
 * userType: 'customer' (default), 'staff', 'dealer'
 */
export const requestForgotPasswordOtp = async ({ email, phone_number, userType = 'customer' }) => {
  try {
    // Different endpoints for different user types
    let endpoint = "/user/forgot-password-send-otp";
    if (userType === 'staff') {
      endpoint = "/staff/forgot-password-send-otp";
    } else if (userType === 'dealer') {
      endpoint = "/dealer/forgot-password-send-otp";
    }
    
    const response = await api.post(endpoint, {
      email,
      phone_number,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loginWithOtp = async ({ email, phone_number, otp }) => {
  try {
    const response = await api.post("/customer/login-otp", {
      email,
      phone_number,
      otp,
    });

    const token = response.data?.data?.token;
    if (token) {
      Cookies.set("authToken", token, { sameSite: "lax" });
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyOtp = async ({ email, phone_number, otp }) => {
  try {
    const response = await api.post("/user/verify-otp", {
      email,
      phone_number,
      otp,
    });

    const token = response.data?.data?.token;
    if (token) {
      Cookies.set("authToken", token, { sameSite: "lax" });
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify forgot password OTP - supports customer, staff, and dealer
 * @param {Object} params - { email, phone_number, otp, userType }
 */
export const verifyForgotPasswordOtp = async ({ email, phone_number, otp, userType = 'customer' }) => {
  try {
    // Different endpoints for different user types
    let endpoint = "/user/forgot-password-verify-otp";
    if (userType === 'staff') {
      endpoint = "/staff/forgot-password-verify-otp";
    } else if (userType === 'dealer') {
      endpoint = "/dealer/forgot-password-verify-otp";
    }
    
    const response = await api.post(endpoint, {
      email,
      phone_number,
      otp,
    });

    const token = response.data?.data?.token;
    if (token) {
      Cookies.set("authToken", token, { sameSite: "lax" });
      localStorage.setItem("token", token);
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Reset forgot password - supports customer, staff, and dealer
 * @param {Object} params - { new_password, userType }
 */
export const resetForgotPassword = async ({ new_password, userType = 'customer' }) => {
  try {
    // Different endpoints for different user types
    let endpoint = "/user/forgot-reset-password";
    let headers = {};
    
    if (userType === 'staff') {
      endpoint = "/staff/forgot-reset-password";
      headers = { is_staff: "true" };
    } else if (userType === 'dealer') {
      endpoint = "/dealer/forgot-reset-password";
      headers = { is_dealer: "true" };
    }
    
    const response = await api.post(endpoint, { new_password }, { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
};
