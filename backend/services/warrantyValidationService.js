import {
  checkWarrantyCodeWithProviderById,
  getWarrantyCodeByAllfields,
  checkIfWarrantyCodeIsRegistered,
  getDealerByDealerKey,
  getDealerByDealerNameAndEmail,
} from "../controller/E-Warranty/Warranty-Customer/register-customer/query.js";

/**
 * Centralized warranty registration validation
 * Returns { valid: boolean, error?: { status, message }, warrantyCodeData?, dealer? }
 */
export const validateWarrantyRegistration = async (params) => {
  const { provider_id, warranty_code, product_name, product_id, serial_number, dealer_key, dealer_name, dealer_email, is_dealer, is_customer } = params;

  const belongsToProvider = await checkWarrantyCodeWithProviderById(provider_id, warranty_code);
  if (!belongsToProvider) {
    return { valid: false, error: { status: 404, message: "This warranty code is registered to a different seller. Please enter a valid code from the selected seller." } };
  }

  const warrantyCodeData = await getWarrantyCodeByAllfields(warranty_code, product_name, product_id, serial_number);
  if (!warrantyCodeData) {
    return { valid: false, error: { status: 404, message: "Unable to register and details are mismatch" } };
  }

  if (warrantyCodeData.warranty_code_status === "Active") {
    return { valid: false, error: { status: 400, message: "Warranty is already activated" } };
  }
  if (warrantyCodeData.warranty_code_status !== "Inactive") {
    return { valid: false, error: { status: 400, message: "Warranty cannot be activated from current status" } };
  }

  const alreadyRegistered = await checkIfWarrantyCodeIsRegistered(warranty_code, product_name, product_id, serial_number);
  if (alreadyRegistered) {
    return { valid: false, error: { status: 400, message: "Warranty code is already registered" } };
  }

  let dealer = null;
  if (is_dealer && dealer_key) dealer = await getDealerByDealerKey(dealer_key);
  else if (is_customer && dealer_name && dealer_email) dealer = await getDealerByDealerNameAndEmail(dealer_name, dealer_email);

  if ((is_dealer || is_customer) && !dealer) {
    return { valid: false, error: { status: 404, message: "Dealer not found" } };
  }

  if (dealer) {
    if (dealer.status !== "ACTIVE" || !dealer.is_active || dealer.is_deleted) {
      return { valid: false, error: { status: 403, message: "Dealer is inactive or deleted" } };
    }
    if (!warrantyCodeData.assigned_dealer_id || warrantyCodeData.assigned_dealer_id !== dealer.id) {
      return { valid: false, error: { status: 403, message: "This warranty code is not assigned to the selected dealer" } };
    }
  }

  return { valid: true, warrantyCodeData, dealer };
};
