import { prisma, ProviderWarrantyCustomer, ProviderProductWarrantyCode, ProviderDealer, Provider, ProviderWarrantySetting, ProviderCustomers } from "../../../../prisma/db-models.js";

const getDealerByDealerKey = async (dealer_key) => {
    const dealer = await ProviderDealer.findUnique({
        where: {
            dealer_key: dealer_key
        },
        // Activation is only allowed for active dealers.
        // Keeping this in query ensures backend-only enforcement across callers.
        // (status + soft-delete flags)
        include: {
            provider: true
        }
    });
    if (!dealer || dealer.status !== "ACTIVE" || !dealer.is_active || dealer.is_deleted) {
        return null;
    }
    return dealer;
}

const getDealerByDealerNameAndEmail = async (dealer_name, dealer_email) => {
    const dealer = await ProviderDealer.findFirst({
        where: {
            name:dealer_name,
            email:dealer_email,
            status: "ACTIVE",
            is_active: true,
            is_deleted: false
            },
        include: {
            provider: true
        }
    });
    return dealer;
}

const getProviderById = async (provider_id) => {
    const provider = await Provider.findUnique({
        where: {
            id: provider_id
        }
    });
    return provider;
}

const getSettingsByProviderId = async (provider_id) => {
    const row = await ProviderWarrantySetting.findFirst({
        where: { provider_id: provider_id },
        orderBy: { updated_at: 'desc' },
        select: { id: true, registration_url: true, custom_field1: true, custom_field2: true, certificate_template: true },
    });
    return row ? { ...row, certificate_template: row.certificate_template || "classic" } : null;
}

const getWarrantyCodeByAllfields = async (warranty_code, product_name, product_id, serial_number) => {
    if (!warranty_code) return null;
    const warranty_code_data = await ProviderProductWarrantyCode.findUnique({
        where: { warranty_code }
    });
    return warranty_code_data;
}


const checkIfWarrantyCodeIsRegistered = async (warranty_code, product_name, product_id, serial_number) => {
    const warranty_code_data = await ProviderWarrantyCustomer.findFirst({
        where: {
            warranty_code: warranty_code,
            // product_name: product_name,
            // product_id: product_id,
            // serial_number: serial_number
        }
    });
    console.log("warranty_code_datacheckifegistered", warranty_code_data);
    
    return warranty_code_data;
}

const updateWarrantyCode = async (warranty_code, new_warranty_from, new_warranty_to, warranty_code_status) => {
    const updated_warranty_code = await ProviderProductWarrantyCode.update({
        where: {
            warranty_code: warranty_code
        },
        data: {
            warranty_from: new_warranty_from,
            warranty_to: new_warranty_to,
            warranty_code_status: warranty_code_status
        }
    });
    return updated_warranty_code;
}

const createWarrantyCustomerFromProvider = async (
    provider_id,
    warranty_code_id,
    is_provider,
    is_dealer,
    is_customer,
    first_name,
    last_name,
    phone,
    email,
    address,
    city,
    state,
    country,
    invoice_number,
    warranty_code_data,
    // serial_number,
    // product_name,
    // product_id,
    service_id,
    vehicle_number,
    vehicle_chassis_number,
    warranty_code,
    date_of_installation,
    is_active,
    warranty_image_url,
    certificate_template = null) => {
    const new_warranty_customer = await ProviderWarrantyCustomer.create({
        data: {
            provider: { connect: { id: provider_id } },
            provider_warranty_code: { connect: { id: warranty_code_id } },
            is_provider: is_provider,
            is_dealer: is_dealer,
            is_customer: is_customer,
            first_name: first_name,
            last_name: last_name,
            phone: phone,
            email: email,
            address: address,
            city: city,
            state: state,
            country: country,
            invoice_number: invoice_number,
            serial_number: warranty_code_data?.serial_no,
            product_name: warranty_code_data?.product_name,
            product_id: warranty_code_data?.product_id,
            service_id: service_id,
            vehicle_number: vehicle_number,
            vehicle_chassis_number: vehicle_chassis_number,
            warranty_code: warranty_code,
            date_of_installation: date_of_installation,
            is_active: is_active,
            warranty_images: warranty_image_url || [],
            ...(certificate_template != null && certificate_template !== '' && { certificate_template: String(certificate_template).trim() })
        },
        include: {
            provider: true,
            provider_warranty_code: true
        }
    });
    return new_warranty_customer;
}

