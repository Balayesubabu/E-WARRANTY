import { ProviderWarrantyCustomer } from "../../../../prisma/db-models.js";

/**
 * Get warranty customer details by contact (phone or email)
 * Used after OTP is verified from standalone Otp table
 * Does NOT check OTP - OTP verification is handled separately
 */
const getWarrantyCustomerDetailsByContact = async (contact) => {
    const contactIsEmail = contact.includes("@");
    
    const provider_warranty_customer = await ProviderWarrantyCustomer.findMany({
        where: contactIsEmail 
            ? { email: contact }
            : { phone: contact },
        include: {
            provider_warranty_code: {
                include: {
                    provider: {
                        select: {
                            company_name: true
                        }
                    }
                }
            },
        }
    });
    return provider_warranty_customer;
};

// ═══════════════════════════════════════════════════════════════
// Legacy functions - kept for backward compatibility
// These check OTP from ProviderWarrantyCustomer table directly
// ═══════════════════════════════════════════════════════════════

const getProviderWarrantyCustomerByPhoneNumber = async (phone_number, otp) => {
    const provider_warranty_customer = await ProviderWarrantyCustomer.findMany({
        where: {
            phone: phone_number,
            otp: otp,
            otp_expiry: {
                gte: new Date()
            }
        },
        include: {
            provider_warranty_code: {
                include: {
                    provider: {
                        select: {
                            company_name: true
                        }
                    }
                }
            },
        }
    });
    return provider_warranty_customer;
}

const getProviderWarrantyCustomerByEmail = async (email, otp) => {
    const provider_warranty_customer = await ProviderWarrantyCustomer.findMany({
        where: {
            email: email,
            otp: otp,
            otp_expiry: {
                gte: new Date()
            }
        },
        include: {
            provider_warranty_code: {
                include: {
                    provider: {
                        select: {
                            company_name: true
                        }
                    }
                }
            },
        }
    });
    return provider_warranty_customer;
}

const getProviderWarrantyCustomerByContact = async (contact, otp) => {
    const contactIsEmail = contact.includes("@");
    if (contactIsEmail) {
        return getProviderWarrantyCustomerByEmail(contact, otp);
    }
    return getProviderWarrantyCustomerByPhoneNumber(contact, otp);
}

export { 
    getWarrantyCustomerDetailsByContact,
    // Legacy exports (kept for backward compatibility)
    getProviderWarrantyCustomerByPhoneNumber, 
    getProviderWarrantyCustomerByEmail, 
    getProviderWarrantyCustomerByContact 
};
