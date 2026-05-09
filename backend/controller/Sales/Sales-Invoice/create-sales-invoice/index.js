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
  createProviderBankDetails,
  updateProviderCustomerFinalBalance,
  createSalesParts,
  updateFranchiseInventory,
  createSalesServices,
  createSalesInvoiceTransactions,
  createTransactions,
  createSalesInvoiceParty,
  createSalesAdditionalCharges,
  checkInvoiceNumber,
  createFranchiseOpenInventoryTransaction,
  createFranchiseInventoryTransaction,
  getAllDataSalesInvoiceById,
  updateUrl
} from "./query.js";
import generateInvoiceNo from "../../../../services/generate-invoice-no.js";
import { PrismaClient } from "@prisma/client";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const prisma = new PrismaClient();

const createSalesInvoiceEndpoint = async (req, res) => {
  try {
    logger.info(`createSalesInvoiceEndpoint`);

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
      // franchise_id,
      bill_to,
      ship_to,
      invoice_type = "Sales",
      invoice_status = "New",
      invoice_date,
      invoice_number,
      prefix,
      sequence_number,
      is_invoice_fully_paid,
      invoice_additional_discount_percentage,
      invoice_additional_discount_amount,
      invoice_tds_percentage,
      invoice_tcs_percentage,
      invoice_tds_amount,
      invoice_tcs_amount,
      invoice_shipping_charges = 0,
      is_auto_round_off,
      auto_round_off_amount = 0,
      invoice_advance_amount = 0,
      advance_payment_type,
      advance_amount_online_transaction_id,
      advance_payment_date,
      invoice_payment_status,
      terms_and_conditions,
      additional_notes,
      due_date_terms,
      due_date,
      SalesParts = [],
      SalesServices = [],
      SalesAdditionalCharges = [],
      bank_details,
       apply_tcs,
       apply_tds,
        is_total_amount,
        is_taxable_amount,
        bank_id
    } = data;

    // Initialize totals
    let invoice_total_amount = 0;
    let total_amount_payable = 0;
    let invoice_discount_amount = 0;
    let invoice_gst_amount = 0;
    let invoice_pending_amount = 0;
    let invoice_paid_amount = 0;
    let invoice_total_tax_amount = 0;
    let customer_final_balance = 0;
    let taxable_amount = 0;

 
    let subtotal_parts_services = 0;


    let invoice_total_parts_amount = 0
    let invoice_total_parts_tax_amount = 0
    let invoice_total_services_amount = 0
    let invoice_total_services_tax_amount = 0
    let invoice_total_parts_services_amount = 0
    let invoice_total_parts_services_tax_amount = 0

    //checking invoice number is unique or not
    const invoiceNumberExists = await checkInvoiceNumber(provider.id,invoice_number)
    if (invoiceNumberExists) {
      return returnError(
        res,
        StatusCodes.BAD_REQUEST,
        `Invoice number already exists`
      );
    }

    let franchise_inventory_product_quantity = 0;
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
        part_discount_percentage = 0,
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
        originalGst,
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
        service_discount_percentage = 0,
        service_gst_percentage, 
        rateType,
        service_gst_amount,
        service_total_price,
        originalRate,                
        originalGst,
        products_list = []
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
        originalGst,
        products_list
      });
    }
   
      invoice_total_amount += invoice_total_services_amount;
    invoice_total_tax_amount += invoice_total_services_tax_amount;
    console.log(`invoice_total_tax_amount after services: ${invoice_total_tax_amount}`)

     console.log(`invoice_total_amount after services: ${invoice_total_amount}`)    

    let processed_additional_charges = [];

    let additional_charges_amount = 0
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

  additional_charges_amount += total_amount;
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
    //     (invoice_additional_discount_amount / invoice_total_amount) * 100

    // } else {
    //   invoice_additional_discount_amount = 0;
    //   invoice_additional_discount_percentage = 0;
    // }
    // invoice_additional_discount_percentage = Number(invoice_additional_discount_percentage.toFixed(2));
    // console.log(`invoice_additional_discount_amount: ${invoice_additional_discount_amount}`)
     invoice_total_amount -= invoice_additional_discount_amount;
    invoice_discount_amount += invoice_additional_discount_amount;
       

    console.log(`invoice_total_amount after additional discount: ${invoice_total_amount}`)

    // --- Apply TCS ---
       logger.info(`Invoice total amount before: ${invoice_total_amount}`);
    logger.info(`tcs percentage: ${invoice_tcs_percentage}`);
  logger.info(`invoice discount amount: ${invoice_discount_amount}`);
    // TCS
   if (apply_tcs === true) {
      if (is_total_amount && invoice_tcs_percentage) {
        invoice_total_amount += invoice_tcs_amount;
        invoice_total_tax_amount += invoice_tcs_amount;
      } else if (is_taxable_amount && invoice_tcs_percentage) {
        invoice_total_amount += invoice_tcs_amount;
        invoice_total_tax_amount += invoice_tcs_amount;
      }
    }

    if (apply_tds === true) {
      invoice_total_tax_amount += invoice_tds_amount;
      invoice_total_amount -= invoice_tds_amount;
    }
    
      logger.info(`Invoice total amount after: ${invoice_total_amount}`);
      console.log("Calculated invoice_tcs_amount:", invoice_tcs_amount, {
  invoice_total_amount,
  invoice_discount_amount,
  invoice_tcs_percentage,
});

    // Auto round off
    if (is_auto_round_off) {
      auto_round_off_amount =
        invoice_total_amount - Math.round(invoice_total_amount);
      invoice_total_amount = Math.round(invoice_total_amount);
    } else if (auto_round_off_amount) {
      invoice_total_amount += auto_round_off_amount;
    }

     // --- Invoice Payment Status ---
    logger.info(`--- Processing invoice fully paid ---`);
    
    if (is_invoice_fully_paid) {
      invoice_payment_status = "Paid";
      invoice_paid_amount = invoice_total_amount;
      invoice_pending_amount = 0;
      customer_final_balance = 0;
    } else if (invoice_advance_amount && invoice_advance_amount > 0) {
      invoice_payment_status = "Partially_Paid";
      invoice_paid_amount = invoice_advance_amount;
      invoice_pending_amount = invoice_total_amount - invoice_paid_amount;
      customer_final_balance = invoice_pending_amount;
    } else {
      invoice_payment_status = "Unpaid";
      invoice_paid_amount = 0;
      invoice_pending_amount = invoice_total_amount;
      customer_final_balance = invoice_pending_amount;
    }

    total_amount_payable = invoice_pending_amount

  


    // console.log("taxable amount", invoice_total_parts_services_amount - invoice_total_parts_services_tax_amount + invoice_discount_amount -  invoice_additional_discount_amount)
    // --- Transaction ---
    const result = await prisma.$transaction(async (tx) => {
      // Create Sales Invoice
      const created_sales_invoice = await createSalesInvoice(
        provider.id,staff_id,
        {
          provider_customer_id,
          franchise_id,
          bank_id,
          bill_to,
          ship_to,
          invoice_number,
          prefix,
          sequence_number,
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
          invoice_total_amount: Number(invoice_total_amount.toFixed(2)),
          total_amount_payable,
          invoice_discount_amount,
          invoice_gst_amount: invoice_total_tax_amount,
          invoice_total_tax_amount,
          invoice_total_parts_amount,
          invoice_total_parts_tax_amount,
          invoice_total_services_amount,
          invoice_total_services_tax_amount,
          invoice_total_parts_services_amount,
          invoice_total_parts_services_tax_amount,
          invoice_tds_amount,
          invoice_tcs_amount,
          invoice_pending_amount: Number(invoice_pending_amount.toFixed(2)),
          invoice_paid_amount,
          apply_tcs,
          apply_tds,
          is_total_amount,
          is_taxable_amount,
          bank_id
        },
        tx
      );

      if (!created_sales_invoice)
        throw new Error("Failed to create sales invoice");

      // Update customer balance
      const update_balance = await updateProviderCustomerFinalBalance(
        provider_customer_id,
        customer_final_balance,
        tx
      );
      if (!update_balance) throw new Error("Failed to update customer balance");

      // Create invoice parties
      await createSalesInvoiceParty(
        created_sales_invoice.id,
        {
          sales_invoice_id: created_sales_invoice.id,
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

      await createSalesInvoiceParty(
        created_sales_invoice.id,
        {
          ...bill_to,
          sales_invoice_id: created_sales_invoice.id,
          type: "Bill_To",
        },
        tx
      );
      await createSalesInvoiceParty(
        created_sales_invoice.id,
        {
          ...ship_to,
          sales_invoice_id: created_sales_invoice.id,
          type: "Ship_To",
        },
        tx
      );

      // Create parts and update inventory
      for (const part of processed_parts) {
        await createSalesParts(
          created_sales_invoice.id,
          { ...part, sales_invoice_id: created_sales_invoice.id },
          tx
        );
        await updateFranchiseInventory(
          part.franchise_inventory_id,
          provider.id,
          franchise_id,
          part.part_quantity,
          tx
        );
        await createFranchiseInventoryTransaction(
          provider.id,created_sales_invoice.id,{
          franchise_inventory_id: part.franchise_inventory_id,
          franchise_id: franchise_id,
          provider_id: provider.id,
          quantity:  part.part_quantity,
          action: "reduce",
          stock_changed_by: "invoice",
          closing_stock : franchise_inventory_product_quantity - part.part_quantity
        },
        tx
        );
      }

      // Create services
      for (const service of processed_services) {
        await createSalesServices(
          created_sales_invoice.id,
          { ...service, sales_invoice_id: created_sales_invoice.id },
          tx
        );
      }

      console.log("processed_services", processed_services);
      // Create franchise open inventory transactions for products used in services
      for (const service of processed_services) {
         if (!Array.isArray(service?.products_list) || service.products_list.length === 0) {
    continue; // skip if products_list missing or empty
  }
        for (const product of service.products_list) {
          await createFranchiseOpenInventoryTransaction(
            provider.id,{
              franchise_open_inventory_id: product.franchise_open_inventory_id,
              franchise_id: franchise_id,
              provider_id: provider.id,
              measurement: product.measurement,
              measurement_unit: product.measurement_unit,
              action: "reduce",
              stock_changed_by: "invoice",
              
            },
            tx
          );
        }
      }

      // Create bank details (if provided)
      // if (bank_details) {
      //   await createProviderBankDetails(
      //     created_sales_invoice.id,
      //     { ...bank_details, provider_id: provider.id },
      //     tx
      //   );
      // }
      const additional_charges = [];
      // Create additional charges
      for (const charge of processed_additional_charges) {
        const additional_charge = await createSalesAdditionalCharges(
          created_sales_invoice.id,
          { ...charge, sales_invoice_id: created_sales_invoice.id },
          tx
        );
         additional_charges.push(additional_charge);
       
      }

      // Create transactions if paid
      if (invoice_paid_amount > 0) {
        await createSalesInvoiceTransactions(
          created_sales_invoice.id,
          {
            invoice_type: "Sales",
            amount: invoice_paid_amount,
            total_amount: Number(invoice_total_amount.toFixed(2)),
            pending_amount: Number(invoice_pending_amount.toFixed(2)),
            paid_amount: invoice_paid_amount,
            transaction_type: advance_payment_type,
            transaction_status: "Paid",
            transaction_id: advance_amount_online_transaction_id || "",
          },
          tx
        );
      }
        console.log("creating transaction table")

        await createTransactions(
          created_sales_invoice.id,
          {
            provider_id: provider.id,
            provider_customer_id,
            invoice_type: "Sales",
            amount: Number(invoice_total_amount.toFixed(2)),
            money_in: invoice_paid_amount,
            transaction_type: advance_payment_type,
            transaction_status: "Paid",
            transaction_id: advance_amount_online_transaction_id || "",
          },
          tx
        );
      
    logger.info(`--- Transaction completed successfully ---`);
  
      return created_sales_invoice;
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
      "Sales invoice created successfully",
      result
    );
  } catch (error) {
    logger.error(`Error in createSalesInvoiceEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in createSalesInvoiceEndpoint: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { createSalesInvoiceEndpoint };