const createWarrantyCustomerFromDealer = async (
    provider_id,
    dealer_id,
    warranty_code_id,
    is_provider,
    is_dealer,
    is_customer,
    first_name,
    last_name,
    phone,
    email,
    address,
    city,
    state,
    country,
    invoice_number,
    warranty_code_data,
    // serial_number,
    // product_name,
    // product_id,
    service_id,
    vehicle_number,
    vehicle_chassis_number,
    warranty_code,
    date_of_installation,
    dealer_name,
    dealer_email,
    is_active,
    warranty_image_url,
    certificate_template = null
) => {
    console.log(warranty_code_data?.product_id, "warranty_code_data2222222");

    const new_warranty_customer = await ProviderWarrantyCustomer.create({
        data: {
            provider: { connect: { id: provider_id } },
            dealer: { connect: { id: dealer_id } },
            provider_warranty_code: { connect: { id: warranty_code_id } },
            is_provider: is_provider,
            is_dealer: is_dealer,
            is_customer: is_customer,
            first_name: first_name,
            last_name: last_name,
            phone: phone,
            email: email,
            address: address,
            city: city,
            state: state,
            country: country,
            invoice_number: invoice_number,
            serial_number: warranty_code_data?.serial_no,
            product_name: warranty_code_data?.product_name,
            product_id: warranty_code_data?.product_id,
            service_id: warranty_code_data?.service_id,
            vehicle_number: vehicle_number,
            vehicle_chassis_number: vehicle_chassis_number,
            warranty_code: warranty_code,
            date_of_installation: date_of_installation,
            dealership_installer_name: dealer_name,
            dealership_installer_email: dealer_email,
            is_active: is_active,
            warranty_images: warranty_image_url || [],
            ...(certificate_template != null && certificate_template !== '' && { certificate_template: String(certificate_template).trim() })
        },
        include: {
            provider: true,
            provider_warranty_code: true
        }
    });
    return new_warranty_customer;
}

const createWarrantyCustomerFromCustomer = async (
    provider_id,
    dealer_id,
    warranty_code_id,
    is_provider,
    is_dealer,
    is_customer,
    first_name,
    last_name,
    phone,
    email,
    address,
    city,
    state,
    country,
    invoice_number,
    warranty_code_data,
    // serial_number,
    // product_name,
    // product_id,
    service_id,
    vehicle_number,
    vehicle_chassis_number,
    warranty_code,
    date_of_installation,
    dealer_name,
    dealer_email,
    is_active,
    warranty_image_url,
    certificate_template = null
) => {
    const new_warranty_customer = await ProviderWarrantyCustomer.create({
        data: {
            provider: { connect: { id: provider_id } },
            dealer: { connect: { id: dealer_id } },
            provider_warranty_code: { connect: { id: warranty_code_id } },
            is_provider: is_provider,
            is_dealer: is_dealer,
            is_customer: is_customer,
            first_name: first_name,
            last_name: last_name,
            phone: phone,
            email: email,
            address: address,
            city: city,
            state: state,
            country: country,
            invoice_number: invoice_number,
            serial_number: warranty_code_data?.serial_no,
            product_name: warranty_code_data?.product_name,
            product_id: warranty_code_data?.product_id,
            service_id: service_id,
            vehicle_number: vehicle_number,
            vehicle_chassis_number: vehicle_chassis_number,
            warranty_code: warranty_code,
            date_of_installation: date_of_installation,
            dealership_installer_name: dealer_name,
            dealership_installer_email: dealer_email,
            is_active: is_active,
            warranty_images: warranty_image_url || [],
            ...(certificate_template != null && certificate_template !== '' && { certificate_template: String(certificate_template).trim() })
        },
        include: {
            provider: true,
            provider_warranty_code: true
        }
    });
    return new_warranty_customer;
}

