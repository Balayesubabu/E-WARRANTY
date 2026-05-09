import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
    getProviderByUserId,
    getSalesInvoiceById,
    getFranchiseInventoryById,
    updateSalesInvoice,
    updateProviderCustomerFinalBalance,
    createSalesParts,
    updateFranchiseInventory,
    createSalesServices,
    createSalesInvoiceParty,
    clearSalesInvoice,
    getSalesInvoiceTransactions,
    restoreFranchiseInventory,
    createSalesCustomerVehicle
} from "./query.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const updateBookingEndpoint = async (req, res) => {
    try {
        logger.info(`updateBookingEndpoint`);

        const user_id = req.user_id;

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        const data = req.body;
        const sales_invoice_id = req.params.booking_id;

        logger.info(`--- Fetching sales invoice details for sales_invoice_id: ${sales_invoice_id} ---`);
        const existing_sales_invoice = await getSalesInvoiceById(sales_invoice_id);
        if (!existing_sales_invoice) {
            logger.error(`--- Sales invoice not found for sales_invoice_id: ${sales_invoice_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Sales invoice not found`);
        }
        logger.info(`--- Sales invoice found for sales_invoice_id: ${sales_invoice_id} ---`);

        logger.info(`--- Fetching sales invoice transactions for sales_invoice_id: ${sales_invoice_id} ---`);
        const existing_transactions = await getSalesInvoiceTransactions(sales_invoice_id);
        if (!existing_transactions) {
            logger.error(`--- Sales invoice transactions not found for sales_invoice_id: ${sales_invoice_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Sales invoice transactions not found`);
        }
        logger.info(`--- Sales invoice transactions found for sales_invoice_id: ${sales_invoice_id} ---`);

        const existing_paid_amount = existing_transactions.reduce((sum, t) => sum + t.amount, 0);
        logger.info(`--- Existing paid amount: ${existing_paid_amount} ---`);

        const old_parts = existing_sales_invoice.SalesPart || [];
        logger.info(`--- Old parts: ${JSON.stringify(old_parts)} ---`);

        logger.info(`--- Restoring franchise inventory for old parts ---`);
        for (const old_part of old_parts) {
            await restoreFranchiseInventory(old_part.franchise_inventory_id, old_part.part_quantity);
        }

        logger.info(`--- Clearing sales invoice for sales_invoice_id: ${sales_invoice_id} ---`);
        await clearSalesInvoice(sales_invoice_id);
        logger.info(`--- Sales invoice cleared for sales_invoice_id: ${sales_invoice_id} ---`);

        logger.info(`--- Fetching data from request body ---`);
        let {
            provider_customer_id,
            franchise_id,
            bill_to,
            ship_to,
            original_invoice_number,
            invoice_type = "Booking",
            invoice_status,
            invoice_date,
            is_invoice_fully_paid,
            invoice_additional_discount_percentage,
            invoice_additional_discount_amount,
            invoice_tds_percentage,
            invoice_tcs_percentage,
            invoice_shipping_charges,
            is_auto_round_off,
            auto_round_off_amount,
            invoice_advance_amount,
            advance_payment_type,
            advance_amount_online_transaction_id,
            advance_payment_date,
            invoice_payment_status,
            terms_and_conditions,
            additional_notes,
            due_date_terms,
            due_date,
            SalesParts,
            SalesServices,
            SalesCustomerVehicles
        } = data;

        if (!SalesCustomerVehicles) {
            logger.error(`--- Sales customer vehicle not provided ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Sales customer vehicle is required`);
        }

        logger.info(`--- Processing data from request body ---`);
        let invoice_total_amount = 0;
        let invoice_discount_amount = 0;
        let invoice_gst_amount = 0;
        let invoice_tds_amount = 0;
        let invoice_tcs_amount = 0;
        let invoice_pending_amount = 0;
        let invoice_paid_amount = 0;
        let invoice_total_tax_amount = 0;
        let invoice_total_parts_amount = 0;
        let invoice_total_parts_tax_amount = 0;
        let invoice_total_services_amount = 0;
        let invoice_total_services_tax_amount = 0;
        let invoice_total_parts_services_amount = 0;
        let invoice_total_parts_services_tax_amount = 0;

        let processed_parts = [];
        logger.info(`--- Processing parts ---`);
        for (const part of SalesParts) {
            let {
                franchise_inventory_id,
                part_name,
                part_hsn_code,
                part_description,
                part_selling_price,
                part_quantity = part.part_quantity ? part.part_quantity : 1,
                part_discount_percentage = part.part_discount_percentage ? part.part_discount_percentage : 0,
                part_discount_amount = part.part_discount_amount ? part.part_discount_amount : 0,
                part_mesuring_unit,
                part_gst_percentage = part.part_gst_percentage ? part.part_gst_percentage : 0
            } = part;

            logger.info(`--- Fetching franchise inventory for part: ${part.franchise_inventory_id} ---`);
            const franchiseInventory = await getFranchiseInventoryById(part.franchise_inventory_id);
            if (!franchiseInventory) {
                logger.error(`--- Franchise inventory not found for part: ${part.franchise_inventory_id} ---`);
                return returnError(res, StatusCodes.BAD_REQUEST, `Franchise inventory not found`);
            }
            logger.info(`--- Franchise inventory found for part: ${part.franchise_inventory_id} ---`);

            logger.info(`--- Checking if franchise inventory quantity is less than part quantity ---`);
            if (franchiseInventory.product_quantity < part_quantity) {
                logger.error(`--- Franchise inventory quantity is less than part quantity ---`);
                return returnError(res, StatusCodes.BAD_REQUEST, `Franchise inventory quantity is less than part quantity`);
            }
            logger.info(`--- Franchise inventory quantity is greater than part quantity ---`);

            logger.info(`--- Processing part discount ---`);
            if (part_discount_percentage && !part_discount_amount) {
                part_discount_amount = ((part_selling_price * part_discount_percentage) / 100);
            } else if (!part_discount_percentage && part_discount_amount) {
                part_discount_percentage = ((part_discount_amount / (part_selling_price)) * 100);
            } else {
                part_discount_percentage = 0;
                part_discount_amount = 0;
            }

            logger.info(`--- Calculating part GST amount ---`);
            let part_gst_amount = ((part_selling_price * part_quantity) - (part_discount_amount * part_quantity)) * (part_gst_percentage / 100);
            let part_total_price = (part_selling_price * part_quantity) - (part_discount_amount * part_quantity) + part_gst_amount;

            logger.info(`--- Calculating part total price ---`);
            invoice_total_amount += part_total_price;
            invoice_discount_amount += part_discount_amount;
            invoice_gst_amount += part_gst_amount;
            invoice_total_tax_amount += part_gst_amount;
            invoice_total_parts_amount += part_selling_price * part_quantity;
            invoice_total_parts_tax_amount += part_gst_amount;
            invoice_total_parts_services_amount += part_selling_price * part_quantity;
            invoice_total_parts_services_tax_amount += part_gst_amount;

            logger.info(`--- Adding part to processed parts ---`);
            processed_parts.push({
                franchise_inventory_id,
                part_name,
                part_hsn_code,
                part_description,
                part_selling_price,
                part_quantity,
                part_discount_percentage,
                part_discount_amount,
                part_mesuring_unit,
                part_gst_percentage,
                part_gst_amount,
                part_total_price
            });
        }

        let processed_services = [];
        logger.info(`--- Processing services ---`);
        for (const service of SalesServices) {
            let {
                franchise_service_id,
                service_name,
                service_description,
                service_discount_percentage = service.service_discount_percentage ? service.service_discount_percentage : 0,
                service_discount_amount = service.service_discount_amount ? service.service_discount_amount : 0,
                service_price,
                service_gst_percentage = service.service_gst_percentage ? service.service_gst_percentage : 0,
            } = service;

            logger.info(`--- Processing service discount ---`);
            if (service_discount_percentage && !service_discount_amount) {
                service_discount_amount = ((service_price * service_discount_percentage) / 100);
            } else if (!service_discount_percentage && service_discount_amount) {
                service_discount_percentage = ((service_discount_amount / (service_price)) * 100);
            } else {
                service_discount_percentage = 0;
                service_discount_amount = 0;
            }

            logger.info(`--- Calculating service GST amount ---`);
            let service_gst_amount = (service_price - service_discount_amount) * (service_gst_percentage / 100);
            let service_total_price = service_price - service_discount_amount + service_gst_amount;

            logger.info(`--- Calculating service total price ---`);
            invoice_total_amount += service_total_price;
            invoice_discount_amount += service_discount_amount;
            invoice_gst_amount += service_gst_amount;
            invoice_total_tax_amount += service_gst_amount;
            invoice_total_services_amount += service_price;
            invoice_total_services_tax_amount += service_gst_amount;
            invoice_total_parts_services_amount += service_price;
            invoice_total_parts_services_tax_amount += service_gst_amount;

            logger.info(`--- Adding service to processed services ---`);
            processed_services.push({
                franchise_service_id,
                service_name,
                service_description,
                service_discount_percentage,
                service_discount_amount,
                service_price,
                service_gst_percentage,
                service_gst_amount,
                service_total_price
            });
        }

        logger.info(`--- Processing additional discount ---`);
        if (invoice_additional_discount_percentage && !invoice_additional_discount_amount) {
            invoice_additional_discount_amount = ((invoice_total_amount - invoice_discount_amount) * (invoice_additional_discount_percentage / 100));
        } else if (!invoice_additional_discount_percentage && invoice_additional_discount_amount) {
            invoice_additional_discount_percentage = ((invoice_additional_discount_amount / (invoice_total_amount - invoice_discount_amount)) * 100);
        } else {
            invoice_additional_discount_percentage = 0;
            invoice_additional_discount_amount = 0;
        }

        logger.info(`--- Processing shipping charges ---`);
        if (invoice_shipping_charges) {
            invoice_total_amount += invoice_shipping_charges;
        }

        logger.info(`--- Processing TCS percentage ---`);
        if (invoice_tcs_percentage) {
            invoice_tcs_amount = (invoice_total_amount - invoice_discount_amount) * (invoice_tcs_percentage / 100);
            invoice_total_amount -= invoice_tcs_amount;
            invoice_total_tax_amount += invoice_tcs_amount;
        }

        logger.info(`--- Processing auto round off ---`);
        if (is_auto_round_off === true && auto_round_off_amount === 0) {
            auto_round_off_amount = invoice_total_amount - Math.round(invoice_total_amount);
            invoice_total_amount = Math.round(invoice_total_amount);
        } else if (is_auto_round_off === false && auto_round_off_amount !== 0) {
            invoice_total_amount += auto_round_off_amount;
        }

        logger.info(`--- Processing invoice fully paid ---`);
        let customer_final_balance = 0;
        if (is_invoice_fully_paid === true) {
            invoice_payment_status = "Paid";
            invoice_status = "Fully_Paid";
            invoice_paid_amount = invoice_total_amount;
            invoice_pending_amount = 0;
            customer_final_balance = 0;
        } else {
            invoice_payment_status = "Pending";
            if (invoice_advance_amount && invoice_advance_amount > 0) {
                invoice_paid_amount = invoice_advance_amount;
                invoice_pending_amount = invoice_total_amount - invoice_paid_amount;
                customer_final_balance = invoice_pending_amount;
            } else {
                invoice_paid_amount = 0;
                invoice_pending_amount = invoice_total_amount;
                customer_final_balance = invoice_total_amount;
            }
        }

        logger.info(`--- Wrapping all database operations in a transaction ---`);
        const result = await prisma.$transaction(async (tx) => {
            logger.info(`--- Starting transaction for sales invoice update ---`);

            logger.info(`--- Updating sales invoice ---`);
            const updated_sales_invoice = await updateSalesInvoice(sales_invoice_id, {
                provider_customer_id,
                franchise_id,
                bill_to,
                ship_to,
                original_invoice_number,
                invoice_type,
                invoice_status,
                invoice_date,
                is_invoice_fully_paid,
                invoice_additional_discount_percentage,
                invoice_additional_discount_amount,
                invoice_tds_percentage,
                invoice_tcs_percentage,
                invoice_shipping_charges,
                is_auto_round_off,
                auto_round_off_amount,
                invoice_advance_amount,
                advance_payment_type,
                advance_amount_online_transaction_id,
                advance_payment_date,
                invoice_payment_status,
                terms_and_conditions,
                additional_notes,
                due_date_terms,
                due_date,
                invoice_total_amount,
                invoice_discount_amount,
                invoice_gst_amount,
                invoice_tds_amount,
                invoice_tcs_amount,
                invoice_pending_amount,
                invoice_paid_amount,
                invoice_total_tax_amount,
                invoice_total_parts_amount,
                invoice_total_parts_tax_amount,
                invoice_total_services_amount,
                invoice_total_services_tax_amount,
                invoice_total_parts_services_amount,
                invoice_total_parts_services_tax_amount,
            }, tx);

            if (!updated_sales_invoice) {
                throw new Error('Failed to update sales invoice');
            }
            logger.info(`--- Sales invoice updated ---`);

            logger.info(`--- Updating customer final balance ---`);
            const balance_difference = customer_final_balance - existing_sales_invoice.invoice_pending_amount;
            const update_customer_final_balance = await updateProviderCustomerFinalBalance(provider_customer_id, balance_difference, tx);
            if (!update_customer_final_balance) {
                throw new Error('Failed to update customer final balance');
            }
            logger.info(`--- Customer final balance updated ---`);

            logger.info(`--- Creating sales invoice party ---`);
            const invoice_provider_data = await createSalesInvoiceParty(sales_invoice_id, {
                sales_invoice_id: sales_invoice_id,
                type: "Provider",
                party_name: provider.company_name,
                party_country_code: provider.user.country_code,
                party_phone: provider.user.phone_number,
                party_email: provider.user.email,
                party_address: provider.company_address,
                party_city: provider.user.city,
                party_state: provider.user.state,
                party_gstin_number: provider.gst_number
            }, tx);

            if (!invoice_provider_data) {
                throw new Error('Failed to create sales invoice party');
            }
            logger.info(`--- Sales invoice party created ---`);

            logger.info(`--- Creating bill to ---`);
            const bill_to_created = await createSalesInvoiceParty(sales_invoice_id, {
                sales_invoice_id: sales_invoice_id,
                type: "Bill_To",
                party_name: bill_to.party_name,
                party_country_code: bill_to.party_country_code,
                party_phone: bill_to.party_phone,
                party_email: bill_to.party_email,
                party_address: bill_to.party_address,
                party_city: bill_to.party_city,
                party_state: bill_to.party_state,
                party_pincode: bill_to.party_pincode,
                party_gstin_number: bill_to.party_gstin_number,
                party_vehicle_number: bill_to.party_vehicle_number
            }, tx);

            if (!bill_to_created) {
                throw new Error('Failed to create bill to');
            }
            logger.info(`--- Bill to created ---`);

            logger.info(`--- Creating ship to ---`);
            const ship_to_created = await createSalesInvoiceParty(sales_invoice_id, {
                sales_invoice_id: sales_invoice_id,
                type: "Ship_To",
                party_name: ship_to.party_name,
                party_country_code: ship_to.party_country_code,
                party_phone: ship_to.party_phone,
                party_email: ship_to.party_email,
                party_address: ship_to.party_address,
                party_city: ship_to.party_city,
                party_state: ship_to.party_state,
                party_pincode: ship_to.party_pincode,
                party_gstin_number: ship_to.party_gstin_number,
                party_vehicle_number: ship_to.party_vehicle_number
            }, tx);

            if (!ship_to_created) {
                throw new Error('Failed to create ship to');
            }
            logger.info(`--- Ship to created ---`);

            logger.info(`--- Creating parts ---`);
            for (const part of processed_parts) {
                logger.info(`--- Creating part ---`);
                await createSalesParts(sales_invoice_id, {
                    ...part,
                    sales_invoice_id: sales_invoice_id
                }, tx);

                await updateFranchiseInventory(part.franchise_inventory_id, part.part_quantity, tx);
            }

            for (const service of processed_services) {
                logger.info(`--- Creating service ---`);
                await createSalesServices(sales_invoice_id, {
                    ...service,
                    sales_invoice_id: sales_invoice_id
                }, tx);
            }

            logger.info(`--- Creating sales customer vehicle ---`);
            const created_sales_customer_vehicle = await createSalesCustomerVehicle(sales_invoice_id, {
                sales_invoice_id: sales_invoice_id,
                provider_customer_id: provider_customer_id,
                provider_customer_vehicle_id: SalesCustomerVehicles.id,
                vehicle_number: SalesCustomerVehicles.vehicle_number,
                vehicle_type: SalesCustomerVehicles.vehicle_type,
                vehicle_model: SalesCustomerVehicles.vehicle_model,
                vehicle_color: SalesCustomerVehicles.vehicle_color,
                vehicle_fuel_type: SalesCustomerVehicles.vehicle_fuel_type,
                vehicle_transmission: SalesCustomerVehicles.vehicle_transmission,
                vehicle_variant: SalesCustomerVehicles.vehicle_variant,
                vehicle_make_year: SalesCustomerVehicles.vehicle_make_year,
                vehicle_mileage: SalesCustomerVehicles.vehicle_mileage,
                vehicle_insurance_details: typeof SalesCustomerVehicles.vehicle_insurance_details === 'string' 
                    ? SalesCustomerVehicles.vehicle_insurance_details 
                    : JSON.stringify(SalesCustomerVehicles.vehicle_insurance_details),
                vehicle_engine_number: SalesCustomerVehicles.vehicle_engine_number,
                vehicle_chassis_number: SalesCustomerVehicles.vehicle_chassis_number,
                vehicle_registration_number: SalesCustomerVehicles.vehicle_registration_number,
                vehicle_fuel_level: SalesCustomerVehicles.vehicle_fuel_level,
                personal_belongings: SalesCustomerVehicles.personal_belongings,
                dents_images: SalesCustomerVehicles.dents_images || [],
                vehicle_images: SalesCustomerVehicles.vehicle_images || []
            }, tx);

            if (!created_sales_customer_vehicle) {
                throw new Error('Failed to create sales customer vehicle');
            }
            logger.info(`--- Sales customer vehicle created ---`);

            logger.info(`--- Transaction completed successfully ---`);
            return {
                sales_invoice: updated_sales_invoice,
                sales_customer_vehicle: created_sales_customer_vehicle
            };
        });

        logger.info(`--- Transaction completed successfully ---`);
        return returnResponse(res, StatusCodes.OK, "Booking updated successfully", result);

    } catch (error) {
        logger.error(`Error in updateBookingEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in updateBookingEndpoint: ${error.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

export { updateBookingEndpoint };
