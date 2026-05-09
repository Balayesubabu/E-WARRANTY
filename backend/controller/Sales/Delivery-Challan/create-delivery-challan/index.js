import {
  logger,
  returnError,
  returnResponse,
} from "../../../../services/logger.js";
import { StatusCodes } from "http-status-codes";
import {
  getProviderByUserId,
  getFranchiseInventoryById,
  createSalesInvoice,
  createSalesInvoiceParty,
  createSalesParts,
  updateFranchiseInventory,
  createSalesServices,
  createSalesAdditionalCharges,
  checkInvoiceNumber,
  createTransactions,
  getAllDataSalesInvoiceById,
  updateUrl
} from "./query.js";
import { prisma } from "../../../../prisma/db-models.js";
import generateInvoiceNo from "../../../../services/generate-invoice-no.js";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const createDeliveryChallanEndpoint = async (req, res) => {
  try {
    logger.info(`createDeliveryChallanEndpoint`);

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
    logger.info(`--- Fetching provider details for user_id: ${user_id} ---`);
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      logger.error(`--- Provider not found for user_id: ${user_id} ---`);
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }
    logger.info(`--- Provider found for user_id: ${user_id} ---`);

    const data = req.body;
    let {
      provider_customer_id,
      invoice_number,
      prefix,
      sequence_number,
      // franchise_id,
      bill_to,
      ship_to,
      invoice_type = "Delivery_Challan",
      invoice_date,
      terms_and_conditions,
      additional_notes,
      due_date_terms,
      due_date,
      SalesParts = [],
      SalesServices = [],
      SalesAdditionalCharges = [],
      invoice_additional_discount_percentage,
      invoice_additional_discount_amount,
       is_auto_round_off,
      auto_round_off_amount,
      bank_id,
      invoice_status,

      // original_invoice_number, // added
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
     //checking invoice number is unique or not
    const invoiceNumberExists = await checkInvoiceNumber(provider.id,invoice_number)
    if (invoiceNumberExists) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Invoice number already exists`
      );
    }

    let processed_parts = [];
    for (const part of SalesParts) {
      let {
        franchise_inventory_id,
        part_name,
        part_hsn_code,
        part_description,
        part_selling_price,
        part_quantity = 1,
        part_discount_amount = 0,
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
        service_discount_amount = 0,
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
      logger.info(`--- Starting transaction for delivery challan creation ---`);

      logger.info(`--- Creating delivery challan ---`);
      const created_delivery_challan = await createSalesInvoice(
        provider.id,staff_id,
        {
          provider_customer_id,
          franchise_id,
          invoice_number,
          prefix,
          sequence_number,
          invoice_type,
          invoice_status,
          // original_invoice_number, // added
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
          invoice_additional_discount_percentage,
      invoice_additional_discount_amount,
       is_auto_round_off,
      auto_round_off_amount,
      invoice_discount_amount,
      bank_id,
        },
        tx
      );

      if (!created_delivery_challan) {
        throw new Error("Failed to create delivery challan");
      }
      logger.info(`--- Delivery challan created ---`);

      logger.info(`--- Creating sales invoice party ---`);
      const invoice_provider_data = await createSalesInvoiceParty(
        created_delivery_challan.id,
        {
          type: "Provider",
          party_name: provider.company_name,
          party_country_code: provider.user.country_code,
          party_phone: provider.user.phone_number,
          party_email: provider.user.email,
          party_address: provider.company_address,
          party_city: provider.user.city,
          party_state: provider.user.state,
          party_gstin_number: provider.gst_number,
        },
        tx
      );

      if (!invoice_provider_data) {
        throw new Error("Failed to create sales invoice party");
      }
      logger.info(`--- Sales invoice party created ---`);

      logger.info(`--- Creating bill to ---`);
      const bill_to_created = await createSalesInvoiceParty(
        created_delivery_challan.id,
        {
          type: "Bill_To",
          ...bill_to,
        },
        tx
      );
      if (!bill_to_created) throw new Error("Failed to create bill to");

      logger.info(`--- Creating ship to ---`);
      const ship_to_created = await createSalesInvoiceParty(
        created_delivery_challan.id,
        {
          type: "Ship_To",
          ...ship_to,
        },
        tx
      );
      if (!ship_to_created) throw new Error("Failed to create ship to");

      logger.info(`--- Creating parts ---`);
      for (const part of processed_parts) {
        await createSalesParts(
          created_delivery_challan.id,
          {
            ...part,
            sales_invoice_id: created_delivery_challan.id,
          },
          tx
        );
        logger.info(`--- Updating franchise inventory ---`);
        await updateFranchiseInventory(
          part.franchise_inventory_id,
          part.part_quantity,
          tx
        );
      }
      logger.info(`--- updated franchise inventory ---`);

      logger.info(`--- Creating services ---`);
      for (const service of processed_services) {
        await createSalesServices(
          created_delivery_challan.id,
          {
            ...service,
            sales_invoice_id: created_delivery_challan.id,
          },
          tx
        );
      }

      logger.info(`--- Creating additional charges ---`);
      for (const charge of processed_additional_charges) {
        await createSalesAdditionalCharges(
          created_delivery_challan.id,
          {
            ...charge,
            sales_invoice_id: created_delivery_challan.id,
          },
          tx
        );
      }
        await createTransactions(
          created_delivery_challan.id,
          {
            provider_id: provider.id,
            provider_customer_id,
            invoice_type: "Delivery_Order",
            amount: invoice_total_amount,
            money_in: 0,
            money_out: 0,
            transaction_type: "Cash",
            transaction_status: "Paid",
            transaction_id:  null
          },
          tx
        );
      logger.info(`--- Transaction completed successfully ---`);

      return created_delivery_challan;
    });

    const salesInvoiceId = result.id;
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

    return returnResponse(
      res,
      StatusCodes.CREATED,
      "Delivery challan created successfully",
      result
    );
  } catch (error) {
    logger.error(`Error in createDeliveryChallanEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in createDeliveryChallanEndpoint: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { createDeliveryChallanEndpoint };