const createDealerRegistrationWithTransaction = async (
    customerData,
    warrantyCodeData
) => {
    return await prisma.$transaction(async (tx) => {
        const new_warranty_customer = await tx.providerWarrantyCustomer.create({
            data: {
                provider: { connect: { id: customerData.provider_id } },
                dealer: { connect: { id: customerData.dealer_id } },
                provider_warranty_code: { connect: { id: customerData.warranty_code_id } },
                is_provider: customerData.is_provider,
                is_dealer: customerData.is_dealer,
                is_customer: customerData.is_customer,
                first_name: customerData.first_name,
                last_name: customerData.last_name,
                phone: customerData.phone,
                email: customerData.email,
                address: customerData.address,
                city: customerData.city,
                state: customerData.state,
                country: customerData.country,
                invoice_number: customerData.invoice_number,
                serial_number: customerData.serial_number,
                product_name: customerData.product_name,
                product_id: customerData.product_id,
                service_id: customerData.service_id,
                vehicle_number: customerData.vehicle_number,
                vehicle_chassis_number: customerData.vehicle_chassis_number,
                warranty_code: customerData.warranty_code,
                date_of_installation: customerData.date_of_installation,
                dealership_installer_name: customerData.dealer_name,
                dealership_installer_email: customerData.dealer_email,
                is_active: customerData.is_active ?? true,
                warranty_images: customerData.warranty_image_url || [],
                ...(customerData.certificate_template != null && customerData.certificate_template !== '' && { certificate_template: String(customerData.certificate_template).trim() })
            },
            include: {
                provider: true,
                provider_warranty_code: true
            }
        });

        const updated_warranty_code = await tx.providerProductWarrantyCode.update({
            where: {
                warranty_code: warrantyCodeData.warranty_code
            },
            data: {
                warranty_from: warrantyCodeData.warranty_from,
                warranty_to: warrantyCodeData.warranty_to,
                warranty_code_status: warrantyCodeData.status
            }
        });

        return { customer: new_warranty_customer, updatedCode: updated_warranty_code };
    });
};

const createCustomerRegistrationWithTransaction = async (
    customerData,
    warrantyCodeData
) => {
    return await prisma.$transaction(async (tx) => {
        const new_warranty_customer = await tx.providerWarrantyCustomer.create({
            data: {
                provider: { connect: { id: customerData.provider_id } },
                dealer: { connect: { id: customerData.dealer_id } },
                provider_warranty_code: { connect: { id: customerData.warranty_code_id } },
                is_provider: customerData.is_provider,
                is_dealer: customerData.is_dealer,
                is_customer: customerData.is_customer,
                first_name: customerData.first_name,
                last_name: customerData.last_name,
                phone: customerData.phone,
                email: customerData.email,
                address: customerData.address,
                city: customerData.city,
                state: customerData.state,
                country: customerData.country,
                invoice_number: customerData.invoice_number,
                serial_number: customerData.serial_number,
                product_name: customerData.product_name,
                product_id: customerData.product_id,
                service_id: customerData.service_id,
                vehicle_number: customerData.vehicle_number,
                vehicle_chassis_number: customerData.vehicle_chassis_number,
                warranty_code: customerData.warranty_code,
                date_of_installation: customerData.date_of_installation,
                dealership_installer_name: customerData.dealer_name,
                dealership_installer_email: customerData.dealer_email,
                is_active: customerData.is_active ?? true,
                warranty_images: customerData.warranty_image_url || [],
                ...(customerData.certificate_template != null && customerData.certificate_template !== '' && { certificate_template: String(customerData.certificate_template).trim() })
            },
            include: {
                provider: true,
                provider_warranty_code: true
            }
        });

        const updated_warranty_code = await tx.providerProductWarrantyCode.update({
            where: {
                warranty_code: warrantyCodeData.warranty_code
            },
            data: {
                warranty_from: warrantyCodeData.warranty_from,
                warranty_to: warrantyCodeData.warranty_to,
                warranty_code_status: warrantyCodeData.status
            }
        });

        return { customer: new_warranty_customer, updatedCode: updated_warranty_code };
    });
};

const updateCustomFields = async (warranty_code, custom_value1, custom_value2, custom_field_values) => {
    const data = { 
        custom_value1: custom_value1,
        custom_value2: custom_value2,
    };
    if (custom_field_values && typeof custom_field_values === 'object') {
        data.custom_field_values = custom_field_values;
    }
    const updated_warranty_code = await ProviderProductWarrantyCode.update({
        where: {
            warranty_code: warranty_code,
        },
        data
    });
    return updated_warranty_code;
}

const checkWarrantyCodeWithProviderById = async (provider_id, warranty_code) => {
    const warranty_code_data = await ProviderProductWarrantyCode.findFirst({
        where: {
            warranty_code: warranty_code,
            provider_id: provider_id
        }
    });
    return warranty_code_data;
};

const getExistingCustomerByProviderAndContact = async (provider_id, phone, email) => {
    const or_conditions = [];

    if (phone) {
        or_conditions.push({ phone: phone });
    }
    if (email) {
        or_conditions.push({ email: email });
    }

    if (or_conditions.length === 0) {
        return null;
    }

    const existing_customer = await ProviderWarrantyCustomer.findFirst({
        where: {
            provider_id: provider_id,
            is_deleted: false,
            OR: or_conditions
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    return existing_customer;
};

const getMasterCustomerByProviderAndContact = async (provider_id, phone, email) => {
    const normalizeEmail = (value) => (value || "").trim().toLowerCase();
    const normalizePhone = (value) => {
        const digits_only = (value || "").replace(/\D/g, "");
        if (!digits_only) return "";
        // Use the last 10 digits to match common country-code variations.
        return digits_only.length > 10 ? digits_only.slice(-10) : digits_only;
    };

    const normalized_email = normalizeEmail(email);
    const normalized_phone = normalizePhone(phone);

    if (!normalized_email && !normalized_phone) {
        return null;
    }

    const exact_or_conditions = [];
    if (phone) {
        exact_or_conditions.push({ customer_phone: phone });
    }
    if (email) {
        exact_or_conditions.push({ customer_email: email });
    }

    // Fast path: preserve existing exact-match behavior.
    let existing_master_customer = exact_or_conditions.length > 0 ? await ProviderCustomers.findFirst({
        where: {
            provider_id: provider_id,
            is_active: true,
            is_deleted: false,
            OR: exact_or_conditions
        },
        orderBy: {
            created_at: 'desc'
        }
    }) : null;

    if (existing_master_customer) {
        return existing_master_customer;
    }

    // Fallback: tolerant lookup for formatting differences (country code/case/spacing).
    const fallback_or_conditions = [];
    if (normalized_phone) {
        fallback_or_conditions.push({ customer_phone: { contains: normalized_phone } });
    }
    if (normalized_email) {
        fallback_or_conditions.push({ customer_email: { contains: normalized_email } });
    }

    if (fallback_or_conditions.length === 0) {
        return null;
    }

    const candidate_customers = await ProviderCustomers.findMany({
        where: {
            provider_id: provider_id,
            is_active: true,
            is_deleted: false,
            OR: fallback_or_conditions
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    existing_master_customer = candidate_customers.find((candidate) => {
        const candidate_email = normalizeEmail(candidate.customer_email);
        const candidate_phone = normalizePhone(candidate.customer_phone);

        const email_match = normalized_email ? candidate_email === normalized_email : false;
        const phone_match = normalized_phone ? candidate_phone === normalized_phone : false;

        return email_match || phone_match;
    }) || null;

    return existing_master_customer;
};

export { getDealerByDealerKey, getProviderById, getWarrantyCodeByAllfields, checkIfWarrantyCodeIsRegistered, updateWarrantyCode, createWarrantyCustomerFromProvider, createWarrantyCustomerFromDealer, createWarrantyCustomerFromCustomer, createDealerRegistrationWithTransaction, createCustomerRegistrationWithTransaction, getDealerByDealerNameAndEmail, getSettingsByProviderId, updateCustomFields, checkWarrantyCodeWithProviderById, getExistingCustomerByProviderAndContact, getMasterCustomerByProviderAndContact };