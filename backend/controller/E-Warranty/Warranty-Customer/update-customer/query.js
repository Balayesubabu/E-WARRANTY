import { Provider, ProviderProductWarrantyCode, ProviderWarrantyCustomer } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getCustomerWarrantyById = async (customer_warranty_id) => {
    const customer_warranty = await ProviderWarrantyCustomer.findFirst({
        where: {
            id: customer_warranty_id
        }
    });
    return customer_warranty;
}

const getWarrantyCodeByWarrantyCode = async (warranty_code) => {
    const warranty_code_data = await ProviderProductWarrantyCode.findFirst({
        where: {
            warranty_code: warranty_code
        }
    });
    return warranty_code_data;
}

const checkIfWarrantyCodeIsRegistered = async (warranty_code) => {
    const is_registered = await ProviderWarrantyCustomer.findFirst({
        where: {
            warranty_code: warranty_code
        }
    });
    return is_registered;
}

const updateWarrantyCode = async (warranty_code, new_warranty_from, new_warranty_to) => {
    const updated_warranty_code = await ProviderProductWarrantyCode.update({
        where: {
            warranty_code: warranty_code
        },
        data: {
            warranty_from: new_warranty_from,
            warranty_to: new_warranty_to
        }
    });
    return updated_warranty_code;
}

const updateWarrantyCodeCustomFields = async (warranty_code, custom_value1, custom_value2) => {
    const updated_warranty_code = await ProviderProductWarrantyCode.update({
        where: {
            warranty_code: warranty_code
        },
        data: {
            custom_value1: custom_value1,
            custom_value2: custom_value2
        }
    });
    return updated_warranty_code;
}


const updateCustomerWarranty = async (customer_warranty_id, data) => {
    const updated_customer_warranty = await ProviderWarrantyCustomer.update({
        where: {
            id: customer_warranty_id
        },
        data: {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            city: data.city,
            state: data.state,
            country: data.country,
            invoice_number: data.invoice_number,
            serial_number: data.serial_number,
            product_name: data.product_name,
            product_id: data.product_id,
            service_id: data.service_id,
            warranty_code: data.warranty_code,
            date_of_installation: data.date_of_installation,
            dealership_installer_name: data.dealership_installer_name,
            dealership_installer_email: data.dealership_installer_email,
            vehicle_number: data.vehicle_number,
            vehicle_chassis_number: data.vehicle_chassis_number,
            is_active: data.is_active,
        }
    });
    return updated_customer_warranty;
}

const updateWarrantyCodeStatus = async (warranty_code, status) => {
    const updated_warranty_code = await ProviderProductWarrantyCode.update({
        where: {
            warranty_code: warranty_code
        },
        data: {
            warranty_code_status: status
        }
    });
    return updated_warranty_code;
}

export { getProviderByUserId, getCustomerWarrantyById, getWarrantyCodeByWarrantyCode, checkIfWarrantyCodeIsRegistered, updateWarrantyCode, updateCustomerWarranty, updateWarrantyCodeCustomFields, updateWarrantyCodeStatus };