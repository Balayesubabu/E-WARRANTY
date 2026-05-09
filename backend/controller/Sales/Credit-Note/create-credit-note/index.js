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
  updateProviderCustomerFinalBalance,
  createSalesParts,
  // updateFranchiseInventory,
  createSalesServices,
  createSalesInvoiceTransactions,
  createTransactions,
  createSalesInvoiceParty,
  createSalesAdditionalCharges,
  checkInvoiceNumber,
  getAllDataSalesInvoiceById,
  getAllDataSalesInvoiceById1,
  updateUrl
} from "./query.js";
import generateInvoiceNo from "../../../../services/generate-invoice-no.js";
import { PrismaClient } from "@prisma/client";
import { pdfGenerator } from "../../../InvoiceSettings/pdfGenerator.js";
import { uploadPdfToS3 } from "../../../../services/upload.js";

const prisma = new PrismaClient();

const createCreditNoteEndpoint = async (req, res) => {
  try {
    logger.info(`createCreditNoteEndpoint`);

    
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
    // Fetch provider
    const provider = await getProviderByUserId(user_id);
    if (!provider) {
      return returnError(res, StatusCodes.NOT_FOUND, `Provider not found`);
    }

    const data = req.body;
    let {
      provider_customer_id,
      // franchise_id,
      bill_to,
      ship_to,
      // original_invoice_number,
      invoice_number,
      sequence_number,
      prefix,
      invoice_type = "Credit_Note",
      invoice_status = "Pending",
      invoice_date,
      is_invoice_fully_paid,
      invoice_additional_discount_percentage,
      invoice_additional_discount_amount,
      invoice_tds_percentage,
      invoice_tcs_percentage,
      invoice_tcs_amount,
      invoice_tds_amount,
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
      SalesParts = [],
      SalesServices = [],
      SalesAdditionalCharges = [],
      apply_tcs,
      apply_tds,
      is_total_amount,
      is_taxable_amount,
      bank_id,
      link_to
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
        service_discount_percentage = 0,
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


    // --- Generate invoice number ---
    // const invoice_number = await generateInvoiceNo(provider.id, invoice_type);

    // --- Transaction: Create invoice, parts, services, charges ---
    const result = await prisma.$transaction(async (tx) => {
      const created_credit_note = await createSalesInvoice(
        provider.id,staff_id,
        {
          provider_customer_id,
          franchise_id,
          bill_to,
          ship_to,
          invoice_number,
          sequence_number,
          prefix,
          // original_invoice_number,
          invoice_type,
          invoice_status: "New",
          invoice_date: new Date(invoice_date),
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
          advance_payment_date: advance_payment_date
            ? new Date(advance_payment_date)
            : null,
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
          apply_tcs,
        apply_tds,
        is_total_amount,
        is_taxable_amount,
        bank_id,
        link_to
        },
        tx
      );

      if (!created_credit_note) throw new Error("Failed to create credit note");

      // Update customer balance
      await updateProviderCustomerFinalBalance(
        provider_customer_id,
        customer_final_balance,
        tx
      );

      // Create invoice parties (provider, bill to, ship to)
      await createSalesInvoiceParty(
        created_credit_note.id,
        {
          sales_invoice_id: created_credit_note.id,
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
        created_credit_note.id,
        {
          ...bill_to,
          type: "Bill_To",
          sales_invoice_id: created_credit_note.id,
        },
        tx
      );
      await createSalesInvoiceParty(
        created_credit_note.id,
        {
          ...ship_to,
          type: "Ship_To",
          sales_invoice_id: created_credit_note.id,
        },
        tx
      );

      // Create parts
      for (const part of processed_parts) {
        await createSalesParts(
          created_credit_note.id,
          { ...part, sales_invoice_id: created_credit_note.id },
          tx
        );
        // await updateFranchiseInventory(
        //   part.franchise_inventory_id,
        //   part.part_quantity,
        //   tx
        // );
      }

      // Create services
      for (const service of processed_services) {
        await createSalesServices(
          created_credit_note.id,
          { ...service, sales_invoice_id: created_credit_note.id },
          tx
        );
      }

      // Create additional charges
      for (const charge of processed_additional_charges) {
        await createSalesAdditionalCharges(
          created_credit_note.id,
          { ...charge, sales_invoice_id: created_credit_note.id },
          tx
        );
      }

      // Create transactions if payment exists
      if (invoice_paid_amount > 0) {
        await createSalesInvoiceTransactions(
          created_credit_note.id,
          {
            invoice_type: "Credit_Note",
            amount: invoice_paid_amount,
            total_amount: invoice_total_amount,
            pending_amount: invoice_pending_amount,
            paid_amount: invoice_paid_amount,
            transaction_type: advance_payment_type,
            transaction_status: "Paid",
            transaction_id: advance_amount_online_transaction_id || "",
          },
          tx
        );
      }

        await createTransactions(
          created_credit_note.id,
          {
            provider_id: provider.id,
            provider_customer_id: provider_customer_id,
            invoice_type: "Credit_Note",
            amount: invoice_total_amount,
            money_in :0,
            money_out : invoice_paid_amount,
            transaction_type: advance_payment_type,
            transaction_status: "Paid",
            transaction_id: advance_amount_online_transaction_id || "",
          },
          tx
        );

      return created_credit_note;
    });

    const salesInvoiceId = result.id;
      
      const salesInvoice = await getAllDataSalesInvoiceById(salesInvoiceId);
      if (!salesInvoice) {
          return returnError(res, StatusCodes.NOT_FOUND, "Sales invoice not found");
      }
      console.log("salesInvoice: ", salesInvoice);

      let linked_from_pending_amount = 0;
      linked_from_pending_amount =
        Number(salesInvoice.invoice_pending_amount.toFixed(2)) -
        Number(salesInvoice.linked_from_paid_amount.toFixed(2));

      if (linked_from_pending_amount < 0) {
        salesInvoice.linked_from_pending_amount = Math.abs(linked_from_pending_amount).toFixed(2);
    }
    if(is_invoice_fully_paid){
      salesInvoice.linked_from_pending_amount = 0;
    }
    let updated_payment_status;
    if(salesInvoice.linked_from_pending_amount === 0){
      updated_payment_status = "Paid";
    }
    else if(salesInvoice.linked_from_pending_amount > 0){
      updated_payment_status = "Partially_Paid";
    }
    else{
      updated_payment_status = "Unpaid";
    }


      const plainInvoice = JSON.parse(JSON.stringify(salesInvoice));
      console.log("plainInvoice: ", plainInvoice);

      const pdfBuffer = await pdfGenerator(provider.id, plainInvoice, "Sales");

      const fileName = `invoice_${salesInvoiceId}_provider_${franchise_id}`;
      const s3Url = await uploadPdfToS3(pdfBuffer, fileName, 'invoices');
      logger.info(`Invoice uploaded to S3: ${s3Url}`);
      const updated_invoice = await updateUrl(salesInvoiceId, s3Url, updated_payment_status);
      if(link_to){
        const salesInvoiceId1 = link_to;
      const salesInvoice1 = await getAllDataSalesInvoiceById1(salesInvoiceId1,result.id);
      if (!salesInvoice1) {
          return returnError(res, StatusCodes.NOT_FOUND, "Sales invoice not found");
      }
      console.log("salesInvoice1: ", salesInvoice1);

       let linked_invoice_balance = 0;
      if(salesInvoice1.linked_invoice_number){
        linked_invoice_balance = salesInvoice1.invoice_pending_amount.toFixed(2) - salesInvoice1.linked_invoice_total_amount.toFixed(2);
        if(linked_invoice_balance < 0){
          linked_invoice_balance = 0;
        }
      }
      salesInvoice1.linked_invoice_balance = linked_invoice_balance;
      let updated_payment_status;
      if(salesInvoice1.linked_invoice_balance === 0) {
        updated_payment_status = "Paid";
      }
      else if(salesInvoice1.linked_invoice_balance > 0) {
        updated_payment_status = "Partially_Paid";
      }
      else{
        updated_payment_status = "Unpaid";
      }

      const plainInvoice1 = JSON.parse(JSON.stringify(salesInvoice1));
      console.log("plainInvoice1: ", plainInvoice1);

      const pdfBuffer1 = await pdfGenerator(provider.id, plainInvoice1, "Sales");

      const fileName1 = `invoice_${salesInvoiceId1}_provider_${franchise_id}`;
      const s3Url1 = await uploadPdfToS3(pdfBuffer1, fileName1, 'invoices');
      logger.info(`Invoice uploaded to S3: ${s3Url1}`);
      const updated_invoice1 = await updateUrl(salesInvoiceId1, s3Url1, updated_payment_status);
      
    }

    return returnResponse(
      res,
      StatusCodes.CREATED,
      "Credit note created successfully",
      result
    );
  } catch (error) {
    logger.error(`Error in createCreditNoteEndpoint: ${error}`);
    return returnError(
      res,
      StatusCodes.INTERNAL_SERVER_ERROR,
      `Error in createCreditNoteEndpoint: ${error.message}`
    );
  } finally {
    await prisma.$disconnect();
  }
};

export { createCreditNoteEndpoint };
