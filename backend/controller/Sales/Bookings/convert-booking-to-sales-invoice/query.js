import {Provider,Booking,ProviderCustomers,BookingParts,BookingServices,SalesInvoice,SalesInvoiceParty,SalesCustomerVehicle,QuickSettings} from '../../../../prisma/db-models.js';

const getProviderByUserId = async (userId) => {
    return await Provider.findFirst({
        where: {
            user_id: userId
        },
         include: {
            user: true
        }
    });
}

const getBooking = async (bookingId, provider_id, franchise_id) => {
    return await Booking.findFirst({
        where: {
            id: bookingId,
            provider_id: provider_id,
            franchise_id: franchise_id
        }
    });
}

const getProviderCustomer = async (customer_id, provider_id, franchise_id) => {
    return await ProviderCustomers.findFirst({
        where: {
            id: customer_id,
            provider_id: provider_id,
            franchise_id: franchise_id
        }
    });
}

const getBookingParts = async (booking_id, provider_id, franchise_id) => {
    return await BookingParts.findMany({
        where: {
            booking_id: booking_id,
            provider_id: provider_id,
            franchise_id: franchise_id
        }
    });
}
const getBookingServices = async (booking_id, provider_id, franchise_id) => {
    return await BookingServices.findMany({
        where: {
            booking_id: booking_id,
            provider_id: provider_id,
            franchise_id: franchise_id
        }
    });
}

// const updateOpenInventoryTransaction = async (parts_list, provider_id, franchise_id, staff_id) => {
//     for (let part of parts_list) {
//         if(part.franchise_open_inventory_id){
//             const existingPart = await FranchiseOpenInventory.findFirst({
//                 where: {
//                     id: part.franchise_open_inventory_id,
//                     provider_id: provider_id,
//                     franchise_id: franchise_id
//                 }
//             });
//             if (existingPart) {
//                 await FranchiseOpenInventoryTransaction.create({
//                     data: {
//                     franchise_open_inventory_id: part.franchise_open_inventory_id,
//                     provider_id: provider_id,
//                     franchise_id: franchise_id,
//                     action:"reduce",
//                     measurement: part.measurement,
//                     measurement_unit: part.measurement_unit,
//                     stock_changed_by:"jobCard",
//                     updated_at: new Date()
//                     }
//                 });
//             }   
//         }
//     }
//     return true;
// }

// const updateServicesInventory = async (services_list, provider_id, franchise_id, staff_id) => {
//     const processedServices = [];
//     for(let service of services_list) {
//         const getService = await FranchiseService.findFirst({
//             where: {
//                 id: service.franchise_service_id,
//                 provider_id: provider_id,
//                 franchise_id: franchise_id
//             },
//         });
//         if(getService.products_list){
//             for(let product of getService.products_list) {
//                 processedServices.push({
//                     franchise_open_inventory_id: product.franchise_open_inventory_id,
//                     measurement: product.measurement,
//                     measurement_unit: product.measurement_unit
//                 });
//             }
//         }
//     }
//     for (let service of processedServices) {
//         if(service.franchise_open_inventory_id){
//             const existingProduct = await FranchiseOpenInventory.findFirst({
//                 where: {
//                     id: service.franchise_open_inventory_id,
//                     provider_id: provider_id,
//                     franchise_id: franchise_id
//                 }
//             });
//             if (existingProduct) {
//                 await FranchiseOpenInventoryTransaction.create({
//                     data: {
//                         franchise_open_inventory_id: service.franchise_open_inventory_id,
//                         provider_id: provider_id,
//                         franchise_id: franchise_id,
//                         action:"reduce",
//                         measurement: service.measurement,
//                         measurement_unit: service.measurement_unit,
//                         stock_changed_by:"jobCard",
//                         updated_at: new Date()
//                     }
//                 });
//             }
//         }
//     }
//     return true;
// }

const createSalesInvoiceFromBooking = async (invoice_number,data,franchise_id,provider_id,staff_id,booking_id) => {
    const checkExistingInvoice = await SalesInvoice.findFirst({
        where: {
            invoice_number: invoice_number,
            invoice_type:"Booking",
            provider_id: provider_id,
            franchise_id: franchise_id
        }
    });
    if (checkExistingInvoice) {
        throw new Error(`Invoice with number ${invoice_number} already exists`);
    }
    const sales_invoice = await SalesInvoice.create({
        data: {
            invoice_number: invoice_number,
            provider_customer_id: data.provider_customer_id,
            franchise_id: data.franchise_id,
            booking_id: booking_id,
            invoice_type: data.invoice_type,
            invoice_status: data.invoice_status,
            invoice_date: data.invoice_date,
            invoice_total_amount: data.invoice_total_amount,
            invoice_pending_amount: data.invoice_pending_amount,
            invoice_paid_amount: data.invoice_paid_amount,
            is_invoice_fully_paid: data.is_invoice_fully_paid,
            invoice_additional_discount_percentage: data.invoice_additional_discount_percentage,
            invoice_additional_discount_amount: data.invoice_additional_discount_amount,
            invoice_tds_percentage: data.invoice_tds_percentage,
            invoice_tcs_percentage: data.invoice_tcs_percentage,
            invoice_shipping_charges: data.invoice_shipping_charges,
            is_auto_round_off: data.is_auto_round_off,
            auto_round_off_amount: data.auto_round_off_amount,
            invoice_advance_amount: data.invoice_advance_amount,
            advance_payment_type: data.advance_payment_type,
            advance_amount_online_transaction_id: data.advance_amount_online_transaction_id,
            advance_payment_date: data.advance_payment_date,
            invoice_payment_status: data.invoice_payment_status,
            terms_and_conditions: data.terms_and_conditions,
            additional_notes: data.additional_notes,
            due_date_terms: data.due_date_terms,
            due_date: data.due_date,
            next_service_date: data.next_service_date,
            next_service_kilometers: data.next_service_kilometers,
            invoice_total_amount: data.invoice_total_amount,
            invoice_discount_amount: data.invoice_discount_amount,
            invoice_gst_amount: data.invoice_gst_amount,
            invoice_tds_amount: data.invoice_tds_amount,
            invoice_tcs_amount: data.invoice_tcs_amount,
            invoice_pending_amount: data.invoice_pending_amount,
            invoice_paid_amount: data.invoice_paid_amount,
            invoice_total_tax_amount: data.invoice_total_tax_amount,
            invoice_total_parts_amount: data.invoice_total_parts_amount,
            invoice_total_parts_tax_amount: data.invoice_total_parts_tax_amount,
            invoice_total_services_amount: data.invoice_total_services_amount,
            invoice_total_services_tax_amount: data.invoice_total_services_tax_amount,
            invoice_total_parts_services_amount: data.invoice_total_parts_services_amount,
            invoice_total_parts_services_tax_amount: data.invoice_total_parts_services_tax_amount,
            franchise_id: franchise_id,
            provider_id: provider_id,
            created_at: new Date(),
            created_by: staff_id || provider_id
        }
    });
    return sales_invoice;
}

const createSalesInvoiceParty = async (sales_invoice_id, data) => {
    const salesInvoiceParty = await SalesInvoiceParty.create({
        data: {
            ...data,
            sales_invoice_id: sales_invoice_id
        }
    });
    return salesInvoiceParty;
}

const createSalesCustomerVehicle = async (sales_invoice_id, data) => {
    const salesCustomerVehicle = await SalesCustomerVehicle.create({
        data: {
            sales_invoice_id,
            provider_customer_id: data.provider_customer_id,
            provider_customer_vehicle_id: data.provider_customer_vehicle_id,
            vehicle_number: data.vehicle_number,
            vehicle_type: data.vehicle_type,
            vehicle_model: data.vehicle_model,
            vehicle_color: data.vehicle_color,
            vehicle_fuel_type: data.vehicle_fuel_type,
            vehicle_transmission: data.vehicle_transmission,
            vehicle_variant: data.vehicle_variant,
            vehicle_make_year: data.vehicle_make_year,
            vehicle_mileage: data.vehicle_mileage,
            vehicle_insurance_details: data.vehicle_insurance_details,
            vehicle_engine_number: data.vehicle_engine_number,
            vehicle_chassis_number: data.vehicle_chassis_number,
            vehicle_registration_number: data.vehicle_registration_number,
            vehicle_fuel_level: data.vehicle_fuel_level,
            personal_belongings: data.personal_belongings,
            dents_images: data.dents_images,
            vehicle_images: data.vehicle_images
        }
    })
    return salesCustomerVehicle;
}

const getInvoiceNumberFromId = async (provider_id, franchise_id) => {
    const quickSettings = await QuickSettings.findFirst({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            invoice_type: "Sales"
        }
    });
    if (!quickSettings) {
        return null;
    }
    return quickSettings;
}
const updateInvoiceNumberFromId = async (provider_id, franchise_id, prefix, sequence_number) => {
    const quickSettings = await QuickSettings.findFirst({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            invoice_type: "Sales"
        }
    });

    if (!quickSettings) {
        return await QuickSettings.create({
            data: {
                provider_id: provider_id,
                franchise_id: franchise_id,
                invoice_type: "Sales",
                prefix: prefix,
                sequence_number: sequence_number
            }
        });
    }
    else{
        return await QuickSettings.update({
        where: {
            id: quickSettings.id
        },  
        data: {
            prefix: prefix,
            sequence_number: sequence_number
        },
    });
    }
}

const updateBookingStatus = async (booking_id, provider_id, franchise_id,staff_id) => {
    const booking = await Booking.update({
        where: {
            id: booking_id,
            provider_id: provider_id,
            franchise_id: franchise_id
        },
        data: {
            status: "Pending",
            updated_at: new Date(),
            updated_by: staff_id || provider_id
        }
    });
    return booking;
}

const getAllDataBooking = async (booking_id, provider_id, franchise_id) => {
    const booking = await Booking.findFirst({
        where: {
            id: booking_id,
            provider_id: provider_id,
            franchise_id: franchise_id
        },
        include: {
            BookingParts: true,
            BookingServices: true,
            customer: true,
            vehicle: true,
            provider: true,
            provider: {
                include: {
                    ProviderBankDetails: true,
                    user: true
                }
            }
        }
    });
    const salesInvoice = await SalesInvoice.findFirst({
        where: { booking_id: booking_id, provider_id: provider_id, franchise_id: franchise_id },
        include: {
            SalesInvoiceTransactions: true
        }
    });
    return { booking, salesInvoice };
}

const updateUrl = async (sales_invoice_id, url) => {
    const salesInvoice = await SalesInvoice.update({
        where: {
            id: sales_invoice_id
        },
        data: {
            invoice_pdf_url: url
        }
    });
    return salesInvoice;
}

export { getProviderByUserId, getBooking, getProviderCustomer, getBookingParts, getBookingServices,createSalesInvoiceFromBooking,createSalesInvoiceParty,createSalesCustomerVehicle,getInvoiceNumberFromId,updateInvoiceNumberFromId,updateBookingStatus,getAllDataBooking,updateUrl};