import { ProviderWarrantyCustomer } from "../../../../prisma/db-models.js";

const getProviderWarrantyCustomerByPhoneNumber = async (phone_number) => {
    const provider_warranty_customer = await ProviderWarrantyCustomer.findMany({
        where: {
            phone: phone_number
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
};

const getProviderWarrantyCustomerByEmail = async (email) => {
    const provider_warranty_customer = await ProviderWarrantyCustomer.findMany({
        where: {
            email: email
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
};

const getProviderWarrantyCustomerByContact = async (contact) => {
    const isEmail = contact.includes("@");
    if (isEmail) {
        return getProviderWarrantyCustomerByEmail(contact);
    }
    return getProviderWarrantyCustomerByPhoneNumber(contact);
};

const updateWarrantyCustomer = async (phone_number, otp, otp_expiry) => {
    const update_warranty_customer = await ProviderWarrantyCustomer.updateMany({
        where: {
            phone: phone_number
        },
        data: {
            otp: otp,
            otp_expiry: otp_expiry
        }
    });
    return update_warranty_customer;
};

const updateWarrantyCustomerByEmail = async (email, otp, otp_expiry) => {
    const update_warranty_customer = await ProviderWarrantyCustomer.updateMany({
        where: {
            email: email
        },
        data: {
            otp: otp,
            otp_expiry: otp_expiry
        }
    });
    return update_warranty_customer;
};

export {
    getProviderWarrantyCustomerByPhoneNumber,
    getProviderWarrantyCustomerByEmail,
    getProviderWarrantyCustomerByContact,
    updateWarrantyCustomer,
    updateWarrantyCustomerByEmail
};
