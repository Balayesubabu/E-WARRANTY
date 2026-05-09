import {logger,returnError,returnResponse} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {  getProviderByUserId, getBooking, getProviderCustomer, createSalesInvoiceFromBooking,createSalesInvoiceParty,createSalesCustomerVehicle,getInvoiceNumberFromId,updateInvoiceNumberFromId,updateBookingStatus,getAllDataBooking,updateUrl} from "./query.js";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";
const convertBookingToSalesInvoiceEndpoint = async (req, res) => {
    try {
        logger.info(`convertBookingToSalesInvoiceEndpoint`);
        let user_id;
        let staff_id;
        if(req.type == 'staff'){
           user_id = req.user_id;
            staff_id = req.staff_id;
        }
        if(req.type == 'provider'){
            user_id = req.user_id;
            staff_id = null;
        }
        const franchise_id = req.franchise_id;
        const {booking_id} = req.params;
        const data = req.body;
        let {
            provider_customer_id,
            provider_vehicle_id,
            bill_to,
            ship_to,
            original_invoice_number,
            invoice_type = "Booking",
            invoice_status,
            invoice_date,
            invoice_total_amount,
            invoice_pending_amount,
            invoice_paid_amount,
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
            next_service_date,
            next_service_kilometers,
            parts_list,
            services_list,
            SalesCustomerVehicles
        } = data;

        

        logger.info(`--- Fetching provider id from the user id ${req.user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found with user id ${req.user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found with user id ${req.user_id}`);
        }
        logger.info(`--- Provider found with user id ${req.user_id} ---`);

        const getInvoiceNumber = await getInvoiceNumberFromId(provider.id,franchise_id);
        let invoice_number;
        let prefix;
        let sequence_number;
        if (!getInvoiceNumber) {
            logger.error(`--- Not found invoice number in quicksettings table ---`);
            prefix = 'BO';
            sequence_number = 1;
            invoice_number = '1';
        }
        else{
            prefix = getInvoiceNumber.prefix || '';
            sequence_number =  Number(getInvoiceNumber.sequence_number) + 1;
            invoice_number = `${prefix}${sequence_number}`;
        }
        const checkBooking = await getBooking(booking_id, provider.id, franchise_id);
        if (!checkBooking) {
            logger.error(`--- Booking not found with id ${booking_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Booking not found with id ${booking_id}`);
        }
        logger.info(`--- Booking found with id ${booking_id} ---`);

        logger.info(`--- Fetching customer details ---`);
        const customer = await getProviderCustomer(checkBooking.customer_id, provider.id);
        if (!customer) {
            logger.error(`--- Customer not found with id ${checkBooking.customer_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Customer not found with id ${checkBooking.customer_id}`);
        }
        logger.info(`--- Customer found with id ${checkBooking.customer_id} ---`);

        logger.info(`--- Converting booking to sales invoice ---`);
        const salesInvoiceData = await createSalesInvoiceFromBooking(invoice_number,data,franchise_id,provider.id,staff_id,booking_id)
        if (!salesInvoiceData) {
            logger.error(`--- Error in converting booking to sales invoice ---`);
            return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in converting booking to sales invoice`);
        }

        // logger.info(`--- Fetching and updating booking parts details ---`);
        // const updateOpenInventory =  updateOpenInventoryTransaction(parts_list, provider.id, franchise_id);
        // if (!updateOpenInventory) {
        //     logger.error(`--- Error in updating open inventory transaction ---`);
        //     return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in updating open inventory transaction`);
        // }
        // logger.info(`--- Open inventory transaction updated successfully ---`);
        // const updateServicesList = await updateServicesInventory(services_list, provider.id, franchise_id);
        // if (!updateServicesList) {
        //     logger.error(`--- Error in updating services inventory transaction ---`);
        //     return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in updating services inventory transaction`);
        // }

        logger.info(`--- Booking technicians details found for booking id ${checkBooking.id} ---`);

         logger.info(`--- Creating sales invoice party ---`);
            const invoice_provider_data = await createSalesInvoiceParty(salesInvoiceData.id, {
                sales_invoice_id: salesInvoiceData.id,
                type: "Provider",
                party_name: provider.company_name,
                party_country_code: provider.user.country_code,
                party_phone: provider.user.phone_number,
                party_email: provider.user.email,
                party_address: provider.company_address,
                party_city: provider.user.city,
                party_state: provider.user.state,
                party_gstin_number: provider.gst_number
            });
            if (!invoice_provider_data) {
                logger.error(`--- Error in creating sales invoice provider party ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in creating sales invoice provider party`);
            }
            logger.info(`--- Creating bill to ---`);
            const bill_to_created = await createSalesInvoiceParty(salesInvoiceData.id, {
                sales_invoice_id: salesInvoiceData.id,
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
            });

            if (!bill_to_created) {
                logger.error(`--- Error in creating sales invoice bill to party ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in creating sales invoice bill to party`);
            }
            logger.info(`--- Bill to created ---`);

            logger.info(`--- Creating ship to ---`);
            const ship_to_created = await createSalesInvoiceParty(salesInvoiceData.id, {
                sales_invoice_id: salesInvoiceData.id,
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
            });
            if (!ship_to_created) {
                logger.error(`--- Error in creating sales invoice ship to party ---`);
                return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in creating sales invoice ship to party`);
            }

            logger.info(`--- Creating sales customer vehicle ---`);
            const created_sales_customer_vehicle = await createSalesCustomerVehicle(salesInvoiceData.id, {
                sales_invoice_id: salesInvoiceData.id,
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
            });

    const updateInvoiceNumber = await updateInvoiceNumberFromId(provider.id, franchise_id, prefix, sequence_number);
    if (!updateInvoiceNumber) {
        logger.error(`--- Error in updating invoice number in quicksettings table ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in updating invoice number in quicksettings table`);
    }
    const updateBooking = await updateBookingStatus(booking_id, provider.id, franchise_id,staff_id);
    if (!updateBooking) {
        logger.error(`--- Error in updating booking status ---`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in updating booking status`);
    }
    logger.info(`--- Booking status updated successfully ---`);
    logger.info(`--- Booking converted to sales invoice successfully ---`);

    const bookingId = checkBooking.id;
    const booking = await getAllDataBooking(bookingId, provider.id, franchise_id);
    if (!booking) {
        return returnError(res, StatusCodes.NOT_FOUND, "Booking not found");
    }
    const plainInvoice = JSON.parse(JSON.stringify(booking));
    console.log("plainInvoice: ", plainInvoice);

    const pdfBuffer = await pdfGenerator(provider.id, plainInvoice, "Booking");

    const fileName = `booking_invoice_${bookingId}_provider_${franchise_id}`;
    const s3Url = await uploadPdfToS3(pdfBuffer, fileName, 'invoices');
    logger.info(`Booking Invoice uploaded to S3: ${s3Url}`);

    const updated_invoice = await updateUrl(salesInvoiceData.id, s3Url, "Booking");

    return returnResponse(res, StatusCodes.OK, `Booking converted to sales invoice successfully`, salesInvoiceData);
    }
    catch (error) {
        logger.error(`Error in convertBookingToSalesInvoiceEndpoint: ${error.message}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }

}

export { convertBookingToSalesInvoiceEndpoint };