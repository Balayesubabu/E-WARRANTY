import { logger, returnError, returnResponse } from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
    getProviderByUserId,
    getSalesInvoiceById,
    getFranchiseInventoryById,
    updateSalesInvoice,
    updateSalesInvoiceParty,
    deleteSalesParts,
    deleteSalesServices,
    deleteSalesAdditionalCharges,
    createSalesParts,
    createSalesServices,
    createSalesAdditionalCharges,
    getAllDataSalesInvoiceById,
    updateUrl
} from "./query.js";
import { prisma } from "../../../../prisma/db-models.js";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const updateQuotationEndpoint = async (req, res) => {
    try {
        logger.info(`updateQuotationEndpoint`);

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
        const franchise_id = req.franchise_id
        const sales_invoice_id = req.params.id;

        logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
        const provider = await getProviderByUserId(user_id);
        if (!provider) {
            logger.error(`--- Provider not found for user_id: ${user_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
        }
        logger.info(`--- Provider found for user_id: ${user_id} ---`);

        logger.info(`--- Fetching quotation details for id: ${sales_invoice_id} ---`);
        const quotation = await getSalesInvoiceById(sales_invoice_id);
        if (!quotation) {
            logger.error(`--- Quotation not found for id: ${sales_invoice_id} ---`);
            return returnError(res, StatusCodes.NOT_FOUND, `Quotation not found`);
        }
        logger.info(`--- Quotation found for id: ${sales_invoice_id} ---`);

        if (quotation.invoice_type !== "Quotation") {
            logger.error(`--- Invalid invoice type: ${quotation.invoice_type} ---`);
            return returnError(res, StatusCodes.BAD_REQUEST, `Invalid invoice type`);
        }

        const data = req.body;
        let {
            provider_customer_id,
            sequence_number,
            prefix,
            // franchise_id,
            bill_to,
            ship_to,
            invoice_date,
            terms_and_conditions,
            additional_notes,
            due_date_terms,
            due_date,
            SalesParts = [],
            SalesServices = [],
            SalesAdditionalCharges = [],
            is_auto_round_off,
            auto_round_off_amount,
            invoice_additional_discount_percentage,
      invoice_additional_discount_amount,
      bank_id
        } = data;

           let invoice_total_amount = 0;
    let invoice_gst_amount = 0;
    let invoice_total_tax_amount = 0;

    let invoice_total_parts_amount = 0,
    invoice_total_parts_tax_amount = 0,
    invoice_total_services_amount = 0,
    invoice_total_services_tax_amount = 0,
    invoice_total_parts_services_amount = 0,
    invoice_total_parts_services_tax_amount = 0,
    invoice_discount_amount = 0;
    console.log("invoice total amount xyz",invoice_total_amount)
    

    let processed_parts = [];
    for (const part of SalesParts) {
      let {
        franchise_inventory_id,
        part_name,
        part_hsn_code,
        part_description,
        part_selling_price,
        part_quantity = 1,
        part_discount_amount,
        part_discount_percentage,
        part_mesuring_unit,
        part_gst_percentage = 0,
        part_gst_amount,
        part_total_price,
        rateType,
        originalRate,                
        originalGst
      } = part;

      const franchiseInventory = await getFranchiseInventoryById(
        franchise_inventory_id
      );
      if (!franchiseInventory) {
        return returnError(
          res,
          StatusCodes.BAD_REQUEST,
          `Franchise inventory not found`
        );
      }

       console.log(`invoice total abcd: ${invoice_total_amount}`)
      console.log(`part_selling_price: ${part_selling_price}`);

      const part_amount = part_selling_price * part_quantity;
      console.log(`part_amount: ${part_amount}`);
      
      const part_after_discount = part_amount - part_discount_amount;
      console.log(`part_after_discount: ${part_after_discount}`);

      // const part_gst_amount = part_after_discount * (part_gst_percentage / 100);
      // console.log(`part_gst_amount: ${part_gst_amount}`);

      // const part_total_price = part_after_discount + part_gst_amount;
      // console.log(`part_total_price: ${part_total_price}`);

      invoice_total_parts_amount += part_total_price;
      console.log(`invoice_total_parts_amount: ${invoice_total_parts_amount}`);

      invoice_total_parts_tax_amount += part_gst_amount ;
      console.log(`invoice_total_parts_tax_amount: ${invoice_total_parts_tax_amount}`);

      invoice_total_parts_services_amount += part_total_price;
      console.log(`invoice_total_parts_services_amount: ${invoice_total_parts_services_amount}`);

      invoice_total_parts_services_tax_amount += part_gst_amount ;
      console.log(`invoice_total_parts_services_tax_amount: ${invoice_total_parts_services_tax_amount}`);

      invoice_discount_amount += part_discount_amount ;
      console.log(`invoice_discount_amount: ${invoice_discount_amount}`)

    
     
    

      processed_parts.push({
        franchise_inventory_id,
        part_name,
        part_hsn_code,
        part_description,
        part_selling_price,
        part_quantity,
        part_discount_amount,
        part_discount_percentage,
        part_mesuring_unit,
        part_gst_percentage,
        part_gst_amount,
        part_total_price,
        rateType,
        originalRate,
        originalGst
      });
    }

    invoice_total_amount += invoice_total_parts_amount;
    invoice_total_tax_amount += invoice_total_parts_tax_amount;
    console.log(`invoice_total_tax_amount after parts: ${invoice_total_tax_amount}`)

     console.log(`invoice_total_amount after parts: ${invoice_total_amount}`)

    let processed_services = [];
    for (const service of SalesServices) {
      let {
        franchise_service_id,
        service_name,
        service_sac_number,
        service_description,
        service_price,
        service_discount_amount,
        service_discount_percentage,
        service_gst_percentage = 0,
        service_gst_amount,
        service_total_price,
        rateType,
        originalRate,                
        originalGst
      } = service;


       console.log(`service_price: ${service_price}`);

const service_amount = service_price; // No quantity multiplication needed since it's always 1
console.log(`service_amount: ${service_amount}`);

const service_after_discount = service_amount - service_discount_amount;
console.log(`service_after_discount: ${service_after_discount}`);

// const service_gst_amount = service_after_discount * (service_gst_percentage / 100);
// console.log(`service_gst_amount: ${service_gst_amount}`);

// const service_total_price = service_after_discount + service_gst_amount;
// console.log(`service_total_price: ${service_total_price}`);

invoice_total_services_amount += service_total_price;
console.log(`invoice_total_services_amount: ${invoice_total_services_amount}`);

invoice_total_services_tax_amount += service_gst_amount;
console.log(`invoice_total_services_tax_amount: ${invoice_total_services_tax_amount}`);

invoice_total_parts_services_amount += service_total_price;
console.log(`invoice_total_parts_services_amount: ${invoice_total_parts_services_amount}`);

invoice_total_parts_services_tax_amount += service_gst_amount;
console.log(`invoice_total_parts_services_tax_amount: ${invoice_total_parts_services_tax_amount}`);

invoice_discount_amount += service_discount_amount ;
      console.log(`invoice_discount_amount: ${invoice_discount_amount}`)

      processed_services.push({
        franchise_service_id,
        service_name,
        service_sac_number,
        service_description,
        service_price,
        service_discount_amount,
        service_discount_percentage,
        service_gst_percentage,
        service_gst_amount,
        service_total_price,
        rateType,
        originalRate,
        originalGst
      });
    }
   
      invoice_total_amount += invoice_total_services_amount;
    invoice_total_tax_amount += invoice_total_services_tax_amount;
    console.log(`invoice_total_tax_amount after services: ${invoice_total_tax_amount}`)

     console.log(`invoice_total_amount after services: ${invoice_total_amount}`)



    let processed_additional_charges = [];

for (const charge of SalesAdditionalCharges) {
  let { name, amount, gst_percentage = 0 } = charge;

  const gst_amount = amount * (gst_percentage / 100);
  console.log(`gst_amount: ${gst_amount}`);

  const total_amount = amount + gst_amount;
  console.log(`total_amount: ${total_amount}`);

  invoice_gst_amount += gst_amount;
  console.log(`invoice_gst_amount: ${invoice_gst_amount}`);

  // ✅ push inside loop
  processed_additional_charges.push({
    name,
    amount,
    gst_percentage,
    gst_amount,
    total_amount,
  });

  // ✅ update totals inside loop
  invoice_total_amount += total_amount;
  console.log(`invoice_total_amount after additional charges: ${invoice_total_amount}`);

  invoice_total_tax_amount += gst_amount;
  console.log(`invoice_total_tax_amount after additional charges: ${invoice_total_tax_amount}`);
}

    


    // if (
    //   invoice_additional_discount_percentage &&
    //   !invoice_additional_discount_amount
    // ) {
    //   invoice_additional_discount_amount =
    //     invoice_total_amount *
    //     (invoice_additional_discount_percentage / 100);
    // } else if (
    //   !invoice_additional_discount_percentage &&
    //   invoice_additional_discount_amount
    // ) {
    //   invoice_additional_discount_percentage =
    //     (invoice_additional_discount_amount / invoice_total_amount) * 100;
    // } else {
    //   invoice_additional_discount_amount = 0;
    //   invoice_additional_discount_percentage = 0;
    // }
    //  invoice_additional_discount_percentage = Number(invoice_additional_discount_percentage.toFixed(2));
    // console.log(`invoice_additional_discount_amount: ${invoice_additional_discount_amount}`)
     invoice_total_amount -= invoice_additional_discount_amount;
    invoice_discount_amount += invoice_additional_discount_amount;
       

    console.log(`invoice_total_amount after additional discount: ${invoice_total_amount}`)

         // Auto round off
    if (is_auto_round_off) {
      auto_round_off_amount =
        invoice_total_amount - Math.round(invoice_total_amount);
      invoice_total_amount = Math.round(invoice_total_amount);
    } else if (auto_round_off_amount) {
      invoice_total_amount += auto_round_off_amount;
    }
        logger.info(`--- Wrapping all database operations in a transaction ---`);
        const result = await prisma.$transaction(async (tx) => {
            logger.info(`--- Starting transaction for quotation update ---`);

            logger.info(`--- Updating quotation ---`);
            const updated_quotation = await updateSalesInvoice(sales_invoice_id, staff_id,provider.id,{
                provider_customer_id,
                invoice_number : quotation.invoice_number,
                prefix,
                sequence_number,
                franchise_id,
                invoice_date: new Date(invoice_date),
                terms_and_conditions,
                additional_notes,
                due_date_terms,
                due_date: due_date ? new Date(due_date) : null,
                invoice_total_amount,
                invoice_gst_amount,
                invoice_total_tax_amount,
                invoice_total_parts_amount,
                invoice_total_parts_tax_amount,
                invoice_total_services_amount,
                invoice_total_services_tax_amount,
                invoice_total_parts_services_amount,
                invoice_total_parts_services_tax_amount,
                is_auto_round_off,
            auto_round_off_amount,
            invoice_additional_discount_percentage,
      invoice_additional_discount_amount,
      invoice_discount_amount,
      bank_id: bank_id ? bank_id : quotation.bank_id
            }, tx);

            if (!updated_quotation) {
                throw new Error('Failed to update quotation');
            }
            logger.info(`--- Quotation updated ---`);

            logger.info(`--- Updating bill to ---`);
            const bill_to_updated = await updateSalesInvoiceParty(sales_invoice_id, "Bill_To", {
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

            if (!bill_to_updated) {
                throw new Error('Failed to update bill to');
            }
            logger.info(`--- Bill to updated ---`);

            logger.info(`--- Updating ship to ---`);
            const ship_to_updated = await updateSalesInvoiceParty(sales_invoice_id, "Ship_To", {
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

            if (!ship_to_updated) {
                throw new Error('Failed to update ship to');
            }
            logger.info(`--- Ship to updated ---`);

            logger.info(`--- Deleting existing parts ---`);
            await deleteSalesParts(sales_invoice_id, tx);

            logger.info(`--- Deleting existing services ---`);
            await deleteSalesServices(sales_invoice_id, tx);

            logger.info(`--- Deleting existing additional charges ---`);
            await deleteSalesAdditionalCharges(sales_invoice_id, tx);

            logger.info(`--- Creating new parts ---`);
            for (const part of processed_parts) {
                logger.info(`--- Creating part ---`);
                await createSalesParts(sales_invoice_id, {
                    ...part,
                    sales_invoice_id: sales_invoice_id
                }, tx);
            }

            logger.info(`--- Creating new services ---`);
            for (const service of processed_services) {
                logger.info(`--- Creating service ---`);
                await createSalesServices(sales_invoice_id, {
                    ...service,
                    sales_invoice_id: sales_invoice_id
                }, tx);
            }

            logger.info(`--- Creating additional charges ---`);

            for (const charge of processed_additional_charges) {
                logger.info(`--- Creating additional charge ---`);
                await createSalesAdditionalCharges(sales_invoice_id, {
                    ...charge,
                    sales_invoice_id: sales_invoice_id
                }, tx);
            }
            logger.info(`--- Transaction completed successfully ---`);

            return updated_quotation;
        });

        const salesInvoiceId = result.id
            const salesInvoice = await getAllDataSalesInvoiceById(salesInvoiceId);
          if (!salesInvoice) {
              return returnError(res, StatusCodes.NOT_FOUND, "Sales invoice not found");
          }
          console.log("salesInvoice: ", salesInvoice);

          const plainInvoice = JSON.parse(JSON.stringify(salesInvoice));
          console.log("plainInvoice: ", plainInvoice);

          const pdfBuffer = await pdfGenerator(provider.id, plainInvoice, "Sales");

          const fileName = `invoice_${salesInvoiceId}_provider_${franchise_id}`;
          const s3Url = await uploadPdfToS3(pdfBuffer, fileName, 'invoices');
          logger.info(`Invoice uploaded to S3: ${s3Url}`);

          const updated_invoice = await updateUrl(salesInvoiceId, s3Url);

        return returnResponse(res, StatusCodes.OK, "Quotation updated successfully", result);

    } catch (error) {
        logger.error(`Error in updateQuotationEndpoint: ${error}`);
        return returnError(res, StatusCodes.INTERNAL_SERVER_ERROR, `Error in updateQuotationEndpoint: ${error.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

export { updateQuotationEndpoint };